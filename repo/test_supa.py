import os
from supabase import create_client

def test():
    supabase_url = os.environ.get("VITE_SUPABASE_URL")
    supabase_key = os.environ.get("VITE_SUPABASE_ANON_KEY")
    
    # If not in env, we must parse from .env
    if not supabase_url:
        with open("c:/Users/Devil's Nest/OneDrive/Documents/VNR VJIET/YEAR-4/Major Project/faculty-portal/frontend/repo/.env", "r") as f:
            for line in f:
                if line.startswith("VITE_SUPABASE_URL="):
                    supabase_url = line.strip().split("=")[1]
                if line.startswith("VITE_SUPABASE_ANON_KEY="):
                    supabase_key = line.strip().split("=")[1]

    client = create_client(supabase_url, supabase_key)
    res = client.table("profile_claims").select("id, created_at, status").execute()
    print("ALL claims:", res.data)

    res2 = client.table("profile_claims").select("id, created_at, profiles(email), master_authors(canonical_name)").eq("status", "approved").execute()
    print("APPROVED claims with joins:", res2.data)

test()
