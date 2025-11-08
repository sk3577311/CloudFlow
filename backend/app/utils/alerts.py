import httpx, smtplib
from email.mime.text import MIMEText
from app.config import settings

async def send_slack_alert(message: str):
    """Send alert to Slack via incoming webhook."""
    if not settings.SLACK_WEBHOOK_URL:
        print("⚠️  No Slack webhook configured.")
        return
    try:
        async with httpx.AsyncClient() as client:
            await client.post(settings.SLACK_WEBHOOK_URL, json={"text": message})
        print(f"✅ Slack alert sent: {message}")
    except Exception as e:
        print(f"⚠️ Slack alert failed: {e}")

def send_email_alert(subject: str, body: str):
    """Send alert email via SMTP (optional)."""
    if not settings.ADMIN_EMAIL or not settings.SMTP_HOST:
        print("⚠️  No SMTP or ADMIN_EMAIL configured.")
        return
    try:
        msg = MIMEText(body)
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_USER
        msg["To"] = settings.ADMIN_EMAIL

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASS)
            server.send_message(msg)

        print(f"✅ Email sent to {settings.ADMIN_EMAIL}")
    except Exception as e:
        print(f"⚠️ Email alert failed: {e}")
