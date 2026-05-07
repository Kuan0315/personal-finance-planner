import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { INVESTMENT_RISK_PROFILES, RISK_PROFILE_KEYS } from '../../data/investmentRiskProfiles'
import './InvestmentsPage.css'

const PORTFOLIO_ASSIGNMENTS_KEY = 'pfp_goal_portfolios'
const savePortfolioAssignment = (goalId, portfolio) => {
  const current = JSON.parse(localStorage.getItem(PORTFOLIO_ASSIGNMENTS_KEY)) || {}
  localStorage.setItem(PORTFOLIO_ASSIGNMENTS_KEY, JSON.stringify({ ...current, [goalId]: portfolio }))
}

// INVESTMENTS PAGE
// ═══════════════════════════════════════════════════════
const InvestmentsPage = ({ user }) => {
  const navigate = useNavigate();
  const [selectedRisk, setSelectedRisk] = useState('conservative');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => { if (!user?.email) navigate('/login'); }, [user, navigate]);

  const GOALS_LIST = [
    { id: 1, name: 'Dream Home Down Payment', saved: 88400, target: 130000, status: 'on-track' },
    { id: 2, name: 'Personal Savings Fund', saved: 44000, target: 100000, status: 'on-track' },
    { id: 3, name: 'Emergency Fund', saved: 16500, target: 30000, status: 'at-risk' },
    { id: 4, name: 'Travel Fund', saved: 16400, target: 20000, status: 'on-track' },
    { id: 5, name: 'Early Retirement Fund', saved: 210000, target: 1000000, status: 'high-risk' },
  ];

  const riskData = INVESTMENT_RISK_PROFILES[selectedRisk];

  return (
    <div className="main-content">
      <div style={{ marginBottom: '24px' }}>
        <h1 className="page-title">Investments</h1>
      </div>
      <div className="inv-container">
        <h2 className="inv-main-title">Choose Your Risk Profile</h2>
        <p className="inv-main-sub">Choose a risk level based on your goals and time horizon.</p>
        <div className="risk-tabs mb-4">
          {RISK_PROFILE_KEYS.map(risk => (
            <button key={risk} className={`risk-tab ${selectedRisk === risk ? 'active ' + risk : ''}`} onClick={() => setSelectedRisk(risk)}>
              {risk.charAt(0).toUpperCase() + risk.slice(1)}
            </button>
          ))}
        </div>
        {/* Banner */}
        <div style={{ background: riskData.gradient, borderRadius: '18px', padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', color: '#fff' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '99px', padding: '4px 12px', fontSize: '.74rem', fontWeight: 700, marginBottom: '10px' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', display: 'inline-block' }}></span>
              {riskData.tag}
            </div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '1.4rem', fontWeight: 700 }}>{riskData.title}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '.72rem', fontWeight: 600, opacity: .8, letterSpacing: '.06em', marginBottom: '2px' }}>EXPECTED RETURN:</div>
            <div style={{ fontFamily: 'Sora,sans-serif', fontSize: '2.2rem', fontWeight: 800 }}>{riskData.returnVal}</div>
            <div style={{ fontSize: '.82rem', opacity: .8 }}>per year</div>
          </div>
        </div>
        {/* Info cards — CSS grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="inv-info-card">
            <p className="inv-info-title">Asset Allocation</p>
            <div className="alloc-bar mb-2">
              {riskData.allocation.map((a, i) => <div key={i} className="alloc-segment" style={{ width: `${a.pct}%`, background: a.color }}></div>)}
            </div>
            {riskData.allocation.map((a, i) => (
              <div key={i} className="alloc-item"><span className="alloc-dot" style={{ background: a.color }}></span>{a.label}</div>
            ))}
          </div>
          <div className="inv-info-card">
            <p className="inv-info-title">Recommended Instruments</p>
            <div className="instrument-tags">
              {riskData.instruments.map((inst, i) => <span key={i} className="instrument-tag" style={{ borderColor: riskData.borderColor, color: riskData.borderColor }}>{inst}</span>)}
            </div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="inv-info-card">
            <p className="inv-info-title">Suitable Goals</p>
            {riskData.suitableGoals.map((g, i) => <div key={i} className="suitable-item"><span>{g.icon}</span><span>{g.text}</span></div>)}
          </div>
          <div style={{ background: riskData.quoteColor, borderLeft: `3px solid ${riskData.quoteBorder}`, borderRadius: '0 12px 12px 0', padding: '18px 20px', fontStyle: 'italic', fontSize: '.88rem', lineHeight: 1.6, color: '#1a1d2e', display: 'flex', alignItems: 'center' }}>
            {riskData.quote}
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-primary-action" style={{ padding: '10px 40px' }} onClick={() => setShowGoalModal(true)}>Apply this portfolio</button>
        </div>
      </div>

      {/* Select Goal Modal */}
      {showGoalModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowGoalModal(false); }}>
          <div style={{ background: 'white', borderRadius: '22px', padding: '32px', maxWidth: '640px', width: '90%', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.15)' }}>
            <h4 className="modal-main-title">Select Goal</h4>
            <p className="modal-main-sub">Choose the financial goal to apply this portfolio to.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', margin: '20px 0' }}>
              {GOALS_LIST.map(goal => {
                const isSelected = selectedGoal?.id === goal.id;
                const statusStyle = goal.status === 'on-track' ? { background: '#dcfce7', color: '#15803d' } : goal.status === 'at-risk' ? { background: '#ffedd5', color: '#c2410c' } : { background: '#fee2e2', color: '#b91c1c' };
                const statusLabel = goal.status === 'on-track' ? 'On Track' : goal.status === 'at-risk' ? 'At Risk' : 'High Risk';
                return (
                  <div key={goal.id} onClick={() => setSelectedGoal(goal)}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', border: `1.5px solid ${isSelected ? '#3b6eff' : '#e2e6f0'}`, borderRadius: '14px', padding: '16px 18px', cursor: 'pointer', background: isSelected ? '#f0f4ff' : '#fff' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, border: `2px solid ${isSelected ? '#3b6eff' : '#d1d5db'}`, background: isSelected ? 'radial-gradient(circle at center, #3b6eff 45%, #fff 45%)' : 'transparent' }}></div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: '.95rem', margin: '0 0 3px' }}>{goal.name}</p>
                      <p style={{ fontSize: '.82rem', color: '#5c6170', margin: 0 }}>RM {goal.saved.toLocaleString()} / RM {goal.target.toLocaleString()}</p>
                    </div>
                    <span style={{ ...statusStyle, fontSize: '.72rem', fontWeight: 700, borderRadius: '99px', padding: '4px 12px' }}>{statusLabel}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn-modal-cancel" onClick={() => { setShowGoalModal(false); setSelectedGoal(null); }}>Cancel</button>
              <button className="btn-modal-save" disabled={!selectedGoal} onClick={() => { setShowGoalModal(false); setShowConfirmModal(true); }} style={{ opacity: selectedGoal ? 1 : 0.5 }}>Continue</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '22px', padding: '32px', maxWidth: '500px', width: '90%' }}>
            <h4 className="modal-main-title">Confirm Portfolio</h4>
            <p className="modal-main-sub">Review your portfolio choice and selected goal before applying.</p>
            <div className="confirm-summary">
              <div className="confirm-row"><span className="confirm-label">Portfolio</span><span className="confirm-value">{selectedRisk.charAt(0).toUpperCase() + selectedRisk.slice(1)}</span></div>
              <div className="confirm-row"><span className="confirm-label">Expected Return</span><span className="confirm-value">{riskData.returnVal}</span></div>
              <div className="confirm-row"><span className="confirm-label">Selected Goal</span><span className="confirm-value">{selectedGoal?.name}</span></div>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button className="btn-modal-cancel" onClick={() => { setShowConfirmModal(false); setShowGoalModal(true); }}>Back</button>
              <button className="btn-modal-save" onClick={() => {
                if (selectedGoal) {
                  savePortfolioAssignment(selectedGoal.id, {
                    name: riskData.title,
                    riskLevel: selectedRisk.charAt(0).toUpperCase() + selectedRisk.slice(1),
                    allocation: riskData.allocation,
                    instruments: riskData.instruments,
                    expectedReturn: riskData.returnVal,
                  })
                }
                alert('Portfolio applied successfully!');
                setShowConfirmModal(false);
                setSelectedGoal(null);
              }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default InvestmentsPage
