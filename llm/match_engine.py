# llm/match_engine.py

from openai import OpenAI, RateLimitError, AuthenticationError
import os
import json
from dotenv import load_dotenv
from pathlib import Path
from typing import Dict, Any

# Load .env from project root
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
MODEL_NAME = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

client = None
if OPENAI_API_KEY and OPENAI_API_KEY.startswith("sk-"):
    client = OpenAI(api_key=OPENAI_API_KEY)
else:
    print("⚠️  OpenAI key not found — using fallback match engine")


def _prompt_for_match(resume: str, job_desc: str) -> str:
    return f"""You are a job-matching assistant.

Return STRICT JSON ONLY:
{{
  "match_score": <integer 0-100>,
  "strengths": "<string>",
  "gaps": "<string>"
}}

RESUME:
{resume}

JOB DESCRIPTION:
{job_desc}
"""


def _safe_parse_json(raw_output: str) -> Dict[str, Any]:
    try:
        json_start = raw_output.find("{")
        json_end = raw_output.rfind("}") + 1
        json_str = raw_output[json_start:json_end]
        parsed = json.loads(json_str)

        parsed["match_score"] = int(round(float(parsed.get("match_score", 0))))
        parsed["match_score"] = max(0, min(100, parsed["match_score"]))
        parsed["strengths"] = str(parsed.get("strengths", ""))
        parsed["gaps"] = str(parsed.get("gaps", ""))
        return parsed

    except Exception as e:
        print("❌ Failed to parse JSON:", e)
        return {
            "match_score": None,
            "strengths": "Parsing failed",
            "gaps": "Check output format"
        }


def _fallback_match_score(resume: str, job_desc: str) -> Dict[str, Any]:
    keywords = ['python', 'sql', 'etl', 'dbt', 'airflow', 'snowflake',
                'data engineer', 'streamlit', 'pipeline', 'dashboard']

    resume_lower = resume.lower()
    jd_lower = job_desc.lower()

    strengths = [kw for kw in keywords if kw in resume_lower and kw in jd_lower]
    gaps = [kw for kw in keywords if kw in jd_lower and kw not in resume_lower]

    total = len([kw for kw in keywords if kw in jd_lower])
    score = int((len(strengths) / total) * 100) if total else 50

    return {
        "match_score": score,
        "strengths": ", ".join(strengths) or "Some basic alignment",
        "gaps": ", ".join(gaps) or "No major gaps"
    }


def get_match_score(resume: str, job_desc: str) -> Dict[str, Any]:
    if client is None:
        return _fallback_match_score(resume, job_desc)

    try:
        messages = [
            {"role": "system", "content": "Only return valid JSON. No markdown."},
            {"role": "user", "content": _prompt_for_match(resume, job_desc)},
        ]

        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=messages,
            temperature=0.3,
            max_tokens=500,
        )

        raw_output = response.choices[0].message.content
        return _safe_parse_json(raw_output)

    except (RateLimitError, AuthenticationError) as e:
        print(f"❌ GPT error: {e}. Using fallback.")
        return _fallback_match_score(resume, job_desc)

    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return _fallback_match_score(resume, job_desc)


if __name__ == "__main__":
    resume = "Built ETL pipelines using Python and SQL. Familiar with dbt and Streamlit."
    jd = "Looking for a data engineer with Python, dbt, and dashboarding skills like Streamlit."

    result = get_match_score(resume, jd)
    print("\n🧠 Final Output:")
    print(json.dumps(result, indent=2))
