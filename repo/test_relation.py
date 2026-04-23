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
    try:
        # trying different capitalization or relations
        res = client.table("profile_claims").select("*, master_authors(canonical_name, department)").limit(1).execute()
        print("Success master_authors:", res)
    except Exception as e:
        print("Error master_authors:", e)

    try:
        # trying master_Authors if the error said that
        res = client.table("profile_claims").select("*, master_Authors(canonical_name, department)").limit(1).execute()
        print("Success master_Authors:", res)
    except Exception as e:
        print("Error master_Authors:", e)

test()
