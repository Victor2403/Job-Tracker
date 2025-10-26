import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import os
from dotenv import load_dotenv
from supabase import create_client
from llm.match_engine import get_match_score
from llm.resume_parser import parse_resume_file

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
supabase_url = os.getenv("SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"🔍 DEBUG: Supabase URL: {supabase_url}")
print(f"🔍 DEBUG: Supabase Key length: {len(supabase_key) if supabase_key else 'MISSING'}")

supabase = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

@app.get("/")
async def root():
    return {"message": "Job Tracker API is running!"}

@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    try:
        # Validate file type
        if not file.content_type in ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
            raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
        
        # Parse resume
        resume_text = await parse_resume_file(file)
        
        return {
            "success": True,
            "resume_text": resume_text,
            "file_name": file.filename,
            "char_count": len(resume_text)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume upload failed: {str(e)}")

@app.get("/jobs")
async def get_jobs(status: str = None, company: str = None):
    try:
        print("🔄 DEBUG: Starting get_jobs")
        print(f"🔄 DEBUG: Status: {status}, Company: {company}")
        
        # Test Supabase connection first
        print("🔄 DEBUG: Testing Supabase connection...")
        test = supabase.table("jobs").select("count").execute()
        print("✅ DEBUG: Supabase connection works")
        
        query = supabase.table("jobs").select("*")
        if status and status != "All":
            query = query.eq("status", status)
        if company:
            query = query.ilike("company", f"%{company}%")
        
        print("🔄 DEBUG: Executing query...")
        result = query.execute()
        print(f"✅ DEBUG: Got {len(result.data)} jobs")
        
        return {"jobs": result.data}
    except Exception as e:
        print(f"❌ CRITICAL ERROR in /jobs: {e}")
        import traceback
        print(f"❌ TRACEBACK: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/jobs")
async def create_job(job_data: dict):
    try:
        print("🔄 DEBUG: Starting create_job")
        print(f"📝 DEBUG: Job data received: {job_data}")
        
        # Run AI match scoring
        result = get_match_score(job_data["resume_text"], job_data["description"])
        print(f"🤖 DEBUG: AI match result: {result}")
        
        # Insert into database
        data = supabase.table("jobs").insert({
            "title": job_data["title"],
            "company": job_data["company"],
            "description": job_data["description"],
            "match_score": result["match_score"],
            "strengths": result["strengths"],
            "gaps": result["gaps"],
            "skill_breakdown": result.get("skill_breakdown", []),
            "status": job_data.get("status", "wishlist"),
            "resume_version": job_data.get("resume_version"),
            "notes": job_data.get("notes")
        }).execute()
        
        print("✅ DEBUG: Job inserted successfully")
        return {"message": "Job added successfully", "job": data.data[0]}
    except Exception as e:
        print(f"❌ CRITICAL ERROR in /jobs POST: {e}")
        import traceback
        print(f"❌ FULL TRACEBACK: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))