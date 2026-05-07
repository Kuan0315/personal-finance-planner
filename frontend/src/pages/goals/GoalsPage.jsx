import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MOCK_GOALS } from '../../data/mockGoals'
import { GOAL_FILTERS, GOAL_STATUS_LABELS, GOAL_STATUS } from '../../constants/goalStatus'
import './GoalsPage.css'

const PORTFOLIO_ASSIGNMENTS_KEY = 'pfp_goal_portfolios'
const loadGoals = () => {
  const savedAssignments = JSON.parse(localStorage.getItem(PORTFOLIO_ASSIGNMENTS_KEY)) || {}
  return MOCK_GOALS.map(goal => ({ ...goal, assignedPortfolio: savedAssignments[goal.id] || null }))
}

// GOALS PAGE
// ═══════════════════════════════════════════════════════
const GoalsPage = ({ user }) => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState(loadGoals);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showGoalDetailModal, setShowGoalDetailModal] = useState(false);
  const [selectedGoalDetail, setSelectedGoalDetail] = useState(null);
  const [detailTab, setDetailTab] = useState('goal');
  const [formData, setFormData] = useState({ icon: '🏠', name: '', desc: '', target: '', savings: '', monthly: '', dateLabel: '' });

  useEffect(() => { if (!user?.email) navigate('/login'); }, [user, navigate]);

  const filteredGoals = goals.filter(goal => {
    const matchFilter = filter === 'all' || goal.status === filter;
    const matchSearch = !searchTerm || goal.name.toLowerCase().includes(searchTerm.toLowerCase()) || goal.desc.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const handleSaveGoal = (e) => {
    e.preventDefault();
    if (!formData.name) { alert('Please enter a goal name.'); return; }
    if (editingGoal) {
      setGoals(goals.map(g => g.id === editingGoal.id ? { ...editingGoal, ...formData, assignedPortfolio: g.assignedPortfolio || null } : g));
      setEditingGoal(null);
    } else {
      setGoals([...goals, { id: Math.max(...goals.map(g => g.id), 0) + 1, ...formData, status: GOAL_STATUS.ON_TRACK, progressPercent: 0, assignedPortfolio: null }]);
    }
    setShowModal(false);
    setFormData({ icon: '🏠', name: '', desc: '', target: '', savings: '', monthly: '', dateLabel: '' });
  };

  const handleDeleteGoal = (id) => {
    if (window.confirm('Delete this goal?')) {
      setGoals(goals.filter(g => g.id !== id));
      const current = JSON.parse(localStorage.getItem(PORTFOLIO_ASSIGNMENTS_KEY)) || {}
      delete current[id]
      localStorage.setItem(PORTFOLIO_ASSIGNMENTS_KEY, JSON.stringify(current))
    }
  };
  const handleEditGoal = (goal) => { setEditingGoal(goal); setFormData(goal); setShowModal(true); };
  const openAdd = () => { setEditingGoal(null); setFormData({ icon: '🏠', name: '', desc: '', target: '', savings: '', monthly: '', dateLabel: '' }); setShowModal(true); };

  return (
    <div className="main-content">
      {/* Header */}
      <div className="header-container">
        <h1 className="page-title">Financial Goals</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box">
            <i className="bi bi-search search-icon"></i>
            <input type="text" placeholder="Search goals, funds..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button className="btn-primary-action" onClick={openAdd}><i className="bi bi-plus-lg"></i> Add Goal</button>
        </div>
      </div>

      {/* Summary cards — equal CSS grid */}
      <div className="grid-4col mb-5">
        <div className="summary-card summary-blue">
          <p className="summary-label">Total Saved</p>
          <p className="summary-value">RM 384,800</p>
          <p className="summary-sub">↑ +8.3% vs last quarter</p>
        </div>
        <div className="summary-card summary-green">
          <p className="summary-label">Goals On Track</p>
          <p className="summary-value">3 / 7</p>
          <p className="summary-sub">2 need attention</p>
        </div>
        <div className="summary-card summary-orange">
          <p className="summary-label">Monthly Contribution</p>
          <p className="summary-value">RM 6,825</p>
          <p className="summary-sub">↑ +RM400 this month</p>
        </div>
        <div className="summary-card summary-rainbow">
          <p className="summary-label">Projected by 2030</p>
          <p className="summary-value">RM 500,000</p>
          <p className="summary-sub">Across all goals</p>
        </div>
      </div>

      {/* Alert */}
      <div className="alert-banner mb-4">
        <i className="bi bi-info-circle-fill me-2"></i>
        <span><strong>3 goals are on track.</strong> Your Emergency Fund is falling behind — you're 12% off track.</span>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs mb-4">
        {GOAL_FILTERS.map(f => (
          <button key={f.value} className={`filter-tab ${filter === f.value ? 'active' : ''}`} onClick={() => setFilter(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Goal cards — CSS grid */}
      <div className="grid-3col">
        {filteredGoals.map(goal => (
          <div key={goal.id} className="goal-card">
            <div className="goal-card-top">
              <span className="goal-icon">{goal.icon}</span>
              <span className={`status-badge ${goal.status}`}>
                {GOAL_STATUS_LABELS[goal.status]}
              </span>
            </div>
            <h5 className="goal-title">{goal.name}</h5>
            <div className="progress goal-progress"><div className="progress-bar" style={{ width: `${goal.progressPercent}%` }}></div></div>
            <div className="goal-summary-row">
              <p className="goal-amounts"><strong>{goal.savings}</strong> <span>/ {goal.target} · {goal.progressPercent}%</span></p>
              {goal.assignedPortfolio && <span className="portfolio-badge-small">Portfolio Applied</span>}
            </div>
            <div className="goal-meta">
              <div className="meta-row">
                <div className="goal-actions">
                  {goal.hasAI && (
                    <button className="action-btn" title="AI Advisory" onClick={() => { setSelectedOption(null); setShowAIModal(true); }} style={{ color: '#6366f1' }}>
                      <i className="bi bi-robot"></i>
                    </button>
                  )}
                  <button className="action-btn edit-btn" onClick={() => handleEditGoal(goal)}><i className="bi bi-pencil-square"></i></button>
                  <button className="action-btn delete-btn" onClick={() => handleDeleteGoal(goal.id)}><i className="bi bi-trash3"></i></button>
                </div>
              </div>
              <button className="view-details-btn" onClick={() => { setSelectedGoalDetail(goal); setDetailTab('goal'); setShowGoalDetailModal(true); }}>View Details</button>
            </div>
          </div>
        ))}

        {/* Create new goal card */}
        <div className="goal-card create-goal-card" onClick={openAdd}>
          <div className="create-goal-inner">
            <div className="create-plus"><i className="bi bi-plus-lg"></i></div>
            <p className="create-title">Create New Goal</p>
            <p className="create-sub">Track savings, investments & milestones</p>
          </div>
        </div>
      </div>

      {/* Goal Details Modal */}
      {showGoalDetailModal && selectedGoalDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060 }}
          onClick={e => { if (e.target === e.currentTarget) setShowGoalDetailModal(false); }}>
          <div style={{ background: 'white', borderRadius: '22px', padding: '28px 26px', width: '92%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.18)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '18px' }}>
              <div>
                <p className="modal-main-sub" style={{ marginBottom: '6px' }}>Goal Overview</p>
                <h3 style={{ margin: 0, fontFamily: 'Sora, sans-serif', fontSize: '1.35rem', fontWeight: 700 }}>{selectedGoalDetail.name}</h3>
                <p style={{ margin: '8px 0 0', color: '#6b7280', fontSize: '.9rem' }}>{GOAL_STATUS_LABELS[selectedGoalDetail.status]}</p>
              </div>
              <button className="view-details-btn" style={{ minWidth: 'auto', padding: '8px 16px' }} onClick={() => setShowGoalDetailModal(false)}>Close</button>
            </div>
            <div className="detail-tabs">
              <button className={`detail-tab ${detailTab === 'goal' ? 'active' : ''}`} onClick={() => setDetailTab('goal')}>Goal Details</button>
              <button className={`detail-tab ${detailTab === 'portfolio' ? 'active' : ''}`} onClick={() => setDetailTab('portfolio')}>Portfolio Details</button>
            </div>
            {detailTab === 'goal' ? (
              <div style={{ display: 'grid', gap: '16px', marginTop: '18px' }}>
                <div className="detail-card">
                  <p className="detail-label">Description</p>
                  <p className="detail-text">{selectedGoalDetail.desc || 'No description provided.'}</p>
                </div>
                <div className="detail-row"><span>Target Amount</span><strong>{selectedGoalDetail.target}</strong></div>
                <div className="detail-row"><span>Target Date</span><strong>{selectedGoalDetail.dateLabel}</strong></div>
                <div className="detail-row"><span>Current Savings</span><strong>{selectedGoalDetail.savings}</strong></div>
                <div className="detail-row"><span>Monthly Savings</span><strong>{selectedGoalDetail.monthly}</strong></div>
                <div className="detail-row"><span>Goal Status</span><strong>{GOAL_STATUS_LABELS[selectedGoalDetail.status]}</strong></div>
                <div className="detail-row"><span>Progress</span><strong>{selectedGoalDetail.progressPercent}%</strong></div>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px', marginTop: '18px' }}>
                {selectedGoalDetail.assignedPortfolio ? (
                  <>
                    <div className="detail-card">
                      <p className="detail-label">Assigned Portfolio</p>
                      <h4 className="detail-title">{selectedGoalDetail.assignedPortfolio.name}</h4>
                    </div>
                    <div className="detail-row"><span>Risk Level</span><strong>{selectedGoalDetail.assignedPortfolio.riskLevel}</strong></div>
                    <div className="detail-row"><span>Asset Allocation</span><strong>{selectedGoalDetail.assignedPortfolio.allocation.map(item => `${item.pct}% ${item.label}`).join(', ')}</strong></div>
                    <div className="detail-row"><span>Recommended Instruments</span><strong>{selectedGoalDetail.assignedPortfolio.instruments.join(', ')}</strong></div>
                    {selectedGoalDetail.assignedPortfolio.expectedReturn && (
                      <div className="detail-row"><span>Expected Annual Return</span><strong>{selectedGoalDetail.assignedPortfolio.expectedReturn}</strong></div>
                    )}
                  </>
                ) : (
                  <div className="detail-card">
                    <p className="detail-text">This goal does not have an assigned portfolio yet. Apply one from the Investments page to view the recommended strategy here.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Advisory Modal */}
      {showAIModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAIModal(false); }}>
          <div style={{ background: 'white', borderRadius: '22px', maxWidth: '560px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(59,110,255,.18)' }}>
            <div style={{ background: '#2c3ecc', padding: '28px 26px 22px', borderRadius: '22px 22px 0 0' }}>
              <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '.85rem', fontWeight: 500, margin: '0 0 4px' }}>AI Advisory</p>
              <h3 style={{ color: '#fff', fontFamily: 'Sora, sans-serif', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 16px' }}>Early Retirement Fund</h3>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[['Target', 'RM 1,000,000'], ['Saved', 'RM 210,000'], ['Monthly', 'RM 2,100'], ['Deadline', 'Mar 2055'], ['Lag', '12% behind']].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '.72rem' }}>{label}</div>
                    <div style={{ color: label === 'Lag' ? '#ff8b8b' : '#fff', fontWeight: 700, fontSize: '.88rem' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: '24px 26px' }}>
              <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', color: '#9ca3af', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                TWO PATHS FORWARD <span style={{ flex: 1, height: 1, background: '#e2e6f0', display: 'block' }}></span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {[
                  { key: 'A', color: '#3b6eff', label: 'Option A – TIME', big: '+42', unit: 'months', desc: 'Keep saving RM 2,100/month and extend your deadline by 3 years 6 months', tag: 'Retire by Sep 2058', tagStyle: { background: '#f3f5f9', color: '#5c6170' } },
                  { key: 'B', color: '#22c55e', label: 'Option B – AMOUNT', big: '+RM252', unit: '/mo', desc: 'Increase to RM 2,352/month and hit your original March 2055 goal', tag: 'Stay on track for 2055', tagStyle: { background: '#dcfce7', color: '#15803d' } },
                ].map(opt => (
                  <div key={opt.key} onClick={() => setSelectedOption(opt.key)}
                    style={{ border: `1.5px solid ${selectedOption === opt.key ? '#3b6eff' : '#e2e6f0'}`, borderRadius: '16px', padding: '16px', cursor: 'pointer', boxShadow: selectedOption === opt.key ? '0 0 0 3px rgba(59,110,255,.15)' : 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '.72rem', fontWeight: 700, color: opt.color }}>{opt.label}</span>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selectedOption === opt.key ? '#3b6eff' : '#e2e6f0'}`, background: selectedOption === opt.key ? 'radial-gradient(circle at center, #3b6eff 45%, #fff 45%)' : 'transparent' }}></div>
                    </div>
                    <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '1.6rem', fontWeight: 800 }}>{opt.big} <span style={{ fontSize: '.9rem', fontWeight: 500, color: '#5c6170' }}>{opt.unit}</span></div>
                    <p style={{ fontSize: '.76rem', color: '#5c6170', lineHeight: 1.4, margin: 0 }}>{opt.desc}</p>
                    <span style={{ ...opt.tagStyle, display: 'inline-block', fontSize: '.72rem', fontWeight: 600, borderRadius: '99px', padding: '3px 10px' }}>{opt.tag}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: '#f0f4ff', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3b6eff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✦</div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '.85rem', margin: 0 }}>WealthTrack AI Advisor</p>
                      <p style={{ fontSize: '.72rem', color: '#9ca3af', margin: 0 }}>Powered by Gemini · Smart Suggestions</p>
                    </div>
                  </div>
                  <span style={{ background: '#e8eeff', color: '#3b6eff', fontSize: '.7rem', fontWeight: 700, borderRadius: '99px', padding: '3px 10px' }}>AI Generated</span>
                </div>
                <p style={{ fontSize: '.84rem', lineHeight: 1.6, margin: '0 0 12px' }}>
                  You're already <strong>RM 210,000</strong> into your retirement journey. Adding just <span style={{ color: '#22c55e', fontWeight: 700, background: '#dcfce7', borderRadius: 4, padding: '1px 5px' }}>+RM 252/month</span> keeps your original March 2055 retirement fully intact.
                </p>
                <div style={{ background: '#fff', borderRadius: '8px', padding: '10px 12px', display: 'flex', gap: '10px' }}>
                  <span>💡</span>
                  <p style={{ fontSize: '.78rem', color: '#5c6170', margin: 0 }}>Automating your monthly transfer removes the temptation to skip — consistency compounds faster than any single large contribution.</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button style={{ border: '1.5px solid #e2e6f0', background: '#fff', borderRadius: '99px', padding: '8px 16px', fontFamily: 'DM Sans,sans-serif', fontSize: '.84rem', fontWeight: 600, cursor: 'pointer' }}>↻ Regenerate</button>
                <button onClick={() => setShowAIModal(false)} style={{ border: '1.5px solid #e2e6f0', background: '#fff', borderRadius: '99px', padding: '8px 16px', fontFamily: 'DM Sans,sans-serif', fontSize: '.84rem', fontWeight: 600, cursor: 'pointer' }}>Dismiss</button>
                <button disabled={!selectedOption} onClick={() => { alert(`Applied Option ${selectedOption}!`); setShowAIModal(false); }}
                  style={{ marginLeft: 'auto', background: selectedOption ? '#3b6eff' : '#d1d5db', color: selectedOption ? '#fff' : '#6b7280', border: 'none', borderRadius: '99px', padding: '8px 20px', fontFamily: 'DM Sans,sans-serif', fontSize: '.84rem', fontWeight: 700, cursor: selectedOption ? 'pointer' : 'not-allowed' }}>
                  {selectedOption ? `Apply Option ${selectedOption}` : 'Apply Selected Option'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Goal Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '22px', padding: '32px', maxWidth: '560px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(59,110,255,.18)' }}>
            <h4 className="modal-main-title">{editingGoal ? 'Update Goal' : 'Create New Goal'}</h4>
            <p className="modal-main-sub">{editingGoal ? 'Edit your goal details and save changes.' : 'Define your financial goal and start tracking your progress.'}</p>
            <form onSubmit={handleSaveGoal}>
              {[['Goal Name', 'name', 'e.g. Dream Vacation Fund'], ['Description', 'desc', 'Brief description']].map(([label, key, ph]) => (
                <div key={key} className="modal-field">
                  <label className="modal-label">{label}</label>
                  <input className="modal-input-field" value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} placeholder={ph} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[['Target Amount', 'target', 'RM50,000'], ['Current Savings', 'savings', 'RM0']].map(([label, key, ph]) => (
                  <div key={key} className="modal-field">
                    <label className="modal-label">{label}</label>
                    <input className="modal-input-field" value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} placeholder={ph} />
                  </div>
                ))}
              </div>
              <div className="modal-field">
                <label className="modal-label">Monthly Distribution</label>
                <input className="modal-input-field" value={formData.monthly} onChange={e => setFormData({ ...formData, monthly: e.target.value })} placeholder="RM500" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="modal-field">
                  <label className="modal-label">Target Date</label>
                  <input type="month" className="modal-input-field" value={formData.dateLabel} onChange={e => setFormData({ ...formData, dateLabel: e.target.value })} style={{ cursor: 'pointer' }} />
                </div>
                <div className="modal-field">
                  <label className="modal-label">Category</label>
                  <div style={{ position: 'relative' }}>
                    <select className="modal-input-field" value={formData.icon} onChange={e => setFormData({ ...formData, icon: e.target.value })} style={{ appearance: 'none', cursor: 'pointer', paddingRight: '32px' }}>
                      <option value="🏠">🏠 Home</option>
                      <option value="🎓">🎓 Education</option>
                      <option value="🚨">🚨 Emergency</option>
                      <option value="✈️">✈️ Travel</option>
                      <option value="⛱️">⛱️ Retirement</option>
                      <option value="🏦">🏦 Savings</option>
                      <option value="📦">📦 Others</option>
                    </select>
                    <i className="bi bi-chevron-down" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#5c6170', fontSize: '.8rem' }}></i>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" className="btn-modal-cancel" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-modal-save" style={{ flex: 1 }}>{editingGoal ? 'Update Goal' : 'Save Goal'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalsPage
