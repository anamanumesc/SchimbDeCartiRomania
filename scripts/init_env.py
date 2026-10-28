"""Create a private .env without overwriting one or changing the live database.

If the legacy container exists, reuse its database password and volume name.
Secrets never appear on stdout. Run on the Docker host, not inside the app.
"""
import json
from pathlib import Path
import secrets
import subprocess

root = Path(__file__).resolve().parent.parent
path = root / '.env'
if path.exists():
    raise SystemExit('.env already exists; leaving it unchanged')
password = secrets.token_hex(32)
volume = 'schimbdecartiromania_postgres_data'
try:
    result = subprocess.run(['docker', 'inspect', 'bookexchange_db'], capture_output=True, text=True, check=True)
    info = json.loads(result.stdout)[0]
    values = dict(item.split('=', 1) for item in info['Config']['Env'] if '=' in item)
    password = values['POSTGRES_PASSWORD']
    # Existing legacy password uses URL-safe characters; refuse unsafe interpolation.
    if not all(c.isalnum() or c in '_-' for c in password):
        raise SystemExit('Existing password needs URL encoding; configure DATABASE_URL manually')
    for mount in info['Mounts']:
        if mount['Destination'] == '/var/lib/postgresql/data':
            if mount['Type'] != 'volume':
                raise SystemExit('Existing database uses a bind mount; adapt Compose before proceeding')
            volume = mount['Name']
except subprocess.CalledProcessError:
    # A denied Docker connection must not be mistaken for a new installation.
    check = subprocess.run(['docker', 'info'], capture_output=True)
    if check.returncode:
        raise SystemExit('Cannot inspect Docker; refusing to guess the existing database credentials')

text = (root / '.env.example').read_text()
text = text.replace('replace-with-64-hex-characters', password)
text = text.replace('replace-with-a-different-64-character-random-secret', secrets.token_hex(32))
text = text.replace('POSTGRES_VOLUME_NAME=schimbdecartiromania_postgres_data', 'POSTGRES_VOLUME_NAME=' + volume)
import os
file = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
with os.fdopen(file, 'w') as output:
    output.write(text)
print('Created .env with mode 600; existing database credentials preserved when found')
