import os
from dotenv import load_dotenv
from openai import OpenAI
from supabase import create_client
from llm.match_engine import get_match_score

# ======================
# Setup
# ======================
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)
supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

print("✅ Secrets loaded and connections ready.")


# ======================
# CRUD Helpers
# ======================
def add_job(title, company, description, resume_text,
            status="wishlist", resume_version=None, notes=None):
    """Insert a new job and run AI match scoring."""
    result = get_match_score(resume_text, description)
    data = supabase.table("jobs").insert({
        "title": title,
        "company": company,
        "description": description,
        "match_score": result["match_score"],
        "strengths": result["strengths"],
        "gaps": result["gaps"],
        "status": status,
        "resume_version": resume_version,
        "notes": notes
    }).execute()
    return data


def add_jobs_bulk(jobs, resume_text):
    """
    Batch insert multiple jobs.
    jobs = [
      {"title": "DE I", "company": "Google", "description": "..."},
      {"title": "DA", "company": "Fannie Mae", "description": "..."}
    ]
    """
    rows = []
    for job in jobs:
        result = get_match_score(resume_text, job["description"])
        rows.append({
            "title": job["title"],
            "company": job["company"],
            "description": job["description"],
            "match_score": result["match_score"],
            "strengths": result["strengths"],
            "gaps": result["gaps"],
            "status": job.get("status", "wishlist"),
            "resume_version": job.get("resume_version"),
            "notes": job.get("notes")
        })
    return supabase.table("jobs").insert(rows).execute()


def get_jobs(status=None, company=None):
    """Fetch jobs, with optional filters."""
    query = supabase.table("jobs").select("*")
    if status:
        query = query.eq("status", status)
    if company:
        query = query.eq("company", company)
    data = query.execute()
    return data.data


def update_job(job_id: int, updates: dict):
    """Update a job by ID with provided fields."""
    data = supabase.table("jobs").update(updates).eq("id", job_id).execute()
    return data


def delete_job(job_id: int):
    """Delete a job by ID."""
    data = supabase.table("jobs").delete().eq("id", job_id).execute()
    return data


# ======================
# Example Usage (Dev/Test only)
# ======================
if __name__ == "__main__":
    # OpenAI sanity test
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Say hello, I’m Job Tracker Pro!"}]
    )
    print("\n🤖 OpenAI says:", response.choices[0].message.content)

    # Insert one job
    resume_text = "Built ETL pipelines using Python and SQL. Familiar with dbt and Streamlit."
    job_desc = "Looking for a data engineer with Python, dbt, and dashboarding skills like Streamlit."

    print("\n🗄️ Adding one job...")
    add_result = add_job("Data Engineer", "OpenAI", job_desc, resume_text,
                         status="applied", resume_version="v1", notes="Met recruiter at Austin mixer")
    print(add_result)

    # Insert multiple jobs
    print("\n🗄️ Adding bulk jobs...")
    bulk_result = add_jobs_bulk([
        {"title": "DE I", "company": "Google", "description": "Pipeline and dbt role"},
        {"title": "DA", "company": "Fannie Mae", "description": "Analytics and SQL-heavy role"}
    ], resume_text)
    print(bulk_result)

    # Query by filter
    print("\n📂 Jobs with status=applied:")
    jobs = get_jobs(status="applied")
    for job in jobs:
        print(job)