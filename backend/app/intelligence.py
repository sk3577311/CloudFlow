# app/intelligence.py
import asyncio
import time
import json
from statistics import mean
from typing import List, Dict, Any

from app.redis_client import redis_client
from app.ws_manager import ws_manager
from app.utils.alerts import send_slack_alert
from app.database import SessionLocal
from app.models import AuditLog
from app.config import settings

# Config
FORECAST_WINDOW = 5
ANOMALY_THRESHOLD = 25  # percent deviation
ALERT_COOLDOWN_SECONDS = int(getattr(settings, "INTEL_ALERT_COOLDOWN", 60))  # rate-limit Slack alerts

# in-memory last-alert timestamps (keeps things simple; persists to Redis if you want cross-process)
_last_alert_ts: Dict[str, float] = {}


async def get_recent_metrics(n: int = 20) -> List[Dict[str, Any]]:
    """Fetch the last n metrics from Redis (most recent first). Return oldest->newest list."""
    try:
        raw_data = await redis_client.lrange("taskflow:metrics", 0, n - 1)
        # raw_data are bytes/strings; decode if needed and parse
        data = []
        for d in raw_data:
            try:
                if isinstance(d, (bytes, bytearray)):
                    d = d.decode("utf-8")
                data.append(json.loads(d))
            except Exception:
                # skip corrupted entries
                continue
        # redis lrange returns most recent first; we want chronological order
        return list(reversed(data))
    except Exception as e:
        print("⚠️ Error reading metrics:", e)
        return []


def moving_average_forecast(values: List[float], window: int = 5) -> List[float]:
    """Return a simple moving-average forecast (repeat avg for the next `window` points)."""
    if not values:
        return []
    if len(values) < window:
        # repeat last known value to keep chart stable until we have enough samples
        return [values[-1]] * window
    avg = mean(values[-window:])
    return [avg for _ in range(window)]


async def should_send_alert(key: str) -> bool:
    """Rate limit alerts by key (e.g. 'cpu', 'memory')."""
    now = time.time()
    last = _last_alert_ts.get(key, 0)
    if now - last < ALERT_COOLDOWN_SECONDS:
        return False
    _last_alert_ts[key] = now
    return True


async def detect_anomalies(metrics: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect anomalies based on deviation from recent mean.
    Returns list of anomaly dicts with shape:
      { target, ts, value, severity }
    """
    if len(metrics) < 5:
        return []

    cpu_values = [float(m.get("cpu", 0) or 0) for m in metrics]
    mem_values = [float(m.get("memory", 0) or 0) for m in metrics]

    avg_cpu = mean(cpu_values)
    avg_mem = mean(mem_values)

    anomalies = []
    last = metrics[-1]
    last_cpu = float(last.get("cpu", 0) or 0)
    last_mem = float(last.get("memory", 0) or 0)
    now_ts = int(time.time() * 1000)

    # CPU anomaly
    if abs(last_cpu - avg_cpu) > ANOMALY_THRESHOLD:
        anomalies.append({
            "target": "cpu",
            "ts": now_ts,
            "value": last_cpu,
            "severity": "high",
        })

    # Memory anomaly
    if abs(last_mem - avg_mem) > ANOMALY_THRESHOLD:
        anomalies.append({
            "target": "memory",
            "ts": now_ts,
            "value": last_mem,
            "severity": "high",
        })

    return anomalies


async def intelligence_loop(interval: float = 5.0):
    """
    Main intelligence loop:
      - reads recent metrics from Redis
      - computes simple moving-average forecasts and broadcasts them
      - detects anomalies, writes AuditLog entries (actor=SYSTEM), broadcasts audit + anomaly events,
        and sends rate-limited Slack alerts.
    """
    print("🧠 Intelligence loop started (interval:", interval, "s)")
    while True:
        try:
            metrics = await get_recent_metrics(30)
            if not metrics:
                await asyncio.sleep(interval)
                continue

            cpu_values = [float(m.get("cpu", 0) or 0) for m in metrics]
            mem_values = [float(m.get("memory", 0) or 0) for m in metrics]

            # Forecasts (simple moving average)
            cpu_forecast = moving_average_forecast(cpu_values, window=FORECAST_WINDOW)
            mem_forecast = moving_average_forecast(mem_values, window=FORECAST_WINDOW)

            ts_base = int(time.time() * 1000)
            cpu_forecast_data = [{"ts": ts_base + i * int(interval * 1000), "value": float(v)} for i, v in enumerate(cpu_forecast)]
            mem_forecast_data = [{"ts": ts_base + i * int(interval * 1000), "value": float(v)} for i, v in enumerate(mem_forecast)]

            # Broadcast forecasts
            try:
                await ws_manager.broadcast({
                    "type": "forecast",
                    "target": "cpu",
                    "values": cpu_forecast_data,
                })
                await ws_manager.broadcast({
                    "type": "forecast",
                    "target": "memory",
                    "values": mem_forecast_data,
                })
            except Exception as e:
                print("⚠️ WS broadcast (forecast) failed:", e)

            # Detect anomalies
            anomalies = await detect_anomalies(metrics)

            if anomalies:
                db = SessionLocal()
                try:
                    for anomaly in anomalies:
                        # create audit log with actor SYSTEM
                        event_text = f"Anomaly detected: {anomaly['target']}"
                        meta = {
                            "value": anomaly["value"],
                            "severity": anomaly["severity"],
                            "detected_at": anomaly["ts"],
                            "avg_window": FORECAST_WINDOW,
                        }

                        log_entry = AuditLog(
                            event=event_text,
                            actor="SYSTEM",
                            meta=meta
                        )
                        db.add(log_entry)
                        # flush to generate id if your model uses it
                        db.flush()

                        # broadcast an 'audit' message (frontend expects this)
                        try:
                            await ws_manager.broadcast({
                                "type": "audit",
                                "event": event_text,
                                "actor": "SYSTEM",
                                "meta": meta,
                                "ts": anomaly["ts"],
                            })
                        except Exception as e:
                            print("⚠️ WS broadcast (audit) failed:", e)

                        # broadcast anomaly for spike markers on charts
                        try:
                            await ws_manager.broadcast({
                                "type": "anomaly",
                                "target": anomaly["target"],
                                "ts": anomaly["ts"],
                                "value": anomaly["value"],
                                "severity": anomaly["severity"],
                            })
                        except Exception as e:
                            print("⚠️ WS broadcast (anomaly) failed:", e)

                        # Slack alert (rate-limited and only if webhook present)
                        try:
                            if getattr(settings, "SLACK_WEBHOOK_URL", ""):
                                send_key = f"alert:{anomaly['target']}"
                                if await should_send_alert(send_key):
                                    # send_slack_alert may be sync or async; call accordingly
                                    maybe_coro = send_slack_alert(f"🚨 [SYSTEM] {event_text}: {anomaly['value']}%")
                                    if asyncio.iscoroutine(maybe_coro):
                                        await maybe_coro
                                    # else it's fire-and-forget synchronous function
                        except Exception as e:
                            print("⚠️ Slack alert failed:", e)

                    db.commit()
                    print(f"🧾 Logged {len(anomalies)} anomaly event(s) to AuditLog.")
                except Exception as e:
                    print("⚠️ Failed to persist anomaly logs:", e)
                    db.rollback()
                finally:
                    db.close()

        except Exception as e:
            # keep loop alive; log and continue
            print("⚠️ Intelligence loop error:", e)

        await asyncio.sleep(interval)
