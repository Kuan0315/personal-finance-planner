import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chart from 'chart.js/auto'
import './RoiPage.css'

const ROI_HISTORY_KEY = 'roi-history-mock'

const createHistoryItem = (overrides = {}) => ({
  _id: `roi-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  createdAt: new Date().toISOString(),
  ...overrides,
})

const getStoredHistory = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(ROI_HISTORY_KEY) || 'null')
    if (Array.isArray(saved)) return saved
  } catch {
    // fall through to empty history
  }

  return []
}

const saveMockHistory = (items) => {
  localStorage.setItem(ROI_HISTORY_KEY, JSON.stringify(items))
}

const normalizeWholeNumberInput = (value) => value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
const normalizeDecimalInput = (value) => value.replace(/[^\d.]/g, '').replace(/^(0+)(?=\d)/, '')

const RoiPage = ({ user }) => {
  const navigate = useNavigate();

  const [roiMode, setRoiMode] = useState('compound');
  const [formData, setFormData] = useState({ principal: '', monthly: '', rate: '', duration: '' });
  const [activeRate, setActiveRate] = useState(null);
  const [activeDuration, setActiveDuration] = useState(null);
  const [rateA, setRateA] = useState('');
  const [rateB, setRateB] = useState('');
  const [results, setResults] = useState(null);
  const [chartData, setChartData] = useState(null);
  const chartRef      = useRef(null);
  const chartInstance = useRef(null);
  const [history, setHistory] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [justCalculated, setJustCalculated] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const principalInputRef = useRef(null);
  const rateInputRef = useRef(null);
  const durationInputRef = useRef(null);

  useEffect(() => { if (!user?.email) navigate('/login'); }, [user, navigate]);

  const fetchHistory = () => {
    setLoadingHistory(true)
    try {
      setHistory(getStoredHistory())
    } catch (err) {
      console.error('Failed to load history', err)
      setHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  // Load saved ROI history from local mock storage
  useEffect(() => {
    fetchHistory()
  }, [])

  // ── FIX: draw chart only after results panel is in the DOM ──
  useEffect(() => {
    if (!chartData || !chartRef.current) return;
    if (chartInstance.current) chartInstance.current.destroy();
    const color = roiMode === 'compound' ? '#3b6eff' : '#8b5cf6';
    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: chartData.labels,
        datasets: [{
          data: chartData.values,
          borderColor: color,
          backgroundColor: color + '18',
          fill: true, tension: 0.4,
          pointRadius: 4, pointBackgroundColor: color, borderWidth: 2,
        }],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => 'RM ' + Math.round(ctx.raw).toLocaleString('en-MY') } } },
        scales: {
          y: { ticks: { callback: v => 'RM' + (v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v) }, grid: { color: '#e2e6f0' } },
          x: { grid: { display: false } },
        },
      },
    });
  }, [chartData, roiMode]);

  const calcCompound = (P, PMT, r, t) => {
    if (r === 0) return P + PMT * t * 12;
    const n = 12, rt = Math.pow(1 + r / n, n * t);
    return P * rt + PMT * ((rt - 1) / (r / n));
  };
  const calcSimple = (P, r, t) => r === 0 ? P : P * (1 + r * t);

  const focusMissingField = (field) => {
    const fieldRefs = {
      principal: principalInputRef,
      rate: rateInputRef,
      duration: durationInputRef,
    }

    const targetRef = fieldRefs[field]
    if (!targetRef?.current) return

    targetRef.current.focus()
    targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const calculateResults = () => {
    if (formData.principal === '' || formData.rate === '' || formData.duration === '') {
      const missingField = formData.principal === '' ? 'principal' : formData.rate === '' ? 'rate' : 'duration'
      setValidationMessage('Please fill in Initial Investment, Annual Interest Rate, and Duration before calculating.')
      focusMissingField(missingField)
      return
    }

    const P = Number(formData.principal) || 0;
    const PMT = Number(formData.monthly) || 0;
    const r = (Number(formData.rate) || 0) / 100;
    const t = Number(formData.duration) || 0;
    const invested = roiMode === 'compound' ? P + PMT * t * 12 : P;
    const fv       = roiMode === 'compound' ? calcCompound(P, PMT, r, t) : calcSimple(P, r, t);
    const profit   = fv - invested;
    const gain     = invested > 0 ? ((profit / invested) * 100).toFixed(1) : '0.0';

    // Build chart data array first
    const labels = [], values = [];
    for (let yr = 0; yr <= t; yr++) {
      labels.push(yr === 0 ? 'Now' : (yr % 2 === 0 ? `Yr ${yr}` : ''));
      values.push(Math.round(roiMode === 'compound' ? (yr === 0 ? P : calcCompound(P, PMT, r, yr)) : (yr === 0 ? P : calcSimple(P, r, yr))));
    }

    // Set results first (mounts the canvas), then chart data (triggers useEffect)
    setResults({ invested: Math.round(invested), fv: Math.round(fv), profit: Math.round(profit), gain });
    setChartData({ labels, values });
    setValidationMessage('');
    // mark that user just calculated so we can auto-save once results are applied
    setJustCalculated(true);
  };

  const calcScenario = (rate) => {
    const P = Number(formData.principal) || 0;
    const PMT = Number(formData.monthly) || 0;
    const r = (Number(rate) || 0) / 100;
    const t = Number(formData.duration) || 0;
    const invested = roiMode === 'compound' ? P + PMT * t * 12 : P;
    const fv       = roiMode === 'compound' ? calcCompound(P, PMT, r, t) : calcSimple(P, r, t);
    const profit   = fv - invested;
    return { invested: Math.round(invested), fv: Math.round(fv), profit: Math.round(profit), gain: invested > 0 ? ((profit / invested) * 100).toFixed(1) : '0.0' };
  };

  // Save current result to server
  const saveToHistory = () => {
    if (!results) return;
    const payload = createHistoryItem({
      mode: roiMode,
      principal: Number(formData.principal) || 0,
      monthlyContribution: Number(formData.monthly) || 0,
      annualInterestRate: Number(formData.rate) || 0,
      durationInYears: Number(formData.duration) || 0,
      invested: results.invested,
      futureValue: results.fv,
      profit: results.profit,
      gainPercentage: results.gain,
      timeLineData: chartData || { labels: [], values: [] },
    })

    setSaving(true)
    try {
      const saved = createMockHistoryItem(payload)
      const next = [saved, ...history]
      setHistory(next)
      saveMockHistory(next)
    } catch (err) {
      console.error('Failed to save history', err)
    } finally {
      setSaving(false)
    }
  }

  // Auto-save after calculateResults updates `results` and `chartData`
  useEffect(() => {
    if (!justCalculated) return;
    if (!results) return;
    // debounce a tick to ensure chartData is present
    const t = setTimeout(() => { saveToHistory(); setJustCalculated(false); }, 100);
    return () => clearTimeout(t);
  }, [justCalculated, results, chartData]);

  const deleteHistoryItem = async (item) => {
    try {
      const next = history.filter(i => String(i._id) !== String(item._id))
      setHistory(next)
      saveMockHistory(next)
    } catch (err) {
      console.error('Failed to delete item', err)
    }
  }

  const sA = results ? calcScenario(rateA) : null;
  const sB = results ? calcScenario(rateB) : null;
  const fmt = n => 'RM ' + n.toLocaleString();
  const modeBadgeStyle = { background: roiMode === 'compound' ? '#dbeafe' : '#ede9fe', color: roiMode === 'compound' ? '#3b6eff' : '#8b5cf6' };
  const canCalculate = formData.principal !== '' && formData.rate !== '' && formData.duration !== '';
  const scenarioARateLabel = rateA === '' ? '—' : rateA;
  const scenarioBRateLabel = rateB === '' ? '—' : rateB;

  const restoreHistoryItem = (item) => {
    setRoiMode(item.mode || 'compound')
    setFormData({
      principal: String(item.principal ?? ''),
      monthly: String(item.monthlyContribution ?? item.monthly ?? ''),
      rate: String(item.annualInterestRate ?? item.annualRate ?? item.rate ?? ''),
      duration: String(item.durationInYears ?? item.years ?? item.duration ?? ''),
    })
    setShowHistory(false)
    // re-calc after state settles
    setTimeout(() => calculateResults(), 120)
  }

  const openHistory = async () => {
    await fetchHistory()
    setShowHistory(true)
  }

  const toggleSelectMode = () => {
    if (selectionMode) {
      setSelectedIds(new Set())
      setSelectionMode(false)
    } else {
      setSelectionMode(true)
    }
  }

  const toggleSelectItem = (id) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const selectAll = () => {
    if (selectedIds.size === history.length) {
      setSelectedIds(new Set())
      return
    }
    const all = new Set(history.map(i => String(i._id)))
    setSelectedIds(all)
  }

  const deleteSelectedItems = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`Delete ${selectedIds.size} selected item(s)?`)) return;
    setSaving(true)
    try {
      const ids = Array.from(selectedIds)
      const next = history.filter(i => !ids.includes(String(i._id)))
      setHistory(next)
      saveMockHistory(next)
      setSelectedIds(new Set())
      setSelectionMode(false)
    } catch (err) {
      console.error('Bulk delete failed', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h1 className="page-title">ROI Calculator</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="roi-mode-toggle">
            <button className={`roi-mode-btn ${roiMode === 'compound' ? 'active compound-active' : ''}`} onClick={() => setRoiMode('compound')}>
              <span className="mode-dot compound-dot"></span> Compound
            </button>
            <span className="roi-divider-pipe">|</span>
            <button className={`roi-mode-btn ${roiMode === 'simple' ? 'active simple-active' : ''}`} onClick={() => setRoiMode('simple')}>
              Simple <span className="mode-dot simple-dot"></span>
            </button>
          </div>
          <button className="icon-btn three-dot" onClick={openHistory} aria-label="Open history">⋯</button>
        </div>
      </div>

      {/* Mode banner */}
      <div className={`mode-banner mb-4 ${roiMode === 'compound' ? 'compound-banner' : 'simple-banner'}`}>
        <i className="bi bi-info-circle-fill me-2"></i>
        <strong>{roiMode === 'compound' ? 'Compound mode active' : 'Simple mode active'}</strong>
        <span>{roiMode === 'compound' ? ' — interest is reinvested each month and added to your balance.' : ' — interest is calculated only on the initial investment and does not compound.'}</span>
      </div>

      {/* compact header actions moved into header */}

      {/* Main layout — CSS grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: '20px', alignItems: 'start' }}>

        {/* Left: Parameters */}
        <div className="roi-card">
          <div className="roi-card-header">
            <span className="roi-card-label">PARAMETERS</span>
            <span className="roi-mode-badge" style={modeBadgeStyle}>{roiMode === 'compound' ? 'Compound' : 'Simple'}</span>
          </div>
          <div className="roi-field">
            <div className="roi-field-header"><label>Initial Investment <span style={{ color: '#ef4444' }}>*</span></label><span className="roi-field-tag">Required</span></div>
            <div className="roi-input-group">
              <span className="roi-prefix">RM</span><span className="roi-sep">|</span>
              <input ref={principalInputRef} type="text" inputMode="numeric" className="roi-input" value={formData.principal} onChange={e => setFormData({ ...formData, principal: normalizeWholeNumberInput(e.target.value) })} placeholder="Enter initial investment" />
            </div>
          </div>
          <div className="roi-field" style={{ opacity: roiMode === 'compound' ? 1 : 0.45 }}>
            <div className="roi-field-header">
              <label>Monthly Contribution</label>
              <span className="roi-field-tag" style={{ color: roiMode === 'compound' ? '#5c6170' : '#a78bfa' }}>{roiMode === 'compound' ? 'Optional' : 'Not used'}</span>
            </div>
            <div className="roi-input-group">
              <span className="roi-prefix">RM</span><span className="roi-sep">|</span>
              <input type="text" inputMode="numeric" className="roi-input" value={formData.monthly} onChange={e => setFormData({ ...formData, monthly: normalizeWholeNumberInput(e.target.value) })} placeholder="Enter amount (optional)" disabled={roiMode === 'simple'} />
            </div>
          </div>
          <div className="roi-field">
            <div className="roi-field-header"><label>Annual Interest Rate <span style={{ color: '#ef4444' }}>*</span></label><span className="roi-field-tag">Required</span></div>
            <div className="roi-input-group">
              <input ref={rateInputRef} type="text" inputMode="decimal" className="roi-input" value={formData.rate} onChange={e => { setFormData({ ...formData, rate: normalizeDecimalInput(e.target.value) }); setActiveRate(null); }} placeholder="Enter rate" />
              <span className="roi-sep">|</span><span className="roi-suffix">%</span>
            </div>
            <div className="roi-quick-btns mt-2">
              {[3, 5, 7, 9, 12].map(v => (
                <button key={v} className={`quick-btn ${activeRate === v ? (roiMode === 'compound' ? 'active' : 'active-simple') : ''}`}
                  onClick={() => { setFormData({ ...formData, rate: String(v) }); setActiveRate(v); }}>{v}%</button>
              ))}
            </div>
          </div>
          <div className="roi-hr"></div>
          <div className="roi-field">
            <div className="roi-field-header"><label>Duration <span style={{ color: '#ef4444' }}>*</span></label><span className="roi-field-tag">Required</span></div>
            <div className="roi-input-group">
              <button className="roi-stepper" onClick={() => { const currentDuration = Number(formData.duration) || 0; const v = Math.max(1, currentDuration - 1); setFormData({ ...formData, duration: String(v) }); setActiveDuration(null); }}>−</button>
              <span className="roi-sep">|</span>
              <input ref={durationInputRef} type="text" inputMode="numeric" className="roi-input" value={formData.duration} onChange={e => { setFormData({ ...formData, duration: normalizeWholeNumberInput(e.target.value) }); setActiveDuration(null); }} placeholder="Enter duration" />
              <span className="roi-dur-label">years</span>
              <span className="roi-sep">|</span>
              <button className="roi-stepper" onClick={() => { const currentDuration = Number(formData.duration) || 0; const v = Math.min(50, currentDuration + 1); setFormData({ ...formData, duration: String(v) }); setActiveDuration(null); }}>+</button>
            </div>
            <div className="roi-quick-btns mt-2">
              {[3, 5, 10, 20].map(v => (
                <button key={v} className={`quick-btn ${activeDuration === v ? (roiMode === 'compound' ? 'active' : 'active-simple') : ''}`}
                  onClick={() => { setFormData({ ...formData, duration: String(v) }); setActiveDuration(v); }}>{v}yr</button>
              ))}
            </div>
          </div>
          <button className={`btn-calculate mt-4 ${roiMode === 'simple' ? 'simple-calc' : ''}`} onClick={calculateResults}>
            Calculate ({roiMode === 'compound' ? 'Compound' : 'Simple'})
          </button>
          {validationMessage && (
            <div style={{ marginTop: '10px', color: '#b45309', fontSize: '0.92rem' }}>
              {validationMessage}
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div>
          {results && (
            <>
              <div className="roi-card mb-4">
                <div className="roi-card-header mb-3">
                  <span className="roi-card-label">RESULTS</span>
                  <span className="roi-mode-badge" style={modeBadgeStyle}>{roiMode === 'compound' ? 'Compound' : 'Simple'}</span>
                </div>
                {/* CSS grid — equal halves */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="result-stat-card">
                    <div className="result-stat-label">TOTAL INVESTED<br /><small style={{ color: '#9ca3af', fontWeight: 400 }}>{roiMode === 'compound' ? `P + (PMT × ${formData.duration * 12})` : 'Principal only'}</small></div>
                    <div className="result-stat-value">{fmt(results.invested)}</div>
                    <div className="result-divider"></div>
                    <div className="result-stat-label">TOTAL RETURN<br /><small style={{ color: '#9ca3af', fontWeight: 400 }}>{roiMode === 'compound' ? 'Future value (FV)' : 'P × (1 + r × t)'}</small></div>
                    <div className="result-stat-value">{fmt(results.fv)}</div>
                    <div className="result-divider"></div>
                    <div className="result-stat-label">TOTAL PROFIT<br /><small style={{ color: '#22c55e', fontWeight: 600 }}>↑ {results.gain}% gain</small></div>
                    <div className="result-stat-value profit-value">+{fmt(results.profit)}</div>
                  </div>
                  <div className="result-chart-placeholder">
                    {/* Canvas always mounted when results exist */}
                    <canvas ref={chartRef}></canvas>
                  </div>
                </div>
                  {roiMode === 'simple' && (
                  <div className="compound-hint mt-3">
                    <i className="bi bi-arrow-left-right me-2"></i>
                    <span>Compound earns <strong>RM {Math.max(0, Math.round(calcCompound(formData.principal, formData.monthly, formData.rate / 100, formData.duration) - results.fv)).toLocaleString()}</strong> more over {formData.duration} years.</span>
                    <button className="hint-link ms-1" onClick={() => setRoiMode('compound')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#3b6eff', fontWeight: 600, textDecoration: 'underline' }}>Switch to Compound</button>
                  </div>
                )}

                {/* Save button removed — auto-save enabled after calculation */}
              </div>
              {/* History removed from main flow — accessible via History button/modal */}

              {/* Scenario Comparison */}
              <div className="roi-card">
                <div className="roi-card-header mb-3">
                  <span className="roi-card-label">SCENARIO COMPARISON</span>
                  <span className="roi-mode-badge" style={modeBadgeStyle}>{roiMode === 'compound' ? 'Compound' : 'Simple'}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Scenario A */}
                  <div>
                    <div className="scenario-header">
                      <span className="scenario-rate-label">RATE A</span>
                      <div className="roi-input-group mini">
                        <input type="text" inputMode="decimal" className="roi-input" style={{ textAlign: 'right' }} value={rateA} onChange={e => setRateA(normalizeDecimalInput(e.target.value))} placeholder="Enter rate A" />
                        <span className="roi-sep">|</span><span className="roi-suffix">%</span>
                      </div>
                    </div>
                    <div className="scenario-card">
                      <div className="scenario-card-top"><span>Scenario A</span><span className="scenario-badge neutral">{scenarioARateLabel}%</span></div>
                      <div className="scenario-row"><span>Total Invested</span><strong>{fmt(sA.invested)}</strong></div>
                      <div className="scenario-row"><span>Total Return</span><strong>{fmt(sA.fv)}</strong></div>
                      <div className="scenario-row"><span>Profit</span><strong style={{ color: '#22c55e' }}>+{fmt(sA.profit)}</strong></div>
                      <div className="scenario-row"><span>Gain</span><strong>{sA.gain}%</strong></div>
                    </div>
                  </div>
                  {/* Scenario B */}
                  <div>
                    <div className="scenario-header">
                      <span className="scenario-rate-label">RATE B</span>
                      <div className="roi-input-group mini">
                        <input type="text" inputMode="decimal" className="roi-input" style={{ textAlign: 'right' }} value={rateB} onChange={e => setRateB(normalizeDecimalInput(e.target.value))} placeholder="Enter rate B" />
                        <span className="roi-sep">|</span><span className="roi-suffix">%</span>
                      </div>
                    </div>
                    <div className="scenario-card best-scenario">
                      <div className="scenario-card-top"><span>Scenario B</span><span className="scenario-badge best">{scenarioBRateLabel}%</span></div>
                      <div className="scenario-row"><span>Total Invested</span><strong>{fmt(sB.invested)}</strong></div>
                      <div className="scenario-row"><span>Total Return</span><strong style={{ color: '#22c55e' }}>{fmt(sB.fv)}</strong></div>
                      <div className="scenario-row">
                        <span>Profit</span>
                        <span><strong style={{ color: '#22c55e' }}>+{fmt(sB.profit)}</strong>
                          {sB.profit - sA.profit > 0 && <span className="profit-delta">+{fmt(sB.profit - sA.profit)}</span>}
                        </span>
                      </div>
                      <div className="scenario-row">
                        <span>Gain</span>
                        <span><strong style={{ color: '#22c55e' }}>{sB.gain}%</strong> <span className="best-dot">● BEST</span></span>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '10px', color: '#6b7280', fontSize: '0.9rem' }}>
                  Enter any two annual rates you want to compare, such as 4.5% and 9.0%.
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
    {showHistory && (
      <div className="roi-history-modal" role="dialog">
        <div className="roi-history-dialog">
          <div className="roi-history-header">
            <h3>Saved ROI History</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {selectionMode ? (
                <>
                  <button className="history-pill-btn history-pill-soft" onClick={selectAll}>{selectedIds.size === history.length ? 'Unselect all' : 'Select all'}</button>
                  <button className="history-pill-btn history-pill-danger" onClick={deleteSelectedItems} disabled={selectedIds.size === 0 || saving}>{saving ? 'Deleting...' : `Delete (${selectedIds.size})`}</button>
                  <button className="icon-btn close-cross" onClick={() => toggleSelectMode()} aria-label="Cancel selection">✕</button>
                </>
              ) : (
                <>
                  <button className="history-pill-btn history-pill-soft" onClick={() => toggleSelectMode()}>Select</button>
                  <button className="icon-btn close-cross" onClick={() => setShowHistory(false)} aria-label="Close history">✕</button>
                </>
              )}
            </div>
          </div>
          <div className="roi-history-body">
            {loadingHistory ? (
              <div className="empty">Loading history...</div>
            ) : history.length === 0 ? (
              <div className="empty">No saved ROI calculations yet.</div>
            ) : (
              <div className="history-list">
                {history.map(item => (
                  <div key={item._id} className="history-item">
                    {selectionMode && (
                      <div style={{ paddingRight: 8 }}>
                        <input type="checkbox" checked={selectedIds.has(String(item._id))} onChange={() => toggleSelectItem(String(item._id))} />
                      </div>
                    )}
                    <div className="history-main">
                      <div className="history-topline">
                        <div className="history-title">{(item.mode || '').toUpperCase()} · {item.years} yr</div>
                        <div className="history-badge">{item.gainPercentage || item.gain || 0}% gain</div>
                      </div>
                      <div className="history-date">{new Date(item.createdAt || item._id || Date.now()).toLocaleString()}</div>
                      <div className="history-stats">
                        <div className="history-stat">
                          <span>Invested</span>
                          <strong>{fmt(item.invested || 0)}</strong>
                        </div>
                        <div className="history-stat">
                          <span>Future value</span>
                          <strong>{fmt(item.futureValue || item.fv || 0)}</strong>
                        </div>
                        <div className="history-stat profit-stat">
                          <span>Profit</span>
                          <strong>+{fmt(item.profit || 0)}</strong>
                        </div>
                      </div>
                    </div>
                    <div className="history-actions">
                      {!selectionMode && <button className="btn-link" onClick={() => restoreHistoryItem(item)}>Restore</button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default RoiPage
