"""Three-minute local probe, disk alarm and optional backup freshness alarm."""
import datetime
import json
import os
from pathlib import Path
import shutil
import urllib.request

errors = []
url = os.getenv('HEALTH_URL', 'http://127.0.0.1:8080/health')
try:
    with urllib.request.urlopen(url, timeout=8) as response:
        if json.load(response).get('status') != 'healthy':
            errors.append('Application reported unhealthy')
except Exception:
    errors.append('Application health endpoint unreachable')
usage = shutil.disk_usage(os.getenv('DISK_PATH', '/'))
minimum_percent = float(os.getenv('DISK_MIN_FREE_PERCENT', '5'))
minimum_bytes = int(os.getenv('DISK_MIN_FREE_BYTES', str(1024 ** 3)))
if usage.free / usage.total * 100 < minimum_percent or usage.free < minimum_bytes:
    errors.append(f'Host disk free space below configured threshold ({minimum_percent:g} percent and {minimum_bytes // (1024 ** 2)} MiB minimum)')
if os.getenv('BACKUP_DIR'):
    try:
        stamp = Path(os.environ['BACKUP_DIR'], 'last-success').read_text().strip()
        age = datetime.datetime.now(datetime.timezone.utc) - datetime.datetime.fromisoformat(stamp.replace('Z', '+00:00'))
        if age.total_seconds() > 26 * 3600:
            errors.append('Last verified off-site backup is older than 26 hours')
    except (OSError, ValueError):
        errors.append('No verified off-site backup timestamp found')
if errors:
    message = 'BookExchange alert: ' + '; '.join(errors)
    print(message)
    webhook = os.getenv('DISCORD_WEBHOOK_URL')
    if webhook:
        request = urllib.request.Request(webhook, json.dumps({
            'content': message, 'allowed_mentions': {'parse': []}
        }).encode(), {'Content-Type': 'application/json', 'User-Agent': 'BookExchange-monitor'})
        with urllib.request.urlopen(request, timeout=10):
            pass
    raise SystemExit(1)
print('Application and configured host checks healthy')
