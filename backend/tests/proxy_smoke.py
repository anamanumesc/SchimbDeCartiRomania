"""HTTP integration checks against an isolated proxy. Not production traffic."""
import json
import os
import urllib.error
import urllib.request

base = os.getenv('PROXY_TEST_URL', 'http://proxy')

def request(path, data=None, headers=None):
    try:
        response = urllib.request.urlopen(urllib.request.Request(base + path, data=data, headers=headers or {}), timeout=10)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, response.headers, response.read()

status, headers, body = request('/health')
assert status == 200
assert json.loads(body)['status'] == 'healthy'
assert headers['X-Content-Type-Options'] == 'nosniff'
assert headers['X-Frame-Options'] == 'DENY'
assert request('/')[0] == 200
status, _, body = request('/api/does-not-exist')
assert status == 404 and 'detail' in json.loads(body)
assert request('/api/books', b'x' * (5 * 1024 * 1024 + 1))[0] == 413
statuses = [request('/api/auth/login', b'{}', {
    'Content-Type': 'application/json',
    # Untrusted callers must not be able to evade limits by choosing this header.
    'CF-Connecting-IP': f'198.51.100.{i + 1}',
})[0] for i in range(9)]
assert 429 in statuses, statuses
assert request('/health')[0] == 200
print('proxy health routing headers body limit and auth rate limiting passed')
