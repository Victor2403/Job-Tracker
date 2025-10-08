import os
import streamlit as st
from dotenv import load_dotenv
from supabase import create_client

# ======================
# Setup
# ======================
load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

st.set_page_config(page_title="Job Tracker Pro", layout="wide")
st.title("📊 Job Tracker Pro")

# ======================
# Filters
# ======================
status_filter = st.sidebar.selectbox(
    "Filter by status",
    ["All", "wishlist", "applied", "interview", "offer", "rejected"]
)
company_filter = st.sidebar.text_input("Filter by company")

# ======================
# Query Jobs
# ======================
def fetch_jobs(status=None, company=None):
    query = supabase.table("jobs").select("*")
    if status and status != "All":
        query = query.eq("status", status)
    if company:
        query = query.ilike("company", f"%{company}%")
    return query.execute().data

jobs = fetch_jobs(status_filter, company_filter)

# ======================
# Display
# ======================
if not jobs:
    st.info("No jobs found. Try adjusting filters.")
else:
    # Highlight match_score with colors
    def color_score(val):
        if val is None:
            return ""
        if val >= 80:
            return "background-color: lightgreen"
        elif val >= 50:
            return "background-color: khaki"
        else:
            return "background-color: lightcoral"

    jobs_df = st.experimental_data_editor(jobs, num_rows="dynamic", use_container_width=True)
    st.dataframe(
        jobs_df.style.applymap(color_score, subset=["match_score"])
    )