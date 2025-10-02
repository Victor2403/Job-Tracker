# Job Tracker Pro

AI-powered job application tracker that:
- Stores job postings in Supabase
- Runs match scoring using OpenAI (`resume vs job description`)
- Tracks application status, resume versions, and notes
- Supports single inserts, batch inserts, queries, updates, and deletes

---

## 📌 Database Schema (Supabase `jobs` table)

| Column         | Type      | Description |
|----------------|----------|-------------|
| id             | int (PK) | Auto-increment primary key |
| created_at     | timestamptz | Row creation timestamp |
| title          | text     | Job title |
| company        | text     | Company name |
| description    | text     | Job description |
| match_score    | int      | AI-generated match score (0-100) |
| strengths      | text     | AI-detected strengths |
| gaps           | text     | AI-detected skill gaps |
| status         | text     | `"wishlist"`, `"applied"`, `"interview"`, `"offer"`, `"rejected"` |
| resume_version | text     | Which resume was used |
| notes          | text     | Personal notes on application |

---

## 🚀 Features

- **Add Job** → Insert a single job with AI match scoring.
- **Add Jobs Bulk** → Insert multiple postings in one call.
- **Get Jobs** → Fetch all jobs, with optional filters (status, company).
- **Update Job** → Update status, notes, or resume version.
- **Delete Job** → Remove a job by ID.
- **Error Handling** → Clean logging for failed inserts/queries.

---

## 🛠️ Example Usage

```python
# Insert single job
add_job("Data Engineer", "OpenAI", job_desc, resume_text,
        status="applied", resume_version="v1", notes="Met recruiter at Austin mixer")

# Bulk insert
add_jobs_bulk([
  {"title": "DE I", "company": "Google", "description": "Pipeline and dbt role"},
  {"title": "DA", "company": "Fannie Mae", "description": "Analytics and SQL-heavy role"}
], resume_text)

# Query
jobs = get_jobs(status="applied")