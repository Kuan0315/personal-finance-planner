import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../../utils/session'
import { GOAL_FILTERS, GOAL_STATUS_LABELS, GOAL_STATUS } from '../../constants/goalStatus'
import './GoalsPage.css'

// GOALS PAGE
// ═══════════════════════════════════════════════════════
const GoalsPage = ({ user }) => {
  const navigate = useNavigate();
  const [goals, setGoals] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [formData, setFormData] = useState({ icon: '🏠', name: '', desc: '', target: '', savings: '', monthly: '', dateLabel: '' });
  const [aiData, setAIData] = useState(null);

  useEffect(() => { if (!user?.email) navigate('/login'); }, [user, navigate]);
  useEffect(() => {
    apiRequest('/api/goals').then(setGoals).catch(console.error);
  }, []);

  const filteredGoals = goals.filter(goal => {
    const matchFilter = filter === 'all' || goal.status === filter;
    const matchSearch = !searchTerm || goal.name.toLowerCase().includes(searchTerm.toLowerCase()) || (goal.desc || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const summary = {
    totalSaved: goals.reduce((sum, g) => sum + (g.currentSavings || 0), 0),
    totalTarget: goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0),
    onTrackCount: goals.filter(g => g.status === 'on-track').length,
    totalGoals: goals.length,
    needAttention: goals.filter(g => g.status === 'at-risk' || g.status === 'high-risk').length,
    monthlyTotal: goals.reduce((sum, g) => sum + (g.monthlyContribution || g.monthlySavingNeeded || 0), 0),
    atRiskGoals: goals.filter(g => g.status === 'at-risk' || g.status === 'high-risk'),
  };

  // Unified status + lag badge — no contradictions
  const StatusBadge = ({ status, lagPercent }) => {
    if (status === 'completed') return (
      <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#4b5563', background: '#f3f4f6', borderRadius: '99px', padding: '3px 10px' }}>
        Completed
      </span>
    );
    if (status === 'high-risk') return (
      <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#b91c1c', background: '#fee2e2', borderRadius: '99px', padding: '3px 10px' }}>
        {lagPercent > 0 ? `${lagPercent}% behind` : 'High Risk'}
      </span>
    );
    if (status === 'at-risk') return (
      <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#c2410c', background: '#ffedd5', borderRadius: '99px', padding: '3px 10px' }}>
        {lagPercent > 0 ? `${lagPercent}% behind` : 'At Risk'}
      </span>
    );
    return (
      <span style={{ fontSize: '.75rem', fontWeight: 700, color: '#15803d', background: '#dcfce7', borderRadius: '99px', padding: '3px 10px' }}>
        On pace
      </span>
    );
  };

  // Save (create or update)
  const handleSaveGoal = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        description: formData.desc,
        icon: formData.icon,
        targetAmount: parseFloat(String(formData.target).replace(/[^0-9.]/g, '')),
        currentSavings: parseFloat(String(formData.savings).replace(/[^0-9.]/g, '')) || 0,
        targetDate: formData.dateLabel,
        monthlyContribution: parseFloat(String(formData.monthly).replace(/[^0-9.]/g, '')) || 0,
      };

      if (!payload.name) { alert('Please enter a goal name.'); return; }
      if (!payload.targetAmount) { alert('Please enter a target amount.'); return; }
      if (!payload.targetDate) { alert('Please select a target date.'); return; }

      const saved = editingGoal
        ? await apiRequest(`/api/goals/${editingGoal.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await apiRequest('/api/goals', { method: 'POST', body: JSON.stringify(payload) });

      setGoals(prev => editingGoal
        ? prev.map(g => g.id === editingGoal.id ? saved : g)
        : [...prev, saved]
      );
      setShowModal(false);
    } catch (err) {
      alert(`Failed to save goal: ${err.message}`);
      console.error(err);
    }
  };

  // Delete
  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Delete this goal?')) return;
    await apiRequest(`/api/goals/${id}`, { method: 'DELETE' });
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setFormData({
      icon: goal.icon || '🏠',
      name: goal.name || '',
      desc: goal.desc || '',
      target: goal.targetAmount || '',
      savings: goal.currentSavings || '',
      monthly: goal.monthlyContribution || '',
      dateLabel: goal.dateLabel || '',
    });
    setShowModal(true);
  };

  const openAdd = () => {
    setEditingGoal(null);
    setFormData({ icon: '🏠', name: '', desc: '', target: '', savings: '', monthly: '', dateLabel: '' });
    setShowModal(true);
  };

  // AI Advisory
  const handleOpenAI = async (goal) => {
    try {
      const data = await apiRequest(`/api/goals/${goal.id}/ai-advice`);
      setAIData(data);
      setSelectedOption(null);
      setShowAIModal(true);
    } catch (err) {
      alert(`Failed to load AI advice: ${err.message}`);
    }
  };

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

      {/* Summary Cards */}
      <div className="grid-4col mb-5">
        <div className="summary-card summary-blue">
          <p className="summary-label">Total Saved</p>
          <p className="summary-value">RM {summary.totalSaved.toLocaleString()}</p>
          <p className="summary-sub">Across {summary.totalGoals} goals</p>
        </div>
        <div className="summary-card summary-green">
          <p className="summary-label">Goals On Track</p>
          <p className="summary-value">{summary.onTrackCount} / {summary.totalGoals}</p>
          <p className="summary-sub">{summary.needAttention} need attention</p>
        </div>
        <div className="summary-card summary-orange">
          <p className="summary-label">Monthly Contribution</p>
          <p className="summary-value">RM {summary.monthlyTotal.toLocaleString()}</p>
          <p className="summary-sub">Total across all goals</p>
        </div>
        <div className="summary-card summary-rainbow">
          <p className="summary-label">Overall Progress</p>
          <p className="summary-value">
            {summary.totalTarget > 0 ? Math.round((summary.totalSaved / summary.totalTarget) * 100) : 0}%
          </p>
          <p className="summary-sub">RM {summary.totalTarget.toLocaleString()} total target</p>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="alert-banner mb-4">
        <i className="bi bi-info-circle-fill me-2"></i>
        {summary.needAttention === 0 ? (
          <span><strong>All goals are on track.</strong> Keep up the great work!</span>
        ) : (
          <span>
            <strong>{summary.onTrackCount} goals are on track.</strong>{' '}
            {summary.atRiskGoals.map(g => g.name).join(', ')}{' '}
            {summary.needAttention === 1 ? 'is' : 'are'} falling behind — consider reviewing.
          </span>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs mb-4">
        {GOAL_FILTERS.map(f => (
          <button key={f.value} className={`filter-tab ${filter === f.value ? 'active' : ''}`} onClick={() => setFilter(f.value)}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Goal Cards */}
      <div className="grid-3col">
        {filteredGoals.map(goal => (
          <div key={goal.id} className="goal-card">
            <div className="goal-card-top">
              <span className="goal-icon">{goal.icon}</span>
              <StatusBadge status={goal.status} lagPercent={goal.lagPercent || 0} />
            </div>
            <h5 className="goal-title">{goal.name}</h5>
            <p className="goal-desc">{goal.desc || 'No description provided.'}</p>
            <div className="progress goal-progress">
              <div className="progress-bar" style={{ width: `${goal.progressPercent}%` }}></div>
            </div>
            <p className="goal-amounts"><strong>{goal.savings}</strong> <span>/ {goal.target}</span></p>
            <div className="goal-meta">
              <div className="meta-row">
                <span><i className="bi bi-calendar3"></i> {goal.status === 'completed' ? 'Completed:' : 'Target:'} {goal.dateLabel}</span>
                <div className="goal-actions">
                  {goal.hasAI && (
                    <button className="action-btn" title="AI Advisory" onClick={() => handleOpenAI(goal)} style={{ color: '#6366f1' }}>
                      <i className="bi bi-robot"></i>
                    </button>
                  )}
                  <button className="action-btn edit-btn" onClick={() => handleEditGoal(goal)}><i className="bi bi-pencil-square"></i></button>
                  <button className="action-btn delete-btn" onClick={() => handleDeleteGoal(goal.id)}><i className="bi bi-trash3"></i></button>
                </div>
              </div>
              <span className="meta-monthly"><i className="bi bi-coin"></i> RM {(goal.monthlyContribution || goal.monthlySavingNeeded || 0).toLocaleString()} / month</span>
            </div>
          </div>
        ))}

        {/* Create New Goal Card */}
        <div className="goal-card create-goal-card" onClick={openAdd}>
          <div className="create-goal-inner">
            <div className="create-plus"><i className="bi bi-plus-lg"></i></div>
            <p className="create-title">Create New Goal</p>
            <p className="create-sub">Track savings, investments & milestones</p>
          </div>
        </div>
      </div>

      {/* ── AI Advisory Modal ── */}
      {showAIModal && aiData && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAIModal(false); }}>
          <div style={{ background: 'white', borderRadius: '22px', maxWidth: '580px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(59,110,255,.18)' }}>

            {/* Modal Header */}
            <div style={{ background: '#2c3ecc', padding: '28px 26px 22px', borderRadius: '22px 22px 0 0' }}>
              <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '.85rem', fontWeight: 500, margin: '0 0 4px' }}>AI Advisory</p>
              <h3 style={{ color: '#fff', fontFamily: 'Sora, sans-serif', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 16px' }}>
                {aiData.goal.name}
              </h3>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[
                  ['Target', aiData.goal.target],
                  ['Saved', aiData.goal.savings],
                  ['Monthly', aiData.goal.monthly],
                  ['Time Left', `${aiData.monthsRemaining} months`],
                  ['Lag', aiData.goal.lagPercent > 0 ? `${aiData.goal.lagPercent}% behind` : 'On pace'],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '.72rem' }}>{label}</div>
                    <div style={{ color: label === 'Lag' && aiData.goal.lagPercent > 0 ? '#ff8b8b' : '#fff', fontWeight: 700, fontSize: '.88rem' }}>{val}</div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div style={{ marginTop: '14px', background: 'rgba(255,255,255,.1)', borderRadius: '99px', height: '6px', overflow: 'hidden' }}>
                <div style={{ width: `${aiData.goal.progressPercent}%`, background: '#4ade80', height: '100%', borderRadius: '99px' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                <span style={{ color: 'rgba(255,255,255,.6)', fontSize: '.7rem' }}>Progress: {aiData.goal.progressPercent}%</span>
                <span style={{ color: aiData.goal.lagPercent > 10 ? '#ff8b8b' : '#4ade80', fontSize: '.7rem', fontWeight: 700 }}>
                  {aiData.goal.lagPercent > 0 ? `${aiData.goal.lagPercent}% behind` : 'On pace'}
                </span>
              </div>
            </div>

            <div style={{ padding: '24px 26px' }}>

              {/* Two Paths Forward */}
              <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', color: '#9ca3af', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                TWO PATHS FORWARD
                <span style={{ flex: 1, height: 1, background: '#e2e6f0', display: 'block' }}></span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                {[
                  {
                    key: 'A', color: '#3b6eff', label: 'Option A – TIME',
                    big: `+${aiData.optionA.extraMonths}`, unit: 'months',
                    desc: aiData.optionA.desc,
                    tag: `New deadline: ${aiData.optionA.newDeadline}`,
                    tagStyle: { background: '#f3f5f9', color: '#5c6170' },
                  },
                  {
                    key: 'B', color: '#22c55e', label: 'Option B – AMOUNT',
                    big: `+RM${(aiData.optionB.increase || 0).toLocaleString()}`, unit: '/mo',
                    desc: aiData.optionB.desc,
                    tag: 'Keep original deadline',
                    tagStyle: { background: '#dcfce7', color: '#15803d' },
                  },
                ].map(opt => (
                  <div key={opt.key} onClick={() => setSelectedOption(opt.key)}
                    style={{ border: `1.5px solid ${selectedOption === opt.key ? '#3b6eff' : '#e2e6f0'}`, borderRadius: '16px', padding: '16px', cursor: 'pointer', boxShadow: selectedOption === opt.key ? '0 0 0 3px rgba(59,110,255,.15)' : 'none', display: 'flex', flexDirection: 'column', gap: '8px', transition: 'all .2s' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '.72rem', fontWeight: 700, color: opt.color }}>{opt.label}</span>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selectedOption === opt.key ? '#3b6eff' : '#e2e6f0'}`, background: selectedOption === opt.key ? 'radial-gradient(circle at center, #3b6eff 45%, #fff 45%)' : 'transparent' }} />
                    </div>
                    <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '1.6rem', fontWeight: 800 }}>
                      {opt.big} <span style={{ fontSize: '.9rem', fontWeight: 500, color: '#5c6170' }}>{opt.unit}</span>
                    </div>
                    <p style={{ fontSize: '.76rem', color: '#5c6170', lineHeight: 1.4, margin: 0 }}>{opt.desc}</p>
                    <span style={{ ...opt.tagStyle, display: 'inline-block', fontSize: '.72rem', fontWeight: 600, borderRadius: '99px', padding: '3px 10px' }}>{opt.tag}</span>
                  </div>
                ))}
              </div>

              {/* Gemini AI Advisory */}
              <div style={{ background: '#f0f4ff', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3b6eff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>✦</div>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: '.85rem', margin: 0 }}>WealthTrack AI Advisor</p>
                      <p style={{ fontSize: '.72rem', color: '#9ca3af', margin: 0 }}>Powered by Gemini · Personalized Analysis</p>
                    </div>
                  </div>
                  <span style={{ background: '#e8eeff', color: '#3b6eff', fontSize: '.7rem', fontWeight: 700, borderRadius: '99px', padding: '3px 10px' }}>AI Generated</span>
                </div>

                {aiData.aiAdvice ? (
                  <p style={{ fontSize: '.84rem', lineHeight: 1.7, margin: 0, color: '#1a1d2e', whiteSpace: 'pre-line' }}>
                    {aiData.aiAdvice}
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(aiData.tips || []).map((tip, i) => (
                      <div key={i} style={{ background: '#fff', borderRadius: '8px', padding: '10px 12px', display: 'flex', gap: '10px' }}>
                        <span>💡</span>
                        <p style={{ fontSize: '.78rem', color: '#5c6170', margin: 0 }}>{tip}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button onClick={() => handleOpenAI(aiData.goal)}
                  style={{ border: '1.5px solid #e2e6f0', background: '#fff', borderRadius: '99px', padding: '8px 16px', fontFamily: 'DM Sans,sans-serif', fontSize: '.84rem', fontWeight: 600, cursor: 'pointer' }}>
                  ↻ Regenerate
                </button>
                <button onClick={() => setShowAIModal(false)}
                  style={{ border: '1.5px solid #e2e6f0', background: '#fff', borderRadius: '99px', padding: '8px 16px', fontFamily: 'DM Sans,sans-serif', fontSize: '.84rem', fontWeight: 600, cursor: 'pointer' }}>
                  Dismiss
                </button>
                <button disabled={!selectedOption}
                  onClick={() => { alert(`Applied Option ${selectedOption}!`); setShowAIModal(false); }}
                  style={{ marginLeft: 'auto', background: selectedOption ? '#3b6eff' : '#d1d5db', color: selectedOption ? '#fff' : '#6b7280', border: 'none', borderRadius: '99px', padding: '8px 20px', fontFamily: 'DM Sans,sans-serif', fontSize: '.84rem', fontWeight: 700, cursor: selectedOption ? 'pointer' : 'not-allowed' }}>
                  {selectedOption ? `Apply Option ${selectedOption}` : 'Apply Selected Option'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── Create/Edit Goal Modal ── */}
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
                {[['Target Amount', 'target', 'e.g. 50000'], ['Current Savings', 'savings', 'e.g. 5000']].map(([label, key, ph]) => (
                  <div key={key} className="modal-field">
                    <label className="modal-label">{label}</label>
                    <input className="modal-input-field" value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} placeholder={ph} />
                  </div>
                ))}
              </div>
              <div className="modal-field">
                <label className="modal-label">Monthly Contribution</label>
                <input
                  className="modal-input-field"
                  value={formData.monthly}
                  onChange={e => setFormData({ ...formData, monthly: e.target.value })}
                  placeholder="e.g. 500"
                />
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

// ═══════════════════════════════════════════════════════

export default GoalsPage