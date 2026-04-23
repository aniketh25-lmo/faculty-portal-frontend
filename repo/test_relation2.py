import os
from supabase import create_client

def test():
    url = ''
    key = ''
    with open(".env.local", "r") as f:
        for line in f:
            if line.startswith("VITE_SUPABASE_URL="):
                url = line.strip().split("=")[1]
            if line.startswith("VITE_SUPABASE_ANON_KEY="):
                key = line.strip().split("=")[1]

    client = create_client(url, key)
    res = client.table("profile_claims").select("*").limit(1).execute()
    if res.data:
        print("profile_claims columns:", res.data[0].keys())
    else:
        print("profile_claims has no rows but no error, so query worked")

test()
