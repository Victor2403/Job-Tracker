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
      <div className="glass-card rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-white">➕ Add New Job</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-white mb-3 text-lg font-semibold">Job Title *</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="form-input w-full p-4 text-lg bg-slate-800 border-slate-600"
                placeholder="e.g., Senior Data Engineer"
              />
            </div>
            <div>
              <label className="block text-white mb-3 text-lg font-semibold">Company *</label>
              <input
                type="text"
                required
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                className="form-input w-full p-4 text-lg bg-slate-800 border-slate-600"
                placeholder="e.g., Google"
              />
            </div>
          </div>

          <div>
            <label className="block text-white mb-3 text-lg font-semibold">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="form-input w-full p-4 text-lg bg-slate-800 border-slate-600 text-black"
            >
              <option value="wishlist" className="text-black bg-white">Wishlist</option>
              <option value="applied" className="text-black bg-white">Applied</option>
              <option value="interview" className="text-black bg-white">Interview</option>
              <option value="offer" className="text-black bg-white">Offer</option>
              <option value="rejected" className="text-black bg-white">Rejected</option>
            </select>
          </div>

          <div>
            <label className="block text-white mb-3 text-lg font-semibold">Job Description *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="form-input w-full p-4 h-48 text-lg bg-slate-800 border-slate-600 resize-vertical"
              placeholder="Paste the job description here... (AI will analyze it against your resume)"
            />
          </div>

          <div>
            <label className="block text-white mb-3 text-lg font-semibold">Notes (Optional)</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="form-input w-full p-4 text-lg bg-slate-800 border-slate-600"
              placeholder="e.g., Referred by John, applied on LinkedIn"
            />
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-4 border border-slate-600 text-gray-300 rounded-lg hover:bg-slate-700 transition-colors text-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors disabled:opacity-50 text-lg"
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

// Application Funnel Component - ENHANCED 2 COLUMN LAYOUT
function ApplicationFunnel({ funnelData }) {
  const total = Object.values(funnelData).reduce((sum, count) => sum + count, 0);
  if (total === 0) return <div className="text-gray-400 text-center py-4">No data available</div>;

  const stages = [
    { key: 'wishlist', label: 'Wishlist', color: 'bg-purple-500' },
    { key: 'applied', label: 'Applied', color: 'bg-blue-500' },
    { key: 'interview', label: 'Interview', color: 'bg-yellow-500' },
    { key: 'offer', label: 'Offer', color: 'bg-green-500' },
    { key: 'rejected', label: 'Rejected', color: 'bg-red-500' }
  ];

  // Split stages into two columns
  const firstColumn = stages.slice(0, 3);
  const secondColumn = stages.slice(3);

  return (
    <div className="funnel-grid-2col">
      {firstColumn.map((stage) => {
        const count = funnelData[stage.key] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        return (
          <div key={stage.key} className="funnel-item">
            <div className="funnel-count">{count}</div>
            <div className="funnel-label">{stage.label}</div>
            <div className="funnel-percentage">{Math.round(percentage)}%</div>
          </div>
        );
      })}
      
      {secondColumn.map((stage) => {
        const count = funnelData[stage.key] || 0;
        const percentage = total > 0 ? (count / total) * 100 : 0;
        
        return (
          <div key={stage.key} className="funnel-item">
            <div className="funnel-count">{count}</div>
            <div className="funnel-label">{stage.label}</div>
            <div className="funnel-percentage">{Math.round(percentage)}%</div>
          </div>
        );
      })}
    </div>
  );
}

// Top Companies Component - CLEAN 2-LINE LAYOUT
function TopCompanies({ companies, jobs }) {
  if (!companies || companies.length === 0) {
    // Fallback: Show top 10 jobs by match score - CLEAN 2-LINE VERSION
    const topMatches = jobs
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 10);
    
    return (
      <div className="space-y-3">
        {topMatches.map((job, index) => (
          <div key={job.id} className="clean-job-item">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="text-gray-400 text-sm font-medium w-5">{index + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-sm truncate">
                    {job.company} • {job.title}
                  </div>
                  <div className="text-gray-400 text-xs truncate">
                    {job.match_score}% match
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {companies.map((company, index) => (
        <div key={company.company} className="clean-job-item">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <span className="text-gray-400 text-sm font-medium w-5">{index + 1}.</span>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm truncate">
                  {company.company}
                </div>
                <div className="text-gray-400 text-xs truncate">
                  {company.application_count} applications • {company.avg_match_score}% avg match
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Skills Gap Component - COMPACT SINGLE LINE FORMAT
function SkillsGapAnalysis({ gaps }) {
  if (!gaps || gaps.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">✅</div>
        <p className="text-gray-400 text-sm">No major skill gaps identified</p>
        <p className="text-gray-500 text-xs mt-1">Your resume matches well with current jobs</p>
      </div>
    );
  }

  return (
    <div className="skills-gap-container">
      {gaps.map((gap, index) => (
        <div key={gap.skill} className="skill-gap-item">
          <div className="skill-gap-content">
            <span className="text-red-400 text-lg">❌</span>
            <span className="skill-gap-name">{gap.skill}</span>
            <span className="text-gray-400 text-sm">/</span>
            <span className="skill-gap-meta">Missing in {gap.frequency} {gap.frequency === 1 ? 'job' : 'jobs'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// Monthly Trends Component - SIMPLE BAR CHART WITH REAL DATA
function MonthlyTrends({ jobs }) {
  // Calculate weekly application data from actual jobs
  const calculateWeeklyData = () => {
    if (!jobs || jobs.length === 0) return [];
    
    // Group jobs by week of application
    const jobsByWeek = {};
    
    jobs.forEach(job => {
      if (job.created_at) {
        const date = new Date(job.created_at);
        // Get year and week number
        const year = date.getFullYear();
        const weekNumber = getWeekNumber(date);
        const weekKey = `W${weekNumber}`;
        
        if (!jobsByWeek[weekKey]) {
          jobsByWeek[weekKey] = {
            count: 0,
            label: weekKey,
            fullLabel: `Week ${weekNumber}`
          };
        }
        jobsByWeek[weekKey].count++;
      }
    });
    
    // Convert to array and sort by week
    return Object.values(jobsByWeek)
      .sort((a, b) => parseInt(a.label.substring(1)) - parseInt(b.label.substring(1)));
  };

  // Helper function to get week number
  const getWeekNumber = (date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const weeklyData = calculateWeeklyData();
  const totalApplications = jobs?.length || 0;
  const averageWeekly = weeklyData.length > 0 
    ? Math.round(totalApplications / weeklyData.length) 
    : 0;
  const peakWeekly = weeklyData.length > 0 
    ? Math.max(...weeklyData.map(d => d.count)) 
    : 0;

  // Simple Bar Chart Component
  const SimpleBarChart = ({ data }) => {
    if (!data || data.length === 0) {
      return (
        <div className="chart-container" style={{ 
          height: '200px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          color: '#94a3b8',
          background: 'rgba(0, 0, 0, 0.2)',
          borderRadius: '12px',
          border: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          No application data available yet
        </div>
      );
    }

    const maxCount = Math.max(...data.map(d => d.count));
    const chartHeight = 160;
    
    return (
      <div className="chart-container" style={{ 
        height: '220px',
        padding: '20px 15px 10px 15px',
        background: 'rgba(0, 0, 0, 0.2)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        position: 'relative'
      }}>
        {/* Y-axis labels */}
        <div style={{
          position: 'absolute',
          left: '10px',
          top: '20px',
          bottom: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          fontSize: '0.7rem',
          color: '#94a3b8',
          fontWeight: '600'
        }}>
          {[maxCount, Math.floor(maxCount * 0.75), Math.floor(maxCount * 0.5), Math.floor(maxCount * 0.25), 0].map((value, idx) => (
            <div key={idx}>{value}</div>
          ))}
        </div>

        {/* Bars container */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'end',
          justifyContent: 'space-between',
          height: `${chartHeight}px`,
          marginLeft: '30px',
          gap: '8px'
        }}>
          {data.map((item, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              flex: 1,
              height: '100%'
            }}>
              {/* Bar */}
              <div 
                style={{
                  background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)',
                  width: '100%',
                  maxWidth: '35px',
                  height: `${(item.count / maxCount) * 100}%`,
                  borderRadius: '4px 4px 0 0',
                  minHeight: '4px',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  position: 'relative'
                }}
                className="hover:brightness-125 transition-all"
                title={`${item.count} application${item.count === 1 ? '' : 's'} in ${item.fullLabel}`}
              >
                {/* Bar value label */}
                <div style={{
                  position: 'absolute',
                  top: '-25px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.75rem',
                  color: '#60a5fa',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>
                  {item.count}
                </div>
              </div>
              
              {/* Week label */}
              <div style={{
                fontSize: '0.7rem',
                color: '#94a3b8',
                marginTop: '8px',
                textAlign: 'center',
                fontWeight: '600'
              }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>

        {/* X-axis label */}
        <div style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: '#94a3b8',
          marginTop: '10px',
          fontWeight: '600'
        }}>
          Weeks
        </div>
      </div>
    );
  };

  return (
    <div className="fixed-trends-chart">
      {/* Stats Grid */}
      <div className="chart-header">
        <div className="chart-stats-grid">
          <div className="chart-stat">
            <span className="stat-value">{totalApplications}</span>
            <span className="stat-label">Total Jobs</span>
          </div>
          <div className="chart-stat">
            <span className="stat-value">{averageWeekly}</span>
            <span className="stat-label">Avg/Week</span>
          </div>
          <div className="chart-stat">
            <span className="stat-value">{peakWeekly}</span>
            <span className="stat-label">Peak Week</span>
          </div>
        </div>
      </div>

      {/* Simple Bar Chart */}
      <SimpleBarChart data={weeklyData} />

      <div className="chart-footer">
        <div className="trend-indicator">
          <div className="trend-dot"></div>
          <span>Weekly Application Trend</span>
        </div>
        <div className="current-value">
          Total: {totalApplications} jobs
        </div>
      </div>
    </div>
  );
}

// Enhanced Pie Chart Component with 3D Hover Effects
function PieChart({ data, onSegmentClick }) {
  const total = data.high + data.medium + data.low;
  if (total === 0) return <div className="text-gray-400 text-center py-4 text-sm">No data available</div>;

  const radius = 40;
  const center = 50;
  
  const highAngle = (data.high / total) * 360;
  const mediumAngle = (data.medium / total) * 360;
  const lowAngle = (data.low / total) * 360;

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
    <div className="pie-chart-container">
      <div className="relative w-40 h-40 mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* High matches - GREEN with enhanced hover */}
          <path
            d={highPath}
            fill="#10b981"
            className="pie-segment cursor-pointer"
            onClick={() => onSegmentClick("high")}
          />
          {/* Medium matches - YELLOW with enhanced hover */}
          {data.medium > 0 && (
            <path
              d={mediumPath}
              fill="#eab308"
              className="pie-segment cursor-pointer"
              onClick={() => onSegmentClick("medium")}
            />
          )}
          {/* Low matches - RED with enhanced hover */}
          {data.low > 0 && (
            <path
              d={lowPath}
              fill="#ef4444"
              className="pie-segment cursor-pointer"
              onClick={() => onSegmentClick("low")}
            />
          )}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white font-bold text-xl">{total}</div>
            <div className="text-gray-400 text-sm">Total Jobs</div>
          </div>
        </div>
      </div>
      <div className="mt-6 text-center">
        <div className="flex justify-center space-x-6 text-sm mb-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span className="text-white">High: {data.high}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
            <span className="text-white">Medium: {data.medium}</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span className="text-white">Low: {data.low}</span>
          </div>
        </div>
        <button 
          onClick={() => onSegmentClick("all")}
          className="text-blue-400 hover:text-blue-300 text-sm transition-colors font-semibold"
        >
          Show All Jobs
        </button>
      </div>
    </div>
  );
}

// Enhanced Skill Breakdown Modal Component - COMPACT LAYOUT
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
            <h2 className="text-2xl font-bold text-white">🎯 Skill Match Analysis</h2>
            <p className="text-blue-300 mt-1 text-md">{job.title} at {job.company}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="glass-card rounded-lg p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-white">Overall Match Score</h3>
              <p className="text-gray-400 text-sm">Based on skill alignment analysis</p>
            </div>
            <div className="text-right">
              <span className={`text-3xl font-bold ${job.match_score >= 75 ? 'text-green-400' : job.match_score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {job.match_score}%
                  </span>
              <p className="text-gray-400 text-sm">AI Analyzed</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">📊 Skill Analysis</h3>
          <div className="skill-match-container">
            {job.skill_breakdown && job.skill_breakdown.length > 0 ? (
              job.skill_breakdown.map((skill, index) => (
                <div key={index} className="skill-match-item">
                  <div className="skill-match-content">
                    <span className="text-xl flex-shrink-0">{getMatchLevelIcon(skill.match_level)}</span>
                    <span className="skill-match-name">{skill.skill}</span>
                    <span className={`skill-match-level ${skill.match_level}`}>
                      {skill.match_level.toUpperCase()}
                    </span>
                    {skill.importance === 'high' && (
                      <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">CRITICAL</span>
                    )}
                    <span className="skill-match-description">{skill.reason}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-400 text-md">
                No skill breakdown available
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="glass-card rounded-lg p-4 border-l-4 border-green-500">
            <h4 className="font-semibold text-green-400 mb-2 text-sm">✅ Key Strengths</h4>
            <p className="text-green-200 text-sm">{job.strengths || "No specific strengths identified"}</p>
          </div>
          <div className="glass-card rounded-lg p-4 border-l-4 border-red-500">
            <h4 className="font-semibold text-red-400 mb-2 text-sm">❌ Identified Gaps</h4>
            <p className="text-red-200 text-sm">{job.gaps || "No major gaps identified"}</p>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors text-sm"
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
  
  const [topCompanies, setTopCompanies] = useState([]);
  const [applicationFunnel, setApplicationFunnel] = useState({});
  const [skillsGap, setSkillsGap] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

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
     (activeMatchFilter === "high" && job.match_score >= 75) ||          // Changed to 75 and above
     (activeMatchFilter === "medium" && job.match_score >= 50 && job.match_score < 75) || // Changed to below 75
     (activeMatchFilter === "low" && job.match_score < 50))
  );

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

  const analyticsData = {
  high: jobs.filter(job => job.match_score >= 75).length,          // Changed to 75 and above
  medium: jobs.filter(job => job.match_score >= 50 && job.match_score < 75).length, // Changed to below 75
  low: jobs.filter(job => job.match_score < 50).length,
  total: jobs.length
};

  const getMatchScoreClass = (score) => {
  if (score >= 75) return "match-score-high";          // Changed to 75 and above
  if (score >= 50) return "match-score-medium";        // Medium is now 50-74
  return "match-score-low";
};

  const getStatusClass = (status) => {
    return `status-badge status-${status}`;
  };

  const viewSkillBreakdown = (job) => {
    setSelectedJob(job);
    setIsSkillModalOpen(true);
  };

  return (
    <div className="app-container p-8 w-full max-w-full mx-auto">
      {/* Header - MOVED RIGHT */}
      <div className="flex justify-center mb-12 w-full">
        <div className="text-center w-full ml-12"> {/* CHANGED: Added ml-12 to move right */}
          <h1 className="text-display font-bold text-primary tracking-tight text-center leading-tight">
            AI Job Tracker
          </h1>
          <p className="text-body text-secondary mt-4">AI-Powered Job Application Manager</p>
        </div>
      </div>

      {error && (
        <div className="glass-card border-l-4 border-red-500 p-6 mb-8 max-w-7xl mx-auto">
          <div className="text-red-200 text-lg">{error}</div>
        </div>
      )}

      {/* Resume Section - LARGER TEXT AREA */}
      <div className="glass-card rounded-xl p-8 mb-8 max-w-7xl mx-auto">
        <h3 className="text-title font-bold text-primary mb-6">📝 My Resume</h3>
        
        <div 
          className="border-2 border-dashed border-slate-600 rounded-xl p-12 text-center mb-8 cursor-pointer hover:border-blue-500 transition-colors bg-slate-800 bg-opacity-50"
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
          <div className="text-6xl mb-6">📄</div>
          <p className="text-body font-semibold mb-2">Upload Your Resume</p>
          <p className="text-muted text-lg mb-4">Drag & drop PDF or DOCX, or click to browse</p>
          <p className="text-gray-500 text-base">Supports: PDF, DOCX files</p>
        </div>

        <div className="mt-8">
          <label className="block text-primary mb-4 text-xl font-semibold">Or paste resume text manually:</label>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="resume-textarea form-input"
            placeholder="Paste your resume text here... AI will match jobs against this text"
          />
        </div>

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-700">
          <span className="text-muted text-lg">
            {isUploading ? '📤 Uploading...' : `${resumeText.length} characters • ${uploadedFileName || 'No file uploaded'}`}
          </span>
          <button 
            onClick={() => {
              localStorage.setItem('jobTrackerResume', resumeText);
              alert('✅ Resume saved! New jobs will use this for AI matching.');
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-semibold transition-colors text-lg"
          >
            💾 Save Resume
          </button>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="max-w-7xl mx-auto mb-12">
        <h2 className="text-headline font-bold text-primary mb-8">📊 Advanced Analytics Dashboard</h2>
        
        <div className="analytics-grid mb-8">
          <AnalyticsCard title="🎯 Match Score Analytics">
            <PieChart data={analyticsData} onSegmentClick={setActiveMatchFilter} />
          </AnalyticsCard>

          {/* QUICK STATS - APPLICATION FUNNEL STYLE */}
          <AnalyticsCard title="📊 Quick Stats">
            <div className="funnel-grid-2col">
              <div className="funnel-item">
                <div className="funnel-count">{analyticsData.total}</div>
                <div className="funnel-label">Total Jobs</div>
              </div>
              <div className="funnel-item">
                <div className="funnel-count">
                  {jobs.length ? Math.round(jobs.reduce((acc, job) => acc + job.match_score, 0) / jobs.length) : 0}%
                </div>
                <div className="funnel-label">Avg Match</div>
              </div>
              <div className="funnel-item">
                <div className="funnel-count">{analyticsData.high}</div>
                <div className="funnel-label">High Match</div>
              </div>
              <div className="funnel-item">
                <div className="funnel-count">{analyticsData.medium + analyticsData.low}</div>
                <div className="funnel-label">Needs Work</div>
              </div>
            </div>
          </AnalyticsCard>
        </div>

        <div className="analytics-grid mb-8">
          <AnalyticsCard title="📈 Application Funnel">
            {analyticsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-3 text-blue-300">Loading analytics...</p>
              </div>
            ) : (
              <ApplicationFunnel funnelData={applicationFunnel} />
            )}
          </AnalyticsCard>

          <AnalyticsCard title="🏆 Top Companies">
            {analyticsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-3 text-blue-300">Loading analytics...</p>
              </div>
            ) : (
              <TopCompanies companies={topCompanies} jobs={jobs} />
            )}
          </AnalyticsCard>
        </div>

        <div className="analytics-grid mb-8">
          <AnalyticsCard title="🎯 Skills Gap Analysis">
            {analyticsLoading ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="mt-3 text-blue-300">Loading analytics...</p>
              </div>
            ) : (
              <SkillsGapAnalysis gaps={skillsGap} />
            )}
          </AnalyticsCard>

              <AnalyticsCard title="📅 Weekly Application Trends">
                <MonthlyTrends jobs={jobs} />
              </AnalyticsCard>
              
        </div>
      </div>

      {/* Filters & Search - GRADIENT DROPDOWNS */}
        <div className="filters-section glass-card rounded-xl p-8 max-w-7xl mx-auto">
          <h3 className="text-title font-bold text-primary mb-6">🔍 Filters & Search</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Status Filter - Now with Gradient */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="gradient-dropdown p-4 text-lg border-slate-600 text-white"
            >
              <option value="All" className="text-black bg-white">All Status</option>
              <option value="wishlist" className="text-black bg-white">Wishlist</option>
              <option value="applied" className="text-black bg-white">Applied</option>
              <option value="interview" className="text-black bg-white">Interview</option>
              <option value="offer" className="text-black bg-white">Offer</option>
              <option value="rejected" className="text-black bg-white">Rejected</option>
            </select>

            <input
              type="text"
              placeholder="Filter by company..."
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="form-input p-4 text-lg bg-slate-800 border-slate-600 text-white"
            />

            <input
              type="text"
              placeholder="Search by job title..."
              value={titleFilter}
              onChange={(e) => setTitleFilter(e.target.value)}
              className="form-input p-4 text-lg bg-slate-800 border-slate-600 text-white"
            />

            {/* Sort Filter - Now with Gradient */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="gradient-dropdown p-4 text-lg border-slate-600 text-white"
            >
              <option value="newest" className="text-black bg-white">Newest First</option>
              <option value="oldest" className="text-black bg-white">Oldest First</option>
              <option value="match_high" className="text-black bg-white">Highest Match</option>
              <option value="match_low" className="text-black bg-white">Lowest Match</option>
            </select>
          </div>

          <div className="text-center">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-6 rounded-xl font-bold transition-colors text-xl"
            >
              + Add New Job with AI Match
            </button>
          </div>
        </div>

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
            <thead className="bg-slate-800">
              <tr>
                <th className="py-5 px-6 text-left text-lg text-white">Title</th>
                <th className="py-5 px-6 text-left text-lg text-white">Company</th>
                <th className="py-5 px-6 text-left text-lg text-white">Status</th>
                <th className="py-5 px-6 text-left text-lg text-white">Match</th>
                <th className="py-5 px-6 text-left text-lg text-white">Notes</th>
                <th className="py-5 px-6 text-left text-lg text-white">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id} className="border-b border-slate-700 hover:bg-slate-800 transition">
                  <td className="py-5 px-6 text-white font-semibold text-lg">{job.title}</td>
                  <td className="py-5 px-6 text-blue-300 text-lg">{job.company}</td>
                  <td className="py-5 px-6">
                    <span className={getStatusClass(job.status)}>{job.status}</span>
                  </td>
                  <td 
                    className={`py-5 px-6 font-bold text-lg ${getMatchScoreClass(job.match_score)} cursor-pointer hover:underline transition-all`}
                    onClick={() => viewSkillBreakdown(job)}
                    title="Click to view detailed skill breakdown"
                  >
                    {job.match_score}%
                  </td>
                  <td className="py-5 px-6 text-gray-300 text-lg truncate max-w-xs">{job.notes || "-"}</td>
                  <td className="py-5 px-6 text-gray-400 text-lg">
                    {new Date(job.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AddJobModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onJobAdded={() => {
          fetchJobs();
          fetchAnalytics();
        }}
        resumeText={resumeText}
      />

      <SkillBreakdownModal 
        job={selectedJob}
        isOpen={isSkillModalOpen}
        onClose={() => setIsSkillModalOpen(false)}
      />
    </div>
  );
}

export default App;