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
    'Content-Type': 'application/json'
}

# We want to perform the select query:
# goals?select=*,profiles(id,first_name,last_name,email,department_id,avatar_url)&status=eq.submitted
query_url = f"{url}/rest/v1/goals?select=*,profiles(id,first_name,last_name,email,department_id,avatar_url)&status=eq.submitted"

try:
    req = urllib.request.Request(query_url, headers=headers)
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode())
        print("SUCCESS:")
        print(json.dumps(res, indent=2))
except urllib.error.HTTPError as e:
    print("HTTP ERROR:", e.code)
    print(e.read().decode())
except Exception as e:
    print("ERROR:", e)

