# llm/match_engine.py

import os
from openai import OpenAI
from dotenv import load_dotenv

# Load API key from .env
load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def match_job(description: str, resume: str) -> str:
    """
    Placeholder function for matching logic.
    Takes a job description and a resume, returns a mock score for now.
    """
    return f"Match engine ready! Description length={len(description)}, Resume length={len(resume)}"


# Run a quick test if file is executed directly
if __name__ == "__main__":
    job_desc = "Looking for a Data Engineer with SQL and cloud experience."
    resume = "CS grad with SQL, Python, and ETL project experience."
    print(match_job(job_desc, resume))