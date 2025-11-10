import httpx
import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr
from app.config import settings

async def send_slack_alert(message: str):
    """Send alert to Slack via incoming webhook."""
    if not settings.SLACK_WEBHOOK_URL:
        print("⚠️ No Slack webhook configured.")
        return
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            await client.post(settings.SLACK_WEBHOOK_URL, json={"text": message})
        print(f"✅ Slack alert sent: {message}")
    except Exception as e:
        print(f"⚠️ Slack alert failed: {e}")


def send_email_alert(subject: str, body: str):
    """Send alert email via Gmail SMTP or any SMTP provider."""
    if not (settings.SMTP_HOST and settings.SMTP_USER and settings.ADMIN_EMAIL):
        print("⚠️ SMTP not configured. Skipping email alert.")
        return

    try:
        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = formataddr(("TaskFlow Alerts", settings.SMTP_USER))
        msg["To"] = settings.ADMIN_EMAIL

        print(f"📧 Connecting to SMTP server {settings.SMTP_HOST}:{settings.SMTP_PORT}...")
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.sendmail(settings.SMTP_USER, [settings.ADMIN_EMAIL], msg.as_string())

        print(f"✅ Email alert sent to {settings.ADMIN_EMAIL}")

    except smtplib.SMTPAuthenticationError as e:
        print("❌ Gmail rejected credentials. Make sure you're using a valid App Password.")
        print(f"   Details: {e}")
    except smtplib.SMTPException as e:
        print(f"⚠️ SMTP error: {e}")
    except Exception as e:
        print(f"⚠️ Email alert failed: {e}")
