import os
import requests

def test_supabase_auth(token: str):
    supabase_url = "https://rbhdkzqacavjdbguspmu.supabase.co"
    anon_key = "sb_publishable_weL2jnHYvrX82y_4JLUgUw_b98ZNC3N"
    
    url = f"{supabase_url}/auth/v1/user"
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(url, headers=headers)
    print(response.status_code)
    print(response.text)

# We don't have a valid token right now to test, but we can see if it returns 401 instead of 404
test_supabase_auth("dummy_token")
