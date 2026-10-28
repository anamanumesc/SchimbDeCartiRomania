"""Optional Discord deployment result. No shell interpolation of commit metadata."""
import json
import os
import urllib.request

webhook = os.getenv("DISCORD_WEBHOOK_URL")
if webhook:
    payload = {
        "allowed_mentions": {"parse": []},
        "content": (
            f"Deployment {os.environ.get('DEPLOY_STATUS', 'unknown')}\n"
            f"Commit: {os.environ.get('DEPLOY_SHA', '')}\n"
            f"Author: {os.environ.get('DEPLOY_AUTHOR', '')}\n"
            f"Run: {os.environ.get('DEPLOY_RUN_URL', '')}"
        )[:1900],
    }
    request = urllib.request.Request(
        webhook, data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json", "User-Agent": "BookExchange-CI"},
    )
    with urllib.request.urlopen(request, timeout=15) as response:
        if response.status not in (200, 204):
            raise SystemExit("Notification rejected")
else:
    print("Discord webhook not configured; notification skipped")
