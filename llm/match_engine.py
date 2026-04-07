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
    return f"""You are a job-matching assistant. Analyze the resume against the job description and provide a detailed skill breakdown with PROPER WEIGHTING.

IMPORTANT RULES:
1. REQUIRED skills (mentions "required", "must have", or listed as essential) should heavily impact the score
2. Missing a required skill = -15 points each
3. Having a required skill = +15 points each  
4. Nice-to-have skills = +5 points each
5. Score range should be 0-100, NOT compressed to 60-85
6. A candidate missing key required skills should get 40-50%, not 70%

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
      "skill": "Docker",
      "match_level": "missing",
      "reason": "No containerization experience found",
      "importance": "high"
    }}
  ]
}}

CRITICAL: 
- match_level must be one of: "strong", "good", "partial", "missing"
- importance must be one of: "high" (required skill), "medium" (nice-to-have), "low" (bonus)
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
        {'skill': 'Python', 'weight': 15},
        {'skill': 'SQL', 'weight': 10},
        {'skill': 'ETL', 'weight': 12},
        {'skill': 'Docker', 'weight': 10},
        {'skill': 'Kubernetes', 'weight': 10},
        {'skill': 'AWS', 'weight': 10},
        {'skill': 'PostgreSQL', 'weight': 8},
        {'skill': 'Rust', 'weight': 8},
        {'skill': 'B2B', 'weight': 7},
        {'skill': 'MongoDB', 'weight': 5},
        {'skill': 'FastAPI', 'weight': 5},
        {'skill': 'React', 'weight': 5},
        {'skill': 'Spark', 'weight': 8},
        {'skill': 'Airflow', 'weight': 8},
        {'skill': 'Tableau', 'weight': 5},
        {'skill': 'Power BI', 'weight': 5},
        {'skill': 'NumPy', 'weight': 5},
        {'skill': 'Pandas', 'weight': 5},
        {'skill': 'Scikit-Learn', 'weight': 5},
        {'skill': 'OpenCV', 'weight': 4},
    ]

    resume_lower = resume.lower()
    jd_lower = job_desc.lower()

    # First, identify which skills are REQUIRED vs NICE-TO-HAVE in the JD
    required_skills = []
    nice_to_have_skills = []
    
    # Check for explicit "required" section
    required_section = ""
    nice_to_have_section = ""
    
    if "required" in jd_lower:
        parts = jd_lower.split("required")
        if len(parts) > 1:
            required_section = parts[1].split("nice")[0] if "nice" in parts[1] else parts[1].split("preferred")[0] if "preferred" in parts[1] else parts[1]
    if "nice to have" in jd_lower:
        nice_to_have_section = jd_lower.split("nice to have")[1] if "nice to have" in jd_lower else ""
    if "preferred" in jd_lower:
        nice_to_have_section += jd_lower.split("preferred")[1] if "preferred" in jd_lower else ""
    
    for kw in keywords:
        skill_name = kw['skill']
        skill_lower = skill_name.lower()
        weight = kw['weight']
        
        if skill_lower in jd_lower:
            # Check if skill appears in required section or is explicitly required
            is_required = False
            is_nice_to_have = False
            
            if required_section and skill_lower in required_section:
                is_required = True
            elif nice_to_have_section and skill_lower in nice_to_have_section:
                is_nice_to_have = True
            elif "required" in jd_lower and skill_lower in jd_lower:
                # If there's a required section but skill not in it, check surrounding context
                idx = jd_lower.find(skill_lower)
                surrounding = jd_lower[max(0, idx-50):min(len(jd_lower), idx+50)]
                if "required" in surrounding or "must have" in surrounding:
                    is_required = True
                else:
                    is_nice_to_have = True
            else:
                is_required = True  # Default to required if not specified
            
            if is_required:
                required_skills.append({'skill': skill_name, 'weight': weight, 'skill_lower': skill_lower})
            else:
                nice_to_have_skills.append({'skill': skill_name, 'weight': weight * 0.5, 'skill_lower': skill_lower})  # Half weight for nice-to-have

    # Calculate weighted score
    total_weight = 0
    earned_weight = 0
    skill_breakdown = []
    strengths = []
    gaps = []

    # Score required skills
    for kw in required_skills:
        skill_name = kw['skill']
        weight = kw['weight']
        skill_lower = kw['skill_lower']
        total_weight += weight
        
        if skill_lower in resume_lower:
            # Full points if in resume
            earned_weight += weight
            strengths.append(skill_name)
            skill_breakdown.append({
                "skill": skill_name,
                "match_level": "strong",
                "reason": f"{skill_name} found in resume - matches requirement",
                "importance": "high"
            })
        else:
            # Zero points if missing from resume
            gaps.append(skill_name)
            skill_breakdown.append({
                "skill": skill_name,
                "match_level": "missing",
                "reason": f"{skill_name} required but not found in resume",
                "importance": "high"
            })

    # Score nice-to-have skills
    for kw in nice_to_have_skills:
        skill_name = kw['skill']
        weight = kw['weight']
        skill_lower = kw['skill_lower']
        total_weight += weight
        
        if skill_lower in resume_lower:
            earned_weight += weight
            skill_breakdown.append({
                "skill": skill_name,
                "match_level": "good",
                "reason": f"{skill_name} found (nice-to-have)",
                "importance": "medium"
            })
        else:
            skill_breakdown.append({
                "skill": skill_name,
                "match_level": "partial",
                "reason": f"{skill_name} not found but only nice-to-have",
                "importance": "low"
            })

    # Calculate final score
    if total_weight > 0:
        raw_score = (earned_weight / total_weight) * 100
    else:
        raw_score = 50
    
    # Add bonus/penalty for senior/experience level keywords
    experience_bonus = 0
    if "senior" in job_desc.lower():
        if "senior" in resume_lower or "years" in resume_lower:
            experience_bonus = 5
        else:
            experience_bonus = -10  # Bigger penalty for senior roles with no experience
    
    # Penalty for missing key required skills (if more than 2 required skills missing)
    missing_required_count = len([s for s in skill_breakdown if s['importance'] == 'high' and s['match_level'] == 'missing'])
    if missing_required_count >= 3:
        experience_bonus -= 10
    elif missing_required_count >= 2:
        experience_bonus -= 5
    
    # Bonus for having all required skills
    if missing_required_count == 0 and len(required_skills) > 0:
        experience_bonus += 8
    
    final_score = max(0, min(100, raw_score + experience_bonus))
    
    # Format strengths and gaps strings
    strengths_str = ", ".join(strengths[:5]) if strengths else "Some alignment found"
    gaps_str = ", ".join(gaps[:5]) if gaps else "No major gaps identified"

    return {
        "match_score": int(final_score),
        "strengths": strengths_str,
        "gaps": gaps_str,
        "skill_breakdown": skill_breakdown[:10]  # Limit to top 10
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
            max_tokens=1000,  # Increased for detailed breakdown
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