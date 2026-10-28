"""Optional SMTP delivery from a durable database outbox.

Run with python -m app.mailer. Failed messages retry without losing the event.
SMTP is disabled until configured; the free demo needs no email provider.
"""
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
import logging
import os
import smtplib
import ssl
import time
from app.database import SessionLocal
from app import models

log = logging.getLogger(__name__)


def enabled():
    return bool(os.getenv('SMTP_HOST') and os.getenv('SMTP_FROM'))


def enqueue(db, recipient, subject, body):
    if enabled():
        db.add(models.MailOutbox(recipient=recipient, subject=subject, body=body))


def deliver_pending():
    if not enabled():
        raise RuntimeError('Set SMTP_HOST and SMTP_FROM before starting the email worker')
    with SessionLocal() as db:
        messages = db.query(models.MailOutbox).filter(
            models.MailOutbox.sent_at.is_(None),
            models.MailOutbox.attempts < 10,
            models.MailOutbox.next_attempt_at <= datetime.now(timezone.utc),
        ).order_by(models.MailOutbox.id).with_for_update(skip_locked=True).limit(10).all()
        for pending in messages:
            pending.attempts += 1
            message = EmailMessage()
            message['From'] = os.environ['SMTP_FROM']
            message['To'] = pending.recipient
            message['Subject'] = pending.subject
            message['Message-ID'] = f'<bookexchange-{pending.id}@{os.environ["SMTP_FROM"].split("@")[-1]}>'
            message.set_content(pending.body)
            try:
                use_ssl = os.getenv('SMTP_SSL', 'false').lower() == 'true'
                smtp_class = smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
                options = {'context': ssl.create_default_context()} if use_ssl else {}
                with smtp_class(os.environ['SMTP_HOST'], int(os.getenv('SMTP_PORT', '587')), timeout=15, **options) as smtp:
                    if not use_ssl:
                        smtp.starttls(context=ssl.create_default_context())
                    if os.getenv('SMTP_USERNAME'):
                        smtp.login(os.environ['SMTP_USERNAME'], os.environ['SMTP_PASSWORD'])
                    smtp.send_message(message)
                pending.sent_at = datetime.now(timezone.utc)
                # Do not retain recipient or verification-token bodies after delivery.
                pending.recipient = ''
                pending.body = ''
            except (OSError, smtplib.SMTPException):
                pending.next_attempt_at = datetime.now(timezone.utc) + timedelta(minutes=min(60, 2 ** pending.attempts))
                log.warning('SMTP delivery failed for outbox id %s attempt %s', pending.id, pending.attempts)
        db.commit()


if __name__ == '__main__':
    logging.basicConfig(level=logging.INFO)
    while True:
        try:
            deliver_pending()
        except Exception:
            log.error('Email worker unavailable; retrying in 30 seconds')
        time.sleep(30)
