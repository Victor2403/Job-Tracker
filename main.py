import os
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client
from llm.match_engine import get_match_score

# Load secrets from .env
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Connect to OpenAI
client = OpenAI(api_key=OPENAI_API_KEY)

# Connect to Supabase (using service role for admin rights)
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("✅ Secrets loaded and connections ready.")

# Quick OpenAI test
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "Say hello, I’m Job Tracker Pro!"}]
)
print("🤖 OpenAI says:", response.choices[0].message.content)

# Example resume + job description
resume_text = "Built ETL pipelines using Python and SQL. Familiar with dbt and Streamlit."
job_desc = "Looking for a data engineer with Python, dbt, and dashboarding skills like Streamlit."

# Run match engine
result = get_match_score(resume_text, job_desc)
print("\n🧠 Match Engine Output:")
print(result)

# Insert job + match result into Supabase
data = supabase.table("jobs").insert({
    "title": "Data Engineer",
    "company": "OpenAI",
    "description": job_desc,
    "match_score": result["match_score"],
    "strengths": result["strengths"],
    "gaps": result["gaps"]
}).execute()

print("🗄️ Supabase insert result:", data)