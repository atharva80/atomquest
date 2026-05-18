import os
import json
import urllib.request

env = {}
if os.path.exists('.env.local'):
    with open('.env.local') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                env[k.strip()] = v.strip().strip('"').strip("'")

url = env.get('NEXT_PUBLIC_SUPABASE_URL')
service_key = env.get('SUPABASE_SERVICE_ROLE_KEY')

headers = {
    'apikey': service_key,
    'Authorization': f'Bearer {service_key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

data = json.dumps({"role": "employee"}).encode('utf-8')

req = urllib.request.Request(f"{url}/rest/v1/profiles?email=eq.dev1%40atomberg.com", data=data, headers=headers, method='PATCH')
with urllib.request.urlopen(req) as response:
    res = json.loads(response.read().decode())
    print("Fixed Dwight:", json.dumps(res, indent=2))

