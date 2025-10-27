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
          <h2 className="text-3xl font-bold text-white">➕ Add New Job</h2>
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
              <label className="block text-gray-300 mb-2 text-lg">Job Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="form-input w-full p-3 text-lg"
                placeholder="e.g., Senior Data Engineer"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-2 text-lg">Company *</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="form-input w-full p-3 text-lg"
                placeholder="e.g., Google"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-lg">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="form-input w-full p-3 text-lg"
            >
              <option value="wishlist">Wishlist</option>
              <option value="applied">Applied</option>
              <option value="interview">Interview</option>
              <option value="offer">Offer</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-lg">Job Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="form-input w-full p-3 h-32 text-lg"
              placeholder="Paste the job description here... (AI will analyze it against your resume)"
            />
          </div>

          <div>
            <label className="block text-gray-300 mb-2 text-lg">Notes (Optional)</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="form-input w-full p-3 text-lg"
              placeholder="e.g., Referred by John, applied on LinkedIn"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors text-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 text-lg"
            >
              {loading ? '🤖 AI Analyzing...' : '➕ Add Job with AI Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Analytics Card Component
function AnalyticsCard({ title, children, className = "" }) {
  return (
    <div className={`glass-card rounded-xl p-6 ${className}`}>
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      {children}
    </div>
  );
}

// Application Funnel Component
function ApplicationFunnel({ funnelData }) {
  const total = Object.values(funnelData).reduce((sum, count) => sum + count, 0);
  if (total === 0) return <div className="text-gray-400 text-center py-4">No data available</div>;

  const stages = [
    { key: 'wishlist', label: 'Wishlist', color: 'bg-gray-500' },
    { key: 'applied', label: 'Applied', color: 'bg-blue-500' },
    { key: 'interview', label: 'Interview', color: 'bg-yellow-500' },
    { key: 'offer', label: 'Offer', color: 'bg-green-500' },
    { key: 'rejected', label: 'Rejected', color: 'bg-red-500' }
  ];

  return (
    <div className="space-y-3">
      {stages.map((stage) => {
        const count = funnelData[stage.key] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        return (
          <div key={stage.key} className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className={`w-3 h-3 rounded-full ${stage.color}`}></div>
              <span className="text-gray-300 font-medium">{stage.label}</span>
            </div>
            <div className="text-right">
              <span className="text-white font-semibold">{count}</span>
              <span className="text-gray-400 text-sm ml-2">({Math.round(percentage)}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Top Companies Component
function TopCompanies({ companies }) {
  if (!companies || companies.length === 0) {
    return <div className="text-gray-400 text-center py-4">Need more applications for analysis</div>;
  }

  return (
    <div className="space-y-3">
      {companies.map((company, index) => (
        <div key={company.company} className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}</div>
            <div>
              <div className="text-white font-semibold">{company.company}</div>
              <div className="text-gray-400 text-sm">{company.application_count} applications</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-green-400 font-bold text-lg">{company.avg_match_score}%</div>
            <div className="text-gray-400 text-sm">avg match</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skills Gap Component
function SkillsGapAnalysis({ gaps }) {
  if (!gaps || gaps.length === 0) {
    return <div className="text-gray-400 text-center py-4">No skill gaps identified yet</div>;
  }

  return (
    <div className="space-y-3">
      {gaps.map((gap, index) => (
        <div key={gap.skill} className="flex items-center justify-between p-3 bg-red-900 bg-opacity-30 rounded-lg">
          <div className="flex items-center space-x-3">
            <span className="text-red-400 text-xl">❌</span>
            <span className="text-white font-semibold">{gap.skill}</span>
          </div>
          <div className="text-red-300 font-semibold">
            {gap.frequency} {gap.frequency === 1 ? 'job' : 'jobs'}
          </div>
        </div>
      ))}
    </div>
  );
}

// Monthly Trends Component
function MonthlyTrends({ trends }) {
  if (!trends || trends.length === 0) {
    return <div className="text-gray-400 text-center py-4">No trend data available</div>;
  }

  const maxApplications = Math.max(...trends.map(t => t.applications));

  return (
    <div className="space-y-4">
      {trends.map((trend) => {
        const barWidth = maxApplications > 0 ? (trend.applications / maxApplications) * 100 : 0;
        
        return (
          <div key={trend.month} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">{trend.month}</span>
              <span className="text-white font-semibold">{trend.applications} apps • {trend.avg_match_score}% avg</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${barWidth}%` }}
              ></div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Proper Pie Chart Component with SVG Paths (No Overlap)
function PieChart({ data, onSegmentClick }) {
  const total = data.high + data.medium + data.low;
  if (total === 0) return <div className="text-gray-400 text-center py-4 text-sm">No data available</div>;

  const radius = 30; // Reduced from 40
  const center = 35; // Reduced from 50
  
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
    <div className="relative w-32 h-32 mx-auto"> {/* Reduced from w-48 h-48 */}
      <svg viewBox="0 0 70 70" className="w-full h-full"> {/* Reduced viewBox */}
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
          <div className="text-white font-bold text-lg">{total}</div> {/* Reduced text size */}
          <div className="text-gray-400 text-xs">Total Jobs</div> {/* Reduced text size */}
        </div>
      </div>
    </div>
  );
}

// Skill Breakdown Modal Component
function SkillBreakdownModal({ job, isOpen, onClose }) {
  if (!isOpen || !job) return null;

  const getMatchLevelIcon = (level) => {
    switch (level) {
      case 'strong': return '✅';
      case 'good': return '✓';
      case 'partial': return '⚠️';
      case 'missing': return '❌';
      default: return '○';
    }
  };

  const getMatchLevelColor = (level) => {
    switch (level) {
      case 'strong': return 'text-green-400';
      case 'good': return 'text-green-300';
      case 'partial': return 'text-yellow-400';
      case 'missing': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white">🎯 Skill Match Analysis</h2>
            <p className="text-blue-300 mt-2 text-lg">{job.title} at {job.company}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        {/* Overall Match Score */}
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-semibold text-white">Overall Match Score</h3>
              <p className="text-gray-400 text-lg">Based on skill alignment analysis</p>
            </div>
            <div className="text-right">
              <span className={`text-4xl font-bold ${job.match_score >= 80 ? 'text-green-400' : job.match_score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                {job.match_score}%
              </span>
              <p className="text-gray-400 text-lg">AI Analyzed</p>
            </div>
          </div>
        </div>

        {/* Skill Breakdown */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-white mb-4">📊 Skill-by-Skill Analysis</h3>
          <div className="space-y-3">
            {job.skill_breakdown && job.skill_breakdown.length > 0 ? (
              job.skill_breakdown.map((skill, index) => (
                <div key={index} className="flex items-start justify-between p-4 bg-slate-800 rounded-lg hover:bg-slate-750 transition-colors">
                  <div className="flex items-start space-x-4 flex-1">
                    <span className="text-2xl mt-1">{getMatchLevelIcon(skill.match_level)}</span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-semibold text-white text-lg">{skill.skill}</span>
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${getMatchLevelColor(skill.match_level)} bg-opacity-20 ${skill.match_level === 'strong' ? 'bg-green-400' : skill.match_level === 'good' ? 'bg-green-400' : skill.match_level === 'partial' ? 'bg-yellow-400' : 'bg-red-400'}`}>
                          {skill.match_level.toUpperCase()}
                        </span>
                        {skill.importance === 'high' && (
                          <span className="text-sm bg-red-500 text-white px-3 py-1 rounded-full">CRITICAL</span>
                        )}
                      </div>
                      <p className="text-gray-300 text-lg">{skill.reason}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400 text-lg">
                No skill breakdown available
              </div>
            )}
          </div>
        </div>

        {/* Strengths & Gaps Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-green-900 bg-opacity-30 rounded-lg p-6">
            <h4 className="font-semibold text-green-400 mb-3 text-lg">✅ Key Strengths</h4>
            <p className="text-green-200 text-lg">{job.strengths || "No specific strengths identified"}</p>
          </div>
          <div className="bg-red-900 bg-opacity-30 rounded-lg p-6">
            <h4 className="font-semibold text-red-400 mb-3 text-lg">❌ Identified Gaps</h4>
            <p className="text-red-200 text-lg">{job.gaps || "No major gaps identified"}</p>
          </div>
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg"
          >
            Close Analysis
          </button>
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
  const [selectedJob, setSelectedJob] = useState(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [resumeText, setResumeText] = useState(
    localStorage.getItem('jobTrackerResume') || "Built ETL pipelines using Python and SQL. Familiar with dbt and Streamlit. Experience with React, FastAPI, and machine learning. Strong background in data analysis and visualization."
  );
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  
  // New analytics states
  const [topCompanies, setTopCompanies] = useState([]);
  const [applicationFunnel, setApplicationFunnel] = useState({});
  const [skillsGap, setSkillsGap] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Save resume to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('jobTrackerResume', resumeText);
  }, [resumeText]);

  useEffect(() => {
    fetchJobs();
    fetchAnalytics();
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

  async function fetchAnalytics() {
    try {
      setAnalyticsLoading(true);
      
      const [companiesRes, funnelRes, gapsRes, trendsRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/top-companies`),
        fetch(`${API_BASE}/analytics/application-funnel`),
        fetch(`${API_BASE}/analytics/skills-gap-analysis`),
        fetch(`${API_BASE}/analytics/monthly-trends`)
      ]);

      if (companiesRes.ok) setTopCompanies((await companiesRes.json()).top_companies || []);
      if (funnelRes.ok) setApplicationFunnel((await funnelRes.json()).funnel || {});
      if (gapsRes.ok) setSkillsGap((await gapsRes.json()).common_gaps || []);
      if (trendsRes.ok) setMonthlyTrends((await trendsRes.json()).monthly_trends || []);
      
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setAnalyticsLoading(false);
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

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    await processResumeFile(file);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleFileDrop = async (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) {
      await processResumeFile(file);
    }
  };

  const processResumeFile = async (file) => {
    if (!file.type.includes('pdf') && !file.type.includes('word')) {
      alert('❌ Please upload a PDF or DOCX file');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE}/upload-resume`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.success) {
        setResumeText(result.resume_text);
        setUploadedFileName(file.name);
        alert(`✅ Resume uploaded successfully! Extracted ${result.char_count} characters.`);
      } else {
        throw new Error(result.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('❌ Failed to upload resume. Please try again or paste text manually.');
    } finally {
      setIsUploading(false);
    }
  };

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

  // Add this function to handle viewing skill breakdown
  const viewSkillBreakdown = (job) => {
    setSelectedJob(job);
    setIsSkillModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8 w-full max-w-full">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">🚀 Job Tracker Pro</h1>
        <p className="text-blue-200 text-xl">AI-Powered Job Application Manager</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-200 px-6 py-4 rounded-xl mb-8 max-w-7xl mx-auto text-lg">
          {error}
        </div>
      )}

      {/* Resume Section */}
      <div className="glass-card rounded-xl p-8 mb-8 max-w-7xl mx-auto">
        <h3 className="text-2xl font-bold text-white mb-6">📝 My Resume</h3>
        
        {/* File Upload Area */}
        <div 
          className="border-2 border-dashed border-slate-600 rounded-xl p-10 text-center mb-6 cursor-pointer hover:border-blue-500 transition-colors"
          onDrop={handleFileDrop}
          onDragOver={handleDragOver}
          onClick={() => document.getElementById('resume-upload').click()}
        >
          <input
            type="file"
            id="resume-upload"
            className="hidden"
            accept=".pdf,.docx"
            onChange={handleFileUpload}
          />
          <div className="text-5xl mb-4">📄</div>
          <p className="text-gray-300 font-semibold text-xl">Upload Your Resume</p>
          <p className="text-gray-400 text-lg mt-2">Drag & drop PDF or DOCX, or click to browse</p>
          <p className="text-gray-500 text-base mt-3">Supports: PDF, DOCX files</p>
        </div>

        {/* Resume Text Area */}
        <div className="mt-6">
          <label className="block text-gray-300 mb-3 text-xl">Or paste resume text manually:</label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="form-input w-full p-5 h-40 resize-none text-lg"
            placeholder="Paste your resume text here... AI will match jobs against this text"
          />
        </div>

        <div className="flex justify-between items-center mt-6">
          <span className="text-gray-400 text-lg">
            {isUploading ? '📤 Uploading...' : `${resumeText.length} characters • ${uploadedFileName || 'No file uploaded'}`}
          </span>
          <button 
            onClick={() => {
              localStorage.setItem('jobTrackerResume', resumeText);
              alert('✅ Resume saved! New jobs will use this for AI matching.');
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-lg"
          >
            💾 Save Resume
          </button>
        </div>
      </div>



    {/* Analytics Dashboard - USING CUSTOM GRID LIKE VERSION 6 */}
<div className="max-w-7xl mx-auto mb-12">
  <h2 className="text-3xl font-bold text-white mb-8">📊 Advanced Analytics Dashboard</h2>
  
  {/* TOP ROW: 4 Cards - Using custom grid */}
  <div className="analytics-grid mb-8">
    {/* Pie Chart */}
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 text-center">🎯 Match Score Analytics</h3>
      <PieChart data={analyticsData} onSegmentClick={setActiveMatchFilter} />
      <div className="mt-4 text-center">
        <div className="flex justify-center space-x-4 text-sm mb-3">
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

    {/* Quick Stats */}
    <div className="glass-card rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">📊 Quick Stats</h3>
      <div className="space-y-3">
        <div className="flex justify-between items-center py-2 border-b border-slate-700">
          <span className="text-gray-300">Total Jobs:</span>
          <span className="text-white font-semibold">{analyticsData.total}</span>
        </div>
        <div className="flex justify-between items-center py-2 border-b border-slate-700">
          <span className="text-gray-300">Avg Match Score:</span>
          <span className="text-white font-semibold">
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

  {/* BOTTOM ROW: Other analytics cards - Using flex for responsiveness */}
  <div className="flex flex-col md:flex-row gap-6 mb-8">
    {/* Application Funnel */}
    <div className="flex-1">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📈 Application Funnel</h3>
        {analyticsLoading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-blue-300 text-sm">Loading analytics...</p>
          </div>
        ) : (
          <ApplicationFunnel funnelData={applicationFunnel} />
        )}
      </div>
    </div>

    {/* Top Companies */}
    <div className="flex-1">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🏆 Top Companies</h3>
        {analyticsLoading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-blue-300 text-sm">Loading analytics...</p>
          </div>
        ) : (
          <TopCompanies companies={topCompanies} />
        )}
      </div>
    </div>
  </div>

  {/* Skills Gap & Monthly Trends - Another row */}
  <div className="flex flex-col md:flex-row gap-6">
    {/* Skills Gap Analysis */}
    <div className="flex-1">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">🎯 Skills Gap Analysis</h3>
        {analyticsLoading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-blue-300 text-sm">Loading analytics...</p>
          </div>
        ) : (
          <SkillsGapAnalysis gaps={skillsGap} />
        )}
      </div>
    </div>

    {/* Monthly Trends */}
    <div className="flex-1">
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">📅 Monthly Application Trends</h3>
        {analyticsLoading ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <p className="mt-2 text-blue-300 text-sm">Loading trends...</p>
          </div>
        ) : (
          <MonthlyTrends trends={monthlyTrends} />
        )}
      </div>
    </div>
  </div>
</div>




      {/* Filters & Search */}
      <div className="glass-card rounded-xl p-8 mb-8 max-w-7xl mx-auto">
        <h3 className="text-2xl font-bold text-white mb-6">🔍 Filters & Search</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input p-4 text-lg"
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
            className="form-input p-4 text-lg"
          />

          <input
            type="text"
            placeholder="Search by job title..."
            value={titleFilter}
            onChange={(e) => setTitleFilter(e.target.value)}
            className="form-input p-4 text-lg"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="form-input p-4 text-lg"
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
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-xl font-semibold transition-colors text-xl"
          >
            + Add New Job with AI Match
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center p-12 max-w-7xl mx-auto">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          <p className="mt-6 text-blue-300 text-xl">Loading jobs from AI-powered backend...</p>
        </div>
      )}

      {/* Jobs Table */}
      {!loading && (
        <div className="max-w-7xl mx-auto overflow-x-auto">
          <table className="w-full glass-card border-collapse rounded-xl overflow-hidden">
            <thead className="bg-slate-800 text-gray-200">
              <tr>
                <th className="py-4 px-6 text-left text-lg">Title</th>
                <th className="py-4 px-6 text-left text-lg">Company</th>
                <th className="py-4 px-6 text-left text-lg">Status</th>
                <th className="py-4 px-6 text-left text-lg">Match</th>
                <th className="py-4 px-6 text-left text-lg">Notes</th>
                <th className="py-4 px-6 text-left text-lg">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id} className="border-b border-slate-700 hover:bg-slate-800 transition">
                  <td className="py-4 px-6 text-white font-semibold text-lg">{job.title}</td>
                  <td className="py-4 px-6 text-blue-300 text-lg">{job.company}</td>
                  <td className="py-4 px-6">
                    <span className={getStatusClass(job.status)}>{job.status}</span>
                  </td>
                  <td 
                    className={`py-4 px-6 font-bold text-lg ${getMatchScoreClass(job.match_score)} cursor-pointer hover:underline transition-all`}
                    onClick={() => viewSkillBreakdown(job)}
                    title="Click to view detailed skill breakdown"
                  >
                    {job.match_score}%
                  </td>
                  <td className="py-4 px-6 text-gray-300 text-lg truncate max-w-xs">{job.notes || "-"}</td>
                  <td className="py-4 px-6 text-gray-400 text-lg">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Job Modal */}
      <AddJobModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onJobAdded={() => {
          fetchJobs();
          fetchAnalytics();
        }}
        resumeText={resumeText}
      />

      {/* Skill Breakdown Modal */}
      <SkillBreakdownModal 
        job={selectedJob}
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
      />
    </div>
  );
}

export default App;