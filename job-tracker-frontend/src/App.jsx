import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:8000";

// Add Job Modal Component
function AddJobModal({ isOpen, onClose, onJobAdded, resumeText }) {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    description: '',
    status: 'wishlist',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${API_BASE}/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          resume_text: resumeText || "Built ETL pipelines using Python and SQL. Familiar with dbt and Streamlit."
        })
      });

      if (response.ok) {
        alert('🎉 Job added with AI match score!');
        setFormData({ title: '', company: '', description: '', status: 'wishlist', notes: '' });
        onJobAdded();
        onClose();
      } else {
        throw new Error('Failed to add job');
      }
    } catch (err) {
      alert('❌ Error adding job');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">➕ Add New Job</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-2">Job Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="form-input w-full p-3"
                placeholder="e.g., Senior Data Engineer"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Company *</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="form-input w-full p-3"
                placeholder="e.g., Google"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="form-input w-full p-3"
            >
              <option value="wishlist">Wishlist</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Job Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="form-input w-full p-3 h-32"
              placeholder="Paste the job description here... (AI will analyze it against your resume)"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2">Notes (Optional)</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="form-input w-full p-3"
              placeholder="e.g., Referred by John, applied on LinkedIn"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
            >
              {loading ? '🤖 AI Analyzing...' : '➕ Add Job with AI Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Job Card Component for Floating UI
function JobCard({ job, getMatchScoreClass, getStatusClass }) {
  return (
    <div className="job-card glass-card rounded-xl p-6 hover:shadow-2xl transition-all duration-300 border border-slate-700 hover:border-blue-500 cursor-pointer transform hover:-translate-y-1">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">{job.title}</h3>
          <p className="text-blue-300 font-semibold text-lg">{job.company}</p>
        </div>
        <span className={`px-4 py-2 rounded-full font-bold text-lg ${getMatchScoreClass(job.match_score)}`}>
          {job.match_score}%
        </span>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className={getStatusClass(job.status)}>
            {job.status}
          </span>
          <span className="text-gray-400 text-sm">
            {new Date(job.created_at).toLocaleDateString()}
          </span>
        </div>
        <div className="text-gray-300 max-w-xs truncate">
          {job.notes || "No notes"}
        </div>
      </div>
    </div>
  );
}

// Proper Pie Chart Component with SVG Paths (No Overlap)
function PieChart({ data, onSegmentClick }) {
  const total = data.high + data.medium + data.low;
  if (total === 0) return <div className="text-gray-400 text-center py-8">No data available</div>;

  const radius = 40;
  const center = 50;
  
  // Calculate angles for each segment
  const highAngle = (data.high / total) * 360;
  const mediumAngle = (data.medium / total) * 360;
  const lowAngle = (data.low / total) * 360;

  // Function to calculate SVG path for a segment
  const getSegmentPath = (startAngle, endAngle) => {
    if (endAngle - startAngle >= 360) endAngle = startAngle + 359.99;
    
    const start = (startAngle * Math.PI) / 180;
    const end = (endAngle * Math.PI) / 180;
    
    const x1 = center + radius * Math.cos(start);
    const y1 = center + radius * Math.sin(start);
    const x2 = center + radius * Math.cos(end);
    const y2 = center + radius * Math.sin(end);
    
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
    
    return `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
  };

  const highPath = getSegmentPath(0, highAngle);
  const mediumPath = getSegmentPath(highAngle, highAngle + mediumAngle);
  const lowPath = getSegmentPath(highAngle + mediumAngle, 360);

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* High matches - GREEN */}
        <path
          d={highPath}
          fill="#10b981"
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => onSegmentClick("high")}
        />
        {/* Medium matches - YELLOW */}
        {data.medium > 0 && (
          <path
            d={mediumPath}
            fill="#eab308"
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onSegmentClick("medium")}
          />
        )}
        {/* Low matches - RED */}
        {data.low > 0 && (
          <path
            d={lowPath}
            fill="#ef4444"
            className="cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => onSegmentClick("low")}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white font-bold text-2xl">{total}</div>
          <div className="text-gray-400 text-sm">Total Jobs</div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [statusFilter, setStatusFilter] = useState("All");
  const [companyFilter, setCompanyFilter] = useState("");
  const [titleFilter, setTitleFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeMatchFilter, setActiveMatchFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [resumeText, setResumeText] = useState(
    localStorage.getItem('jobTrackerResume') || "Built ETL pipelines using Python and SQL. Familiar with dbt and Streamlit. Experience with React, FastAPI, and machine learning. Strong background in data analysis and visualization."
  );

  // Save resume to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('jobTrackerResume', resumeText);
  }, [resumeText]);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, companyFilter]);

  useEffect(() => {
    filterAndSortJobs();
  }, [jobs, titleFilter, sortBy, activeMatchFilter]);

  async function fetchJobs() {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams();
      if (statusFilter !== "All") params.append("status", statusFilter);
      if (companyFilter) params.append("company", companyFilter);
      
      const response = await fetch(`${API_BASE}/jobs?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(`Failed to load jobs: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function filterAndSortJobs() {
    let filtered = jobs.filter(job => 
      job.title.toLowerCase().includes(titleFilter.toLowerCase()) &&
      (activeMatchFilter === "all" || 
       (activeMatchFilter === "high" && job.match_score >= 80) ||
       (activeMatchFilter === "medium" && job.match_score >= 50 && job.match_score < 80) ||
       (activeMatchFilter === "low" && job.match_score < 50))
    );

    // Sort jobs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "match_high":
          return b.match_score - a.match_score;
        case "match_low":
          return a.match_score - b.match_score;
        case "newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        default:
          return 0;
      }
    });

    setFilteredJobs(filtered);
  }

  // Analytics data for pie chart
  const analyticsData = {
    high: jobs.filter(job => job.match_score >= 80).length,
    medium: jobs.filter(job => job.match_score >= 50 && job.match_score < 80).length,
    low: jobs.filter(job => job.match_score < 50).length,
    total: jobs.length
  };

  const getMatchScoreClass = (score) => {
    if (score >= 80) return "match-score-high";
    if (score >= 50) return "match-score-medium";
    return "match-score-low";
  };

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 w-full max-w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">🚀 Job Tracker Pro</h1>
        <p className="text-blue-200">AI-Powered Job Application Manager</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6 max-w-7xl mx-auto">
          {error}
        </div>
      )}

      {/* Resume Section */}
      <div className="glass-card rounded-xl p-6 mb-8 max-w-7xl mx-auto">
        <h3 className="text-xl font-bold text-white mb-4">📝 My Resume</h3>
        <textarea
          value={resumeText}
          onChange={(e) => setResumeText(e.target.value)}
          className="form-input w-full p-4 h-32 resize-none"
          placeholder="Paste your resume here... AI will match jobs against this text"
        />
        <div className="flex justify-between items-center mt-3">
          <span className="text-gray-400 text-sm">
            {resumeText.length} characters • Updates automatically
          </span>
          <button 
            onClick={() => {
              localStorage.setItem('jobTrackerResume', resumeText);
              alert('✅ Resume saved! New jobs will use this for AI matching.');
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            💾 Save Resume
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 max-w-7xl mx-auto">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">Match Score Analytics</h3>
          <PieChart data={analyticsData} onSegmentClick={setActiveMatchFilter} />
          <div className="mt-6 text-center">
            <div className="flex justify-center space-x-6 text-sm mb-4">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-gray-300">High: {analyticsData.high}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                <span className="text-gray-300">Medium: {analyticsData.medium}</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-gray-300">Low: {analyticsData.low}</span>
              </div>
            </div>
            <button 
              onClick={() => setActiveMatchFilter("all")}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Show All Jobs
            </button>
          </div>
        </div>

        {/* Stats Card */}
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="text-gray-300">Total Jobs:</span>
              <span className="text-white font-semibold text-lg">{analyticsData.total}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-700">
              <span className="text-gray-300">Avg Match Score:</span>
              <span className="text-white font-semibold text-lg">
                {jobs.length ? Math.round(jobs.reduce((acc, job) => acc + job.match_score, 0) / jobs.length) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-300">Active Filter:</span>
              <span className="text-blue-400 font-semibold capitalize">{activeMatchFilter}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="glass-card rounded-xl p-6 mb-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input p-3"
          >
            <option value="All">All Status</option>
            <option value="wishlist">Wishlist</option>
            <option value="applied">Applied</option>
            <option value="interview">Interview</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
          </select>

          <input
            type="text"
            placeholder="Filter by company..."
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="form-input p-3"
          />

          <input
            type="text"
            placeholder="Search by job title..."
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            className="form-input p-3"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-input p-3"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="match_high">Highest Match</option>
            <option value="match_low">Lowest Match</option>
          </select>
        </div>

        {/* Add Job Button */}
        <div className="text-center">
          <button 
            onClick={() => {
              console.log("🎯 BUTTON CLICKED!");
              setIsAddModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg transform hover:scale-105"
          >
            + Add New Job with AI Match
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center p-8 max-w-7xl mx-auto">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-blue-300">Loading jobs from AI-powered backend...</p>
        </div>
      )}

      {/* Jobs Cards (Floating UI) */}
      {!loading && filteredJobs.length > 0 && (
        <div className="max-w-7xl mx-auto space-y-4">
          {filteredJobs.map((job) => (
            <JobCard 
              key={job.id}
              job={job}
              getMatchScoreClass={getMatchScoreClass}
              getStatusClass={getStatusClass}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredJobs.length === 0 && (
        <div className="text-center p-12 max-w-7xl mx-auto glass-card rounded-xl">
          <div className="text-6xl mb-4">📭</div>
          <h3 className="text-2xl font-bold text-white mb-2">No jobs found</h3>
          <p className="text-gray-400 mb-6">
            {jobs.length === 0 
              ? "Add your first job to get started with AI-powered matching!" 
              : "Try adjusting your filters to see more results."}
          </p>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            + Add Your First Job
          </button>
        </div>
      )}

      {/* Add Job Modal */}
      <AddJobModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onJobAdded={fetchJobs}
        resumeText={resumeText}
      />
    </div>
  );
}

export default App;