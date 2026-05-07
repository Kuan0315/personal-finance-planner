import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Chart from 'chart.js/auto'
import { MOCK_MARKET_INSIGHTS } from '../../data/mockMarketInsights'
import './DashboardPage.css'

const DashboardPage = ({ user }) => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    trend: '—', sp500: '—', topPerformer: '—', performance: '—', riskLevel: '—', riskSub: '', news: [],
    charts: { sp500Trend: [], sectorPerformance: [] },
    globalView: {
      indexTrend: '+0.00% (+0.00 pts)',
      indexValue: 'S&P 500 0.00',
      topGlobalSector: 'Information Technology',
      vix: '20.00',
      riskLevel: 'Moderate',
      lastUpdated: null,
      dataSource: 'fallback',
    },
    recommendations: [],
    dataSource: 'unknown',
    topStock: { symbol: 'N/A', company: 'No data', percentChange: 0, change: 0 },
    isNewUpdate: false,
    updatedFields: [],
  });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const trendChartRef = useRef(null);
  const sectorChartRef = useRef(null);
  const trendChartInst = useRef(null);
  const sectorChartInst = useRef(null);

  useEffect(() => { if (!user?.email) navigate('/login'); }, [user, navigate]);
  useEffect(() => { loadInsights(); }, []);
  useEffect(() => {
    const refreshMs = 60 * 1000;
    const intervalId = setInterval(() => {
      loadInsights();
    }, refreshMs);

    return () => clearInterval(intervalId);
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    try {
      // Simulate API delay for local demo data
      await new Promise(resolve => setTimeout(resolve, 500));
      const data = MOCK_MARKET_INSIGHTS;
      setDashboardData({
        trend: data.trend ?? '—',
        sp500: data.sp500 ?? data.performance ?? '—',
        topPerformer: data.topPerformer ?? '—',
        performance: data.performance ?? '—',
        riskLevel: data.riskLevel ?? '—',
        riskSub: data.riskSub ?? '',
        news: Array.isArray(data.news) ? data.news : [],
        charts: {
          sp500Trend: Array.isArray(data.charts?.sp500Trend) ? data.charts.sp500Trend : [],
          sectorPerformance: Array.isArray(data.charts?.sectorPerformance) ? data.charts.sectorPerformance : [],
        },
        globalView: {
          indexTrend: data.globalView?.indexTrend ?? '+0.00% (+0.00 pts)',
          indexValue: data.globalView?.indexValue ?? 'S&P 500 0.00',
          topGlobalSector: data.globalView?.topGlobalSector ?? 'Information Technology',
          vix: data.globalView?.vix ?? '20.00',
          riskLevel: data.globalView?.riskLevel ?? 'Moderate',
          lastUpdated: data.globalView?.lastUpdated ?? null,
          dataSource: data.globalView?.dataSource ?? data.dataSource ?? 'mock',
        },
        recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
        dataSource: data.dataSource ?? 'mock',
        topStock: data.summary?.topStock ?? data.topStock ?? { symbol: 'N/A', company: 'No data', percentChange: 0, change: 0 },
        isNewUpdate: !!data.isNewUpdate,
        updatedFields: Array.isArray(data.updatedFields) ? data.updatedFields : [],
      });
      setLastUpdated(new Date());
      renderCharts(data.charts);
    } catch (err) {
      console.error('Error loading market insights:', err);
    } finally { setLoading(false); }
  };

  const renderCharts = (charts = {}) => {
    const sp500Trend = Array.isArray(charts.sp500Trend) ? charts.sp500Trend : [];
    const sectorPerformance = Array.isArray(charts.sectorPerformance) ? charts.sectorPerformance : [];

    const currentMonthIndex = new Date().getMonth();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const buildRecentMonthLabels = (count) => {
      const labels = [];
      for (let offset = Math.max(0, count - 1); offset >= 0; offset -= 1) {
        const monthIndex = (currentMonthIndex - offset + 12) % 12;
        labels.push(monthNames[monthIndex]);
      }
      return labels;
    };

    const trendLabels = sp500Trend.map((point) => point.month ?? '');
    const trendValues = sp500Trend.map((point) => Number(point.price ?? 0));
    const trendFallbackLabels = buildRecentMonthLabels(6);
    const sectorLabels = sectorPerformance.map((item) => item.sector ?? '');
    const sectorValues = sectorPerformance.map((item) => Number(item.performance ?? 0));
    const buildDynamicScale = (values) => {
      if (!values.length) {
        return { min: 0, max: 10, stepSize: 2.5 };
      }

      const rawMin = Math.min(...values);
      const rawMax = Math.max(...values);
      const padding = Math.max(0.5, (rawMax - rawMin) * 0.15);
      let min = Math.floor((rawMin - padding) / 100) * 100;
      let max = Math.ceil((rawMax + padding) / 100) * 100;

      if (min === max) {
        min = Math.max(0, min - 500);
        max = max + 500;
      }

      const span = max - min;
      let stepSize = 500;
      if (span <= 1000) stepSize = 250;
      else if (span <= 2000) stepSize = 500;
      else if (span <= 5000) stepSize = 1000;
      else stepSize = 2000;

      return { min, max, stepSize };
    };

    const buildSectorScale = (values) => {
      if (!values.length) {
        return { min: -5, max: 5, stepSize: 2.5 };
      }

      const rawMin = Math.min(...values);
      const rawMax = Math.max(...values);
      const padding = Math.max(0.5, (rawMax - rawMin) * 0.2);
      let min = Math.max(-5, Math.floor((rawMin - padding) * 2) / 2);
      let max = Math.min(5, Math.ceil((rawMax + padding) * 2) / 2);

      if (min === max) {
        min = Math.max(-5, min - 1);
        max = Math.min(5, max + 1);
      }

      const span = max - min;
      let stepSize = 1;
      if (span <= 2) stepSize = 0.5;
      else if (span <= 4) stepSize = 1;
      else stepSize = 2;

      return { min, max, stepSize };
    };

    const trendScale = buildDynamicScale(trendValues.length > 0 ? trendValues : [4200, 4350, 4205, 4510, 4630, 4585]);
    const sectorScale = buildSectorScale(sectorValues.length > 0 ? sectorValues : [15, 8, 5, -2, 6, 4]);

    if (trendChartInst.current) trendChartInst.current.destroy();
    if (trendChartRef.current) {
      trendChartInst.current = new Chart(trendChartRef.current, {
        type: 'line',
        data: {
          labels: trendLabels.length > 0 ? trendLabels : trendFallbackLabels,
          datasets: [{
            data: trendValues.length > 0 ? trendValues : [4200, 4350, 4205, 4510, 4630, 4585],
            borderColor: '#3b6eff',
            backgroundColor: 'rgba(59,110,255,0.10)',
            pointBackgroundColor: '#3b6eff',
            pointRadius: 5,
            borderWidth: 2.5,
            tension: 0.35,
            fill: false,
          }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: trendScale.min, max: trendScale.max, ticks: { stepSize: trendScale.stepSize, color: '#9ca3af', font: { size: 11 } }, grid: { color: 'rgba(148,163,184,0.18)' }, border: { display: false } }, x: { ticks: { color: '#9ca3af', font: { size: 11 } }, grid: { color: 'rgba(148,163,184,0.18)' }, border: { display: false } } } },
      });
    }
    if (sectorChartInst.current) sectorChartInst.current.destroy();
    if (sectorChartRef.current) {
      const sectorColors = (sectorValues.length > 0 ? sectorValues : [15, 8, 5, -2, 6, 4]).map((value) => (
        value >= 0 ? 'rgba(22,163,74,0.82)' : 'rgba(220,38,38,0.82)'
      ));
      sectorChartInst.current = new Chart(sectorChartRef.current, {
        type: 'bar',
        data: {
          labels: sectorLabels.length > 0 ? sectorLabels : ['Banks & Financials', 'Technology', 'Plantation & Agriculture', 'Consumer Products', 'Healthcare'],
          datasets: [{
            data: sectorValues.length > 0 ? sectorValues : [5, 3.5, 2.5, -1.5, 1.8],
            backgroundColor: sectorColors,
            borderColor: sectorColors,
            borderRadius: 8,
            borderSkipped: false,
          }],
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { min: sectorScale.min, max: sectorScale.max, ticks: { stepSize: sectorScale.stepSize, color: '#9ca3af', font: { size: 11 } }, grid: { color: 'rgba(148,163,184,0.18)' }, border: { display: false } }, x: { ticks: { color: '#9ca3af', font: { size: 11 } }, grid: { display: false }, border: { display: false } } } },
      });
    }
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return date.toLocaleString('en-MY', {
      timeZone: 'Asia/Kuala_Lumpur',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const iconBox = (bg, color) => ({ width: 60, height: 60, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.55rem', flexShrink: 0, background: bg, color });

  return (
    <div className="main-content">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '28px' }}>
        <div>
          <h1 className="page-title">Market Insights Dashboard</h1>
          <p className="page-subtitle">Real-time market data and analysis</p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px', alignItems: 'center' }}>
            <div className="dashboard-inline-highlight">
              <i className={`bi ${dashboardData.dataSource === 'fallback' ? 'bi-exclamation-triangle' : 'bi-check-circle'}`}></i>
              <span>{dashboardData.dataSource === 'fallback' ? 'Fallback data is being used' : 'Live data is being used'}</span>
            </div>
            {dashboardData.isNewUpdate && (
              <div className="dashboard-inline-highlight" style={{ background: '#fffbeb', color: '#92400e' }}>
                <i className="bi bi-bell"></i>
                <span>New update</span>
              </div>
            )}
          </div>
        </div>
        <button type="button" className="btn-primary-action" onClick={loadInsights} disabled={loading}>
          <i className="bi bi-arrow-clockwise"></i>{loading ? 'Refreshing...' : 'Refresh Insights'}
        </button>
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '20px' }}>
        {[
          { label: "Today Malaysia Stock Index Trend", value: dashboardData.trend, sub: dashboardData.sp500, bg: '#eaf7ef', color: '#2563eb', icon: 'bi-graph-up-arrow', emphasis: 'summary-emphasis-green', link: 'https://www.bursamalaysia.com/', clickable: true },
          { label: 'Top Performer Sector', value: dashboardData.topPerformer, sub: dashboardData.performance, bg: '#e9efff', color: '#2563eb', icon: 'bi-award', emphasis: 'summary-emphasis-green', link: null, clickable: false },
          { label: 'Market Risk', value: dashboardData.riskLevel, sub: dashboardData.riskSub, bg: '#fff2e8', color: '#2563eb', icon: 'bi-exclamation-triangle', emphasis: 'summary-emphasis-dark', link: null, clickable: false },
        ].map(({ label, value, sub, bg, color, icon, emphasis, link, clickable }) => (
          <div
            key={label}
            onClick={() => clickable && link && window.open(link, '_blank')}
            style={{
              background: '#fff',
              border: '1.5px solid var(--border)',
              borderRadius: '18px',
              padding: '22px 24px',
              boxShadow: '0 2px 16px rgba(59,110,255,.07)',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
              cursor: clickable ? 'pointer' : 'default',
              transition: 'all 0.2s ease',
              opacity: 1,
            }}
            onMouseEnter={(e) => clickable && (e.currentTarget.style.boxShadow = '0 8px 24px rgba(59,110,255,.15)', e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => clickable && (e.currentTarget.style.boxShadow = '0 2px 16px rgba(59,110,255,.07)', e.currentTarget.style.transform = 'translateY(0)')}
          >
            <div>
              <p className="summary-label">{label}</p>
              <h2 className={`summary-value ${emphasis}`}>{value}</h2>
              <p className="summary-sub">{sub}</p>
            </div>
            <div style={iconBox(bg, color)}><i className={`bi ${icon}`}></i></div>
          </div>
        ))}
      </div>

      {/* API Summary Panel */}
      <div className="dashboard-panel" style={{ marginBottom: '20px' }}>
        <div className="insight-card-head">
          <h3 className="section-title-sm mb-0">Global Market View</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="insight-pill">{dashboardData.globalView.riskLevel} Risk</span>
            <span className="insight-pill" style={{ background: dashboardData.globalView.dataSource === 'fallback' ? '#fff2e8' : '#eaf7ef', color: dashboardData.globalView.dataSource === 'fallback' ? '#b45309' : '#166534' }}>
              {dashboardData.globalView.dataSource === 'fallback' ? 'Fallback' : 'Live'}
            </span>
          </div>
        </div>
        <div className="dashboard-summary-grid">
          <div className="dashboard-summary-item" style={{ cursor: 'pointer', transition: 'all 0.2s ease' }} onClick={() => window.open('https://finance.yahoo.com/quote/%5EGSPC/', '_blank')} onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')} onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}>
            <span className="insight-label">GLOBAL MARKET INDEX TREND (S&amp;P 500)</span>
            <div className="dashboard-inline-highlight"><i className="bi bi-arrow-up-right"></i><span>{dashboardData.globalView.indexTrend}</span></div>
          </div>
          <div className="dashboard-summary-item">
            <span className="insight-label">TOP GLOBAL SECTOR</span>
            <strong className="insight-value">{dashboardData.globalView.topGlobalSector}</strong>
          </div>
          <div className="dashboard-summary-item">
            <span className="insight-label">GLOBAL VOLATILITY INDEX (VIX)</span>
            <strong className="insight-value dashboard-performance-value">{dashboardData.globalView.vix}</strong>
          </div>
        </div>
        <div className="dashboard-updated-row">
          <i className="bi bi-clock-history"></i><span>Last Updated: {formatDate(dashboardData.globalView.lastUpdated || lastUpdated)}</span>
        </div>
      </div>

      {/* Financial News */}
      <div style={{ marginBottom: '20px' }}>
        <div className="dashboard-section-header dashboard-section-header--stacked">
          <h2 className="dashboard-section-title">Market News</h2>
          <p className="page-subtitle">Latest headlines relevant to global market moves</p>
          <span className="insight-pill" style={{ alignSelf: 'flex-start', background: dashboardData.news.length > 0 ? '#eaf7ef' : '#fff2e8', color: dashboardData.news.length > 0 ? '#166534' : '#b45309' }}>
            {dashboardData.news.length > 0 ? 'Live news' : 'Fallback news'}
          </span>
        </div>
        <div className="dashboard-news-list">
          {dashboardData.news.length > 0 ? dashboardData.news.map((n, i) => (
            <a
              key={`${n.title ?? 'news'}-${i}`}
              className="news-card"
              href={n.link ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', textDecoration: 'none', color: 'inherit' }}
            >
              <div className={`news-thumb news-thumb--${(i % 3) + 1}`} style={n.photo ? { backgroundImage: `url(${n.photo})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}></div>
              <div className="news-content">
                <h3 className="news-title">{n.title ?? 'Market update'}</h3>
                <div className="news-meta">
                  <span className="news-source">{n.source ?? 'Market Desk'}</span><span>&bull;</span>
                  <span>{n.timeLabel ?? n.time ?? 'Recent'}</span><span>&bull;</span>
                  <span className="news-link">
                    <i className="bi bi-box-arrow-up-right"></i>
                  </span>
                </div>
              </div>
            </a>
          )) : (
            <div className="dashboard-panel" style={{ padding: '16px 18px' }}>
              No market news available yet.
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div style={{ marginBottom: '20px' }}>
        <div className="dashboard-section-header dashboard-section-header--stacked">
          <h2 className="dashboard-section-title">Market Trends</h2>
          <p className="page-subtitle">Historical movement and sector comparison</p>
          <span className="insight-pill" style={{ alignSelf: 'flex-start', background: '#eaf7ef', color: '#166534' }}>
            Chart data: {dashboardData.charts.sp500Trend.length > 0 ? 'Live' : 'Fallback'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="dashboard-panel chart-panel">
            <h3 className="section-title-sm">Malaysia Market Index (FBM KLCI)</h3>
            <div className="chart-wrapper"><canvas ref={trendChartRef}></canvas></div>
          </div>
          <div className="dashboard-panel chart-panel">
            <h3 className="section-title-sm">Malaysia Sector Performance</h3>
            <div className="chart-wrapper"><canvas ref={sectorChartRef}></canvas></div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="dashboard-panel">
        <div className="dashboard-section-header mb-0">
          <h2 className="dashboard-section-title">Next Actions &amp; Recommendations</h2>
          <p className="page-subtitle">Suggested actions based on current market conditions</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '14px', marginTop: '18px' }}>
          {dashboardData.recommendations.length > 0 ? dashboardData.recommendations.map((r, i) => (
            <div key={`${r.title ?? 'rec'}-${i}`} className={`recommendation-item${r.warn ? ' warning' : ''}`}>
              <div className="recommendation-icon"><i className={`bi ${r.icon}`}></i></div>
              <div><h4>{r.title}</h4><p>{r.text}</p></div>
            </div>
          )) : (
            <div className="recommendation-item">
              <div className="recommendation-icon"><i className="bi bi-info-circle"></i></div>
              <div><h4>No recommendations yet</h4><p>Refresh the insights to generate dynamic recommendations.</p></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage