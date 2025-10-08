from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from supabase import create_client
from llm.match_engine import get_match_score

# Load environment
load_dotenv()

app = FastAPI(title="Job Tracker API", version="1.0.0")

# CORS - Essential for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase setup
supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

@app.get("/")
async def root():
    return {"message": "Job Tracker API is running!"}

@app.get("/jobs")
async def get_jobs(status: str = None, company: str = None):
    try:
        query = supabase.table("jobs").select("*")
        if status and status != "All":
            query = query.eq("status", status)
        if company:
            query = query.ilike("company", f"%{company}%")
        
        result = query.execute()
        return {"jobs": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/jobs")
async def create_job(job_data: dict):
    try:
        # Run AI match scoring
        result = get_match_score(job_data["resume_text"], job_data["description"])
        
        # Insert into database
        data = supabase.table("jobs").insert({
            "title": job_data["title"],
            "company": job_data["company"],
            "description": job_data["description"],
            "match_score": result["match_score"],
            "strengths": result["strengths"],
            "gaps": result["gaps"],
            "status": job_data.get("status", "wishlist"),
            "resume_version": job_data.get("resume_version"),
            "notes": job_data.get("notes")
        }).execute()
        
        return {"message": "Job added successfully", "job": data.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Job Tracker API"}