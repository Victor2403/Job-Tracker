import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:8000";

// Add Job Modal Component
function AddJobModal({ isOpen, onClose, onJobAdded }) {
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
          resume_text: "Built ETL pipelines using Python and SQL. Familiar with dbt and Streamlit."
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

  console.log("🔍 Modal state:", isAddModalOpen);

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

  // Fixed pie chart component with visible segments
  const PieChart = ({ data, onSegmentClick }) => {
    const total = data.high + data.medium + data.low;
    if (total === 0) return <div className="text-gray-400">No data</div>;

    const highPercentage = (data.high / total) * 100;
    const mediumPercentage = (data.medium / total) * 100;
    const lowPercentage = (data.low / total) * 100;

    return (
      <div className="relative w-32 h-32 mx-auto">
        <svg viewBox="0 0 32 32" className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="16"
            cy="16"
            r="15.9155"
            className="fill-slate-800"
            strokeWidth="2"
            stroke="#1e293b"
          />
          {/* High matches - GREEN */}
          <circle
            cx="16"
            cy="16"
            r="15.9155"
            className="pie-chart-segment cursor-pointer hover:opacity-80"
            strokeWidth="32"
            stroke="#10b981"
            strokeLinecap="round"
            strokeDasharray={`${highPercentage} ${100 - highPercentage}`}
            onClick={() => onSegmentClick("high")}
          />
          {/* Medium matches - YELLOW */}
          {mediumPercentage > 0 && (
            <circle
              cx="16"
              cy="16"
              r="15.9155"
              className="pie-chart-segment cursor-pointer hover:opacity-80"
              strokeWidth="32"
              stroke="#eab308"
              strokeLinecap="round"
              strokeDasharray={`${mediumPercentage} ${100 - mediumPercentage}`}
              strokeDashoffset={-highPercentage}
              onClick={() => onSegmentClick("medium")}
            />
          )}
          {/* Low matches - RED */}
          {lowPercentage > 0 && (
            <circle
              cx="16"
              cy="16"
              r="15.9155"
              className="pie-chart-segment cursor-pointer hover:opacity-80"
              strokeWidth="32"
              stroke="#ef4444"
              strokeLinecap="round"
              strokeDasharray={`${lowPercentage} ${100 - lowPercentage}`}
              strokeDashoffset={-(highPercentage + mediumPercentage)}
              onClick={() => onSegmentClick("low")}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white font-bold text-lg">{total}</div>
            <div className="text-gray-400 text-xs">Total</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6 w-full max-w-full">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">🚀 Job Tracker Pro</h1>
        <p className="text-blue-200">AI-Powered Job Application Manager</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 max-w-7xl mx-auto">
        <div className="glass-card rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">Match Score Analytics</h3>
          <PieChart data={analyticsData} onSegmentClick={setActiveMatchFilter} />
          <div className="mt-6 text-center">
            <div className="flex justify-center space-x-6 text-sm">
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
              className="mt-4 text-blue-400 hover:text-blue-300 text-sm transition-colors"
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
      <div className="glass-card rounded-xl p-6 mb-6 max-w-7xl mx-auto">
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg"
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

      {/* Jobs Table */}
      {!loading && (
        <div className="glass-card rounded-xl overflow-hidden max-w-7xl mx-auto">
          {filteredJobs.length === 0 ? (
            <div className="text-center p-8">
              <p className="text-gray-400 text-lg">No jobs found. Try changing your filters or add some jobs!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800 text-left">
                    <th className="p-4 font-semibold">Title</th>
                    <th className="p-4 font-semibold">Company</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Match Score</th>
                    <th className="p-4 font-semibold">Notes</th>
                    <th className="p-4 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="job-card border-b border-slate-700 last:border-b-0 hover:bg-slate-800 transition-colors">
                      <td className="p-4 font-medium text-white">{job.title}</td>
                      <td className="p-4 text-blue-300 font-semibold">{job.company}</td>
                      <td className="p-4">
                        <span className={getStatusClass(job.status)}>
                          {job.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full font-bold ${getMatchScoreClass(job.match_score)}`}>
                          {job.match_score}%
                        </span>
                      </td>
                      <td className="p-4 text-gray-300">{job.notes || "-"}</td>
                      <td className="p-4 text-sm text-gray-400">
                        {new Date(job.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Job Modal */}
      <AddJobModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onJobAdded={fetchJobs}
      />
    </div>
  );
}

export default App;