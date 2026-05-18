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
    'Prefer': 'count=exact'
}

def query_count(table, params=""):
    try:
        query_url = f"{url}/rest/v1/{table}?select=*{params}&limit=1"
        req = urllib.request.Request(query_url, headers=headers)
        with urllib.request.urlopen(req) as response:
            content_range = response.headers.get('Content-Range')
            print(f"{table}: {content_range}")
    except Exception as e:
        print(f"{table} ERROR: {e}")

query_count('profiles')
query_count('cycles', "&is_active=eq.true")
query_count('escalations', "&resolved_at=is.null")
query_count('audit_logs')

