import os
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client

# Load secrets from .env
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

# Connect to OpenAI
client = OpenAI(api_key=OPENAI_API_KEY)

# Connect to Supabase
supabase = create_client(SUPABASE_URL, os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

print("✅ Secrets loaded and connections ready.")

# Quick OpenAI test
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Say hello, I’m Job Tracker Pro!"}]
)
print("🤖 OpenAI says:", response.choices[0].message.content)

# Insert a test job row into Supabase
data = supabase.table("jobs").insert({
    "title": "Data Engineer",
    "company": "OpenAI"
}).execute()
print("🗄️ Supabase insert result:", data)

