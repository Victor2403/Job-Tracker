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
    return f"""You are a job-matching assistant. Analyze the resume against the job description and provide a detailed skill breakdown.

Return STRICT JSON ONLY:
{{
  "match_score": <integer 0-100>,
  "strengths": "<string>",
  "gaps": "<string>",
  "skill_breakdown": [
    {{
      "skill": "Python",
      "match_level": "strong", 
      "reason": "3+ years experience building ETL pipelines",
      "importance": "high"
    }},
    {{
      "skill": "AWS",
      "match_level": "partial",
      "reason": "Basic knowledge but no production experience",
      "importance": "medium"
    }},
    {{
      "skill": "Kubernetes", 
      "match_level": "missing",
      "reason": "No container orchestration experience",
      "importance": "medium"
    }}
  ]
}}

CRITICAL: 
- match_level must be one of: "strong", "good", "partial", "missing"
- importance must be one of: "high", "medium", "low" 
- Include 5-8 most relevant skills from the job description
- Focus on technical skills and tools mentioned in both resume and JD

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

        # Ensure all required fields with defaults
        parsed["match_score"] = int(round(float(parsed.get("match_score", 0))))
        parsed["match_score"] = max(0, min(100, parsed["match_score"]))
        parsed["strengths"] = str(parsed.get("strengths", ""))
        parsed["gaps"] = str(parsed.get("gaps", ""))
        
        # Ensure skill_breakdown exists and has proper structure
        skill_breakdown = parsed.get("skill_breakdown", [])
        if not isinstance(skill_breakdown, list):
            skill_breakdown = []
        
        # Validate each skill entry
        validated_skills = []
        for skill in skill_breakdown:
            if isinstance(skill, dict):
                validated_skills.append({
                    "skill": str(skill.get("skill", "Unknown")),
                    "match_level": str(skill.get("match_level", "missing")),
                    "reason": str(skill.get("reason", "")),
                    "importance": str(skill.get("importance", "medium"))
                })
        
        parsed["skill_breakdown"] = validated_skills
        return parsed

    except Exception as e:
        print("❌ Failed to parse JSON:", e)
        return {
            "match_score": 50,
            "strengths": "Parsing failed",
            "gaps": "Check output format",
            "skill_breakdown": []
        }


def _fallback_match_score(resume: str, job_desc: str) -> Dict[str, Any]:
    keywords = [
        {'skill': 'Python', 'category': 'programming'},
        {'skill': 'SQL', 'category': 'database'},
        {'skill': 'ETL', 'category': 'data_engineering'},
        {'skill': 'dbt', 'category': 'data_engineering'},
        {'skill': 'Airflow', 'category': 'orchestration'},
        {'skill': 'Snowflake', 'category': 'database'},
        {'skill': 'Data Engineering', 'category': 'domain'},
        {'skill': 'Streamlit', 'category': 'visualization'},
        {'skill': 'React', 'category': 'frontend'},
        {'skill': 'FastAPI', 'category': 'backend'},
        {'skill': 'AWS', 'category': 'cloud'},
        {'skill': 'Docker', 'category': 'devops'},
        {'skill': 'Machine Learning', 'category': 'ai_ml'},
        {'skill': 'Data Analysis', 'category': 'analytics'}
    ]

    resume_lower = resume.lower()
    jd_lower = job_desc.lower()

    skill_breakdown = []
    strengths = []
    gaps = []

    for kw in keywords:
        skill_name = kw['skill']
        skill_lower = skill_name.lower()
        
        if skill_lower in jd_lower:
            if skill_lower in resume_lower:
                match_level = "strong" if skill_lower in ['python', 'sql', 'etl'] else "good"
                strengths.append(skill_name)
                skill_breakdown.append({
                    "skill": skill_name,
                    "match_level": match_level,
                    "reason": f"Experience with {skill_name} mentioned in resume",
                    "importance": "high" if skill_lower in ['python', 'sql'] else "medium"
                })
            else:
                match_level = "missing"
                gaps.append(skill_name)
                skill_breakdown.append({
                    "skill": skill_name,
                    "match_level": match_level,
                    "reason": f"{skill_name} required but not found in resume",
                    "importance": "high" if skill_lower in ['python', 'sql'] else "medium"
                })

    total_required = len([kw for kw in keywords if kw['skill'].lower() in jd_lower])
    matched_skills = len(strengths)
    score = int((matched_skills / total_required) * 100) if total_required else 50

    return {
        "match_score": score,
        "strengths": ", ".join(strengths) or "Some basic alignment",
        "gaps": ", ".join(gaps) or "No major gaps",
        "skill_breakdown": skill_breakdown
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
            max_tokens=800,  # Increased for detailed breakdown
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
    resume = "Built ETL pipelines using Python and SQL. Familiar with dbt and Streamlit. Experience with React, FastAPI, and machine learning. Strong background in data analysis and visualization."
    jd = "Looking for a senior data engineer with Python, SQL, ETL pipelines, dbt, and cloud experience with AWS. Docker and Kubernetes knowledge is a plus."

    result = get_match_score(resume, jd)
    print("\n🧠 Enhanced Match Output:")
    print(json.dumps(result, indent=2))
    print(f"\n🎯 Match Score: {result['match_score']}%")
    print("\n📊 Skill Breakdown:")
    for skill in result.get('skill_breakdown', []):
        level_icon = "✅" if skill['match_level'] in ['strong', 'good'] else "⚠️" if skill['match_level'] == 'partial' else "❌"
        print(f"  {level_icon} {skill['skill']}: {skill['match_level'].upper()} - {skill['reason']}")