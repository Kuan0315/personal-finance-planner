import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { GOAL_FILTERS, GOAL_STATUS_LABELS } from '../../constants/goalStatus'
import {
  loadGoals,
  loadSummary,
  createGoal,
  updateGoal,
  deleteGoal,
  fetchAdvice,
  filterGoals,
  emptyForm,
} from '../../controllers/goalController'
import { applyAdviceOption } from '../../services/goalService'
import { formatRM } from '../../utils/financialUtils'
import { formatRemainingTime } from '../../utils/dateUtils'
import './GoalsPage.css'

// ─── GoalsPage ────────────────────────────────────────────────────────────────
const GoalsPage = ({ user }) => {
  const navigate = useNavigate()

  // ── Data state ──────────────────────────────────────────────────────────────
  const [goals, setGoals] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [formData, setFormData] = useState(emptyForm())
  const [formError, setFormError] = useState(null)
  const [saving, setSaving] = useState(false)

  const [showGoalDetailModal, setShowGoalDetailModal] = useState(false)
  const [selectedGoalDetail, setSelectedGoalDetail] = useState(null)
  const [detailTab, setDetailTab] = useState('goal')

  const [showAIModal, setShowAIModal] = useState(false)
  const [aiGoal, setAiGoal] = useState(null)
  const [advice, setAdvice] = useState(null)
  const [adviceLoading, setAdviceLoading] = useState(false)
  const [selectedOption, setSelectedOption] = useState(null)

  // ── Auth guard ────────────────────────────────────────────────────────────────
  useEffect(() => { if (!user?.email) navigate('/login') }, [user, navigate])

  // ── Initial data load ─────────────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const [goalsData, summaryData] = await Promise.all([loadGoals(), loadSummary()])
      setGoals(goalsData)
      setSummary(summaryData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  // ── Filtered view ─────────────────────────────────────────────────────────────
  const filteredGoals = filterGoals(goals, filter, searchTerm)

  // ── Goal form handlers ────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingGoal(null)
    setFormData(emptyForm())
    setFormError(null)
    setShowModal(true)
  }

  const handleEditGoal = (goal) => {
    setEditingGoal(goal)
    setFormData({
      icon: goal.icon,
      name: goal.name,
      desc: goal.desc,
      target: goal.target,
      savings: goal.savings,
      monthly: goal.monthly,
      dateLabel: goal.dateLabel || '',
    })
    setFormError(null)
    setShowModal(true)
  }

  const handleSaveGoal = async (e) => {
    e.preventDefault()
    setFormError(null)
    setSaving(true)
    try {
      if (editingGoal) {
        const updated = await updateGoal(editingGoal._id, formData)
        setGoals(prev => prev.map(g => g._id === updated._id ? updated : g))
      } else {
        const created = await createGoal(formData)
        setGoals(prev => [created, ...prev])
      }
      await refresh()
      setShowModal(false)
      setEditingGoal(null)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Delete this goal?')) return
    try {
      await deleteGoal(id)
      setGoals(prev => prev.filter(g => g._id !== id))
      await refresh()
    } catch (err) {
      alert(err.message)
    }
  }

  // ── AI Advisory handlers ──────────────────────────────────────────────────────
  const openAIAdvisory = async (goal) => {
    setAiGoal(goal)
    setSelectedOption(null)
    setAdvice(null)
    setShowAIModal(true)
    setAdviceLoading(true)
    try {
      const data = await fetchAdvice(goal._id)
      setAdvice(data)
    } catch (err) {
      setAdvice({ error: err.message })
    } finally {
      setAdviceLoading(false)
    }
  }

  // ── Apply AI option → PUT to backend, update goals list ──────────────────────
  const [applying, setApplying] = useState(false)

  const handleApplyOption = async () => {
    if (!selectedOption || !aiGoal || !advice) return
    setApplying(true)
    try {
      const updated = await applyAdviceOption(aiGoal._id, selectedOption, advice)
      setGoals(prev => prev.map(g => g._id === updated._id ? updated : g))
      await refresh()
      setShowAIModal(false)
    } catch (err) {
      alert(`Failed to apply: ${err.message}`)
    } finally {
      setApplying(false)
    }
  }

  // ── Detail modal ──────────────────────────────────────────────────────────────
  const openDetail = (goal) => {
    setSelectedGoalDetail(goal)
    setDetailTab('goal')
    setShowGoalDetailModal(true)
  }

  // ── Summary values ────────────────────────────────────────────────────────────
  const totalSaved = summary ? formatRM(summary.totalSaved) : 'RM —'
  const onTrackLabel = summary ? `${summary.onTrack} / ${summary.totalGoals}` : '— / —'
  const monthlyLabel = summary ? formatRM(summary.monthlyTotal) : 'RM —'
  const projectedLabel = summary ? formatRM(summary.projectedTotal) : 'RM —'
  const needAttention = summary?.needAttention ?? 0

  if (loading) {
    return (
      <div className="main-content flex-center" style={{ minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-mid)' }}>
          <i className="bi bi-arrow-repeat" style={{ fontSize: '2rem', animation: 'spin 1s linear infinite' }}></i>
          <p style={{ marginTop: 12 }}>Loading your goals…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="main-content">
        <div className="alert-banner" style={{ background: '#fee2e2', borderColor: '#fca5a5', color: '#b91c1c' }}>
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error} — <button style={{ background: 'none', border: 'none', color: '#b91c1c', fontWeight: 700, cursor: 'pointer' }} onClick={refresh}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="main-content">
      {/* ── Header ── */}
      <div className="header-container">
        <h1 className="page-title">Financial Goals</h1>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="search-box">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              placeholder="Search goals, funds..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="btn-primary-action" onClick={openAdd}>
            <i className="bi bi-plus-lg"></i> Add Goal
          </button>
        </div>
      </div>

      {/* ── Summary cards ── */}
      <div className="grid-4col mb-5">
        <div className="summary-card summary-blue">
          <p className="summary-label">Total Saved</p>
          <p className="summary-value">{totalSaved}</p>
          <p className="summary-sub">↑ Across all active goals</p>
        </div>
        <div className="summary-card summary-green">
          <p className="summary-label">Goals On Track</p>
          <p className="summary-value">{onTrackLabel}</p>
          <p className="summary-sub">{needAttention > 0 ? `${needAttention} need${needAttention === 1 ? 's' : ''} attention` : 'All good!'}</p>
        </div>
        <div className="summary-card summary-orange">
          <p className="summary-label">Monthly Contribution</p>
          <p className="summary-value">{monthlyLabel}</p>
          <p className="summary-sub">Combined across goals</p>
        </div>
        <div className="summary-card summary-rainbow">
          <p className="summary-label">Projected Total</p>
          <p className="summary-value">{projectedLabel}</p>
          <p className="summary-sub">At target dates</p>
        </div>
      </div>

      {/* ── Alert ── */}
      {needAttention > 0 && (
        <div className="alert-banner mb-4">
          <i className="bi bi-info-circle-fill me-2"></i>
          <span>
            <strong>{summary.onTrack} goal{summary.onTrack !== 1 ? 's' : ''} on track.</strong>
            {' '}{needAttention} goal{needAttention !== 1 ? 's' : ''} need{needAttention === 1 ? 's' : ''} attention — check At Risk / High Risk below.
          </span>
        </div>
      )}

      {/* ── Filter tabs ── */}
      <div className="filter-tabs mb-4">
        {GOAL_FILTERS.map(f => (
          <button
            key={f.value}
            className={`filter-tab ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Goal cards ── */}
      <div className="grid-3col">
        {filteredGoals.map(goal => (
          <div key={goal._id} className="goal-card">
            <div className="goal-card-top">
              <span className="goal-icon">{goal.icon}</span>
              <span className={`status-badge ${goal.status}`}>
                {GOAL_STATUS_LABELS[goal.status]}
              </span>
            </div>
            <h5 className="goal-title">{goal.name}</h5>
            <div className="progress goal-progress">
              <div className="progress-bar" style={{ width: `${goal.progressPercent}%` }}></div>
            </div>
            <div className="goal-summary-row">
              <p className="goal-amounts">
                <strong>{formatRM(goal.savings)}</strong>
                {' '}<span>/ {formatRM(goal.target)} · {goal.progressPercent}%</span>
              </p>
              {goal.assignedPortfolio && (
                <span className="portfolio-badge-small">Portfolio Applied</span>
              )}
            </div>
            {goal.status !== 'completed' && (
              <p style={{ fontSize: '.76rem', color: 'var(--text-mid)', marginBottom: '8px' }}>
                <i className="bi bi-clock me-1"></i>
                {formatRemainingTime({ months: goal.remainingMonths, days: goal.remainingDays })} remaining
              </p>
            )}
            <div className="goal-meta">
              <div className="meta-row">
                <div className="goal-actions">
                  {(goal.status === 'at-risk' || goal.status === 'high-risk') && (
                    <button
                      className="action-btn"
                      title="AI Advisory"
                      onClick={() => openAIAdvisory(goal)}
                      style={{ color: '#6366f1' }}
                    >
                      <i className="bi bi-robot"></i>
                    </button>
                  )}
                  <button className="action-btn edit-btn" onClick={() => handleEditGoal(goal)}>
                    <i className="bi bi-pencil-square"></i>
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDeleteGoal(goal._id)}>
                    <i className="bi bi-trash3"></i>
                  </button>
                </div>
              </div>
              <button className="view-details-btn" onClick={() => openDetail(goal)}>
                View Details
              </button>
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

      {/* ── Goal Details Modal ── */}
      {showGoalDetailModal && selectedGoalDetail && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1060 }}
          onClick={e => { if (e.target === e.currentTarget) setShowGoalDetailModal(false) }}
        >
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
                <div className="detail-row"><span>Target Amount</span><strong>{formatRM(selectedGoalDetail.target)}</strong></div>
                <div className="detail-row"><span>Target Date</span><strong>{selectedGoalDetail.dateLabel || '—'}</strong></div>
                <div className="detail-row"><span>Current Savings</span><strong>{formatRM(selectedGoalDetail.savings)}</strong></div>
                <div className="detail-row"><span>Monthly Savings</span><strong>{formatRM(selectedGoalDetail.monthly)}</strong></div>
                <div className="detail-row"><span>Projected at Target Date</span><strong>{formatRM(selectedGoalDetail.projectedSavings)}</strong></div>
                <div className="detail-row"><span>Lag</span><strong style={{ color: selectedGoalDetail.lagPercent < 0 ? 'var(--red)' : 'var(--green)' }}>{selectedGoalDetail.lagPercent}%</strong></div>
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
                    <div className="detail-row"><span>Asset Allocation</span><strong>{selectedGoalDetail.assignedPortfolio.allocation?.map(a => `${a.pct}% ${a.label}`).join(', ')}</strong></div>
                    <div className="detail-row"><span>Recommended Instruments</span><strong>{selectedGoalDetail.assignedPortfolio.instruments?.join(', ')}</strong></div>
                    {selectedGoalDetail.assignedPortfolio.expectedReturn && (
                      <div className="detail-row"><span>Expected Annual Return</span><strong>{selectedGoalDetail.assignedPortfolio.expectedReturn}</strong></div>
                    )}
                  </>
                ) : (
                  <div className="detail-card">
                    <p className="detail-text">No portfolio assigned yet. Apply one from the Investments page.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI Advisory Modal ── */}
      {showAIModal && aiGoal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050 }}
          onClick={e => { if (e.target === e.currentTarget) setShowAIModal(false) }}
        >
          <div style={{ background: 'white', borderRadius: '22px', maxWidth: '560px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(59,110,255,.18)' }}>
            <div style={{ background: '#2c3ecc', padding: '28px 26px 22px', borderRadius: '22px 22px 0 0' }}>
              <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '.85rem', fontWeight: 500, margin: '0 0 4px' }}>AI Advisory</p>
              <h3 style={{ color: '#fff', fontFamily: 'Sora, sans-serif', fontSize: '1.3rem', fontWeight: 700, margin: '0 0 16px' }}>{aiGoal.name}</h3>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {[
                  ['Target', formatRM(aiGoal.target)],
                  ['Saved', formatRM(aiGoal.savings)],
                  ['Monthly', formatRM(aiGoal.monthly)],
                  ['Deadline', aiGoal.dateLabel || '—'],
                  ['Lag', `${aiGoal.lagPercent ?? 0}%`],
                ].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ color: 'rgba(255,255,255,.6)', fontSize: '.72rem' }}>{label}</div>
                    <div style={{ color: label === 'Lag' && aiGoal.lagPercent < 0 ? '#ff8b8b' : '#fff', fontWeight: 700, fontSize: '.88rem' }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '24px 26px' }}>
              {adviceLoading ? (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-mid)' }}>
                  <i className="bi bi-arrow-repeat" style={{ fontSize: '1.5rem' }}></i>
                  <p style={{ marginTop: 8 }}>Generating advice…</p>
                </div>
              ) : advice?.error ? (
                <div style={{ color: 'var(--red)', padding: '12px 0' }}>{advice.error}</div>
              ) : advice?.completed ? (
                <div style={{ color: 'var(--green)', padding: '12px 0' }}>🎉 This goal is already completed!</div>
              ) : advice ? (
                <>
                  <div style={{ fontSize: '.7rem', fontWeight: 700, letterSpacing: '.08em', color: '#9ca3af', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    TWO PATHS FORWARD <span style={{ flex: 1, height: 1, background: '#e2e6f0', display: 'block' }}></span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    {[
                      { key: 'A', color: '#3b6eff', label: 'Option A – TIME', big: advice.optionA?.extraMonths ? `+${advice.optionA.extraMonths}` : '—', unit: 'months', desc: advice.optionA?.description, tag: advice.optionA?.tag },
                      { key: 'B', color: '#22c55e', label: 'Option B – AMOUNT', big: advice.optionB?.monthlyIncrease ? `+RM${advice.optionB.monthlyIncrease.toLocaleString()}` : '—', unit: '/mo', desc: advice.optionB?.description, tag: advice.optionB?.tag },
                    ].map(opt => (
                      <div
                        key={opt.key}
                        onClick={() => setSelectedOption(opt.key)}
                        style={{ border: `1.5px solid ${selectedOption === opt.key ? '#3b6eff' : '#e2e6f0'}`, borderRadius: '16px', padding: '16px', cursor: 'pointer', boxShadow: selectedOption === opt.key ? '0 0 0 3px rgba(59,110,255,.15)' : 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: '.72rem', fontWeight: 700, color: opt.color }}>{opt.label}</span>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${selectedOption === opt.key ? '#3b6eff' : '#e2e6f0'}`, background: selectedOption === opt.key ? 'radial-gradient(circle at center, #3b6eff 45%, #fff 45%)' : 'transparent' }}></div>
                        </div>
                        <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '1.6rem', fontWeight: 800 }}>{opt.big} <span style={{ fontSize: '.9rem', fontWeight: 500, color: '#5c6170' }}>{opt.unit}</span></div>
                        <p style={{ fontSize: '.76rem', color: '#5c6170', lineHeight: 1.4, margin: 0 }}>{opt.desc}</p>
                        <span style={{ display: 'inline-block', fontSize: '.72rem', fontWeight: 600, borderRadius: '99px', padding: '3px 10px', background: opt.key === 'B' ? '#dcfce7' : '#f3f5f9', color: opt.key === 'B' ? '#15803d' : '#5c6170' }}>{opt.tag}</span>
                      </div>
                    ))}
                  </div>

                  {/* ── WealthTrack AI Advisor block ── */}
                  <div style={{ background: '#f0f4ff', borderRadius: '12px', padding: '16px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#3b6eff', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>✦</div>
                        <div>
                          <p style={{ fontWeight: 700, fontSize: '.85rem', margin: 0 }}>WealthTrack AI Advisor</p>
                          <p style={{ fontSize: '.72rem', color: '#9ca3af', margin: 0 }}>Powered by Gemini · Smart Suggestions</p>
                        </div>
                      </div>
                      <span style={{ background: '#e8eeff', color: '#3b6eff', fontSize: '.7rem', fontWeight: 700, borderRadius: '99px', padding: '3px 10px' }}>AI Generated</span>
                    </div>
                    {/* Show description of selected option, or Option B by default */}
                    <p style={{ fontSize: '.84rem', lineHeight: 1.6, margin: '0 0 12px' }}>
                      {selectedOption === 'A'
                        ? advice.optionA?.description
                        : advice.optionB?.description}
                    </p>
                    <div style={{ background: '#fff', borderRadius: '8px', padding: '10px 12px', display: 'flex', gap: '10px' }}>
                      <span>💡</span>
                      <p style={{ fontSize: '.78rem', color: '#5c6170', margin: 0 }}>
                        {selectedOption === 'A'
                          ? `Extending your timeline by ${advice.optionA?.extraMonths ?? '—'} months keeps your monthly budget intact while still reaching your goal.`
                          : `Automating your monthly transfer removes the temptation to skip — consistency compounds faster than any single large contribution.`}
                      </p>
                    </div>
                  </div>
                </>
              ) : null}
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button style={{ border: '1.5px solid #e2e6f0', background: '#fff', borderRadius: '99px', padding: '8px 16px', fontFamily: 'DM Sans,sans-serif', fontSize: '.84rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => openAIAdvisory(aiGoal)}>↻ Regenerate</button>
                <button onClick={() => setShowAIModal(false)} style={{ border: '1.5px solid #e2e6f0', background: '#fff', borderRadius: '99px', padding: '8px 16px', fontFamily: 'DM Sans,sans-serif', fontSize: '.84rem', fontWeight: 600, cursor: 'pointer' }}>Dismiss</button>
                <button
                  disabled={!selectedOption || applying}
                  onClick={handleApplyOption}
                  style={{ marginLeft: 'auto', background: selectedOption ? '#3b6eff' : '#d1d5db', color: selectedOption ? '#fff' : '#6b7280', border: 'none', borderRadius: '99px', padding: '8px 20px', fontFamily: 'DM Sans,sans-serif', fontSize: '.84rem', fontWeight: 700, cursor: selectedOption ? 'pointer' : 'not-allowed' }}
                >
                  {applying ? 'Applying…' : selectedOption ? `Apply Option ${selectedOption}` : 'Apply Selected Option'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Goal Modal ── */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '22px', padding: '32px', maxWidth: '560px', width: '90%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(59,110,255,.18)' }}>
            <h4 className="modal-main-title">{editingGoal ? 'Update Goal' : 'Create New Goal'}</h4>
            <p className="modal-main-sub">{editingGoal ? 'Edit your goal details and save changes.' : 'Define your financial goal and start tracking your progress.'}</p>
            {formError && (
              <div style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: '10px', padding: '10px 14px', marginBottom: '14px', fontSize: '.85rem' }}>
                {formError}
              </div>
            )}
            <form onSubmit={handleSaveGoal}>
              {[['Goal Name', 'name', 'e.g. Dream Vacation Fund'], ['Description', 'desc', 'Brief description']].map(([label, key, ph]) => (
                <div key={key} className="modal-field">
                  <label className="modal-label">{label}</label>
                  <input className="modal-input-field" value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} placeholder={ph} />
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[['Target Amount (RM)', 'target', '50000'], ['Current Savings (RM)', 'savings', '0']].map(([label, key, ph]) => (
                  <div key={key} className="modal-field">
                    <label className="modal-label">{label}</label>
                    <input type="number" min="0" className="modal-input-field" value={formData[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })} placeholder={ph} />
                  </div>
                ))}
              </div>
              <div className="modal-field">
                <label className="modal-label">Monthly Contribution (RM)</label>
                <input type="number" min="0" className="modal-input-field" value={formData.monthly} onChange={e => setFormData({ ...formData, monthly: e.target.value })} placeholder="500" />
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
                <button type="button" className="btn-modal-cancel" style={{ flex: 1 }} onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
                <button type="submit" className="btn-modal-save" style={{ flex: 1 }} disabled={saving}>
                  {saving ? 'Saving…' : editingGoal ? 'Update Goal' : 'Save Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoalsPage