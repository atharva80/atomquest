import os
import json
import urllib.request

# Load env
env = {}
if os.path.exists('.env.local'):
    with open('.env.local') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                env[k.strip()] = v.strip().strip('"').strip("'")

url = env.get('NEXT_PUBLIC_SUPABASE_URL')
anon_key = env.get('NEXT_PUBLIC_SUPABASE_ANON_KEY')
service_key = env.get('SUPABASE_SERVICE_ROLE_KEY')

headers = {
    'apikey': service_key,
    'Authorization': f'Bearer {service_key}'
}

# Query profiles
req = urllib.request.Request(f"{url}/rest/v1/profiles", headers=headers)
with urllib.request.urlopen(req) as response:
    profiles = json.loads(response.read().decode())

print("PROFILES:")
for p in profiles:
    print(f"ID: {p['id']}, Email: {p['email']}, Role: {p['role']}, Name: {p['first_name']} {p['last_name']}, ManagerID: {p['manager_id']}")

print("\nGOALS WITH SUBMITTED STATUS:")
req_goals = urllib.request.Request(f"{url}/rest/v1/goals?status=eq.submitted", headers=headers)
with urllib.request.urlopen(req_goals) as response:
    goals = json.loads(response.read().decode())
for g in goals:
    print(f"Goal ID: {g['id']}, Title: {g['title']}, ProfileID: {g['profile_id']}, Status: {g['status']}")

