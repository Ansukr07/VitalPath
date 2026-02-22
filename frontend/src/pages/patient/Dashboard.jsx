import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { patientService, reportService, reminderService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import './PatientDashboard.css';

export default function PatientDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        profile: null,
        triageHistory: [],
        symptoms: [],
        reminders: [],
        reports: []
    });
    const [error, setError] = useState('');
    const [chatText, setChatText] = useState('');
    const [liveInsights, setLiveInsights] = useState({ symptoms: [], medications: [], tests: [] });
    const [showInsights, setShowInsights] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const results = await Promise.allSettled([
                    patientService.getProfile(),
                    patientService.getTriageHistory(),
                    patientService.getSymptomHistory(),
                    reminderService.list({ status: 'upcoming' }),
                    reportService.list()
                ]);

                const getValue = (result, fallback = []) =>
                    result.status === 'fulfilled' ? result.value.data.data : fallback;

                const failedCount = results.filter(r => r.status === 'rejected').length;
                if (failedCount > 0) {
                    console.warn(`${failedCount} dashboard request(s) failed:`,
                        results.filter(r => r.status === 'rejected').map(r => r.reason?.message));
                }

                setStats({
                    profile: getValue(results[0], null),
                    triageHistory: getValue(results[1]),
                    symptoms: getValue(results[2]),
                    reminders: getValue(results[3]),
                    reports: getValue(results[4])
                });
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
                setError('Failed to load some dashboard data.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Debounced Live Insights from ClinicalBERT
    useEffect(() => {
        if (chatText.length < 5) {
            setLiveInsights({ symptoms: [], medications: [], tests: [] });
            setShowInsights(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const res = await patientService.getClinicalInsights(chatText);
                if (res.data.success) {
                    setLiveInsights(res.data.data);
                    const hasData = res.data.data.symptoms.length > 0 || res.data.data.medications.length > 0;
                    setShowInsights(hasData);
                }
            } catch (err) {
                console.warn('Live insights unavailable');
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [chatText]);

    // ── Data Mapping Helpers ──
    const latestTriage = stats.triageHistory[0];
    const completedTriageCount = stats.triageHistory.length;

    // Calculate trend percentage (comparing last two scores if available)
    const calculateTrend = () => {
        if (stats.triageHistory.length < 2) return '+0%';
        const current = stats.triageHistory[0].finalScore || 0;
        const previous = stats.triageHistory[1].finalScore || 0;
        if (previous === 0) return '+0%';
        const diff = ((current - previous) / previous) * 100;
        return `${diff >= 0 ? '+' : ''}${diff.toFixed(0)}%`;
    };

    // Map triage history to chart (last 7 entries)
    const chartData = stats.triageHistory.slice(0, 7).reverse().map(t => ({
        day: new Date(t.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' }),
        score: t.finalScore || 0,
        unfilled: 100 - (t.finalScore || 0)
    }));

    if (loading) return (
        <div className="pd-wrapper">
            <Sidebar />
            <div className="pd-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="spinner" />
            </div>
        </div>
    );

    return (
        <div className="pd-wrapper">
            <Sidebar />
            <main className="pd-content">
                {/* ── Header ── */}
                <header className="pd-header">
                    <h1 className="pd-greeting">
                        Hey, {user.firstName || 'User'}! Glad to have you back 👐
                    </h1>
                    <div className="pd-top-actions">
                        {error && <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>⚠️ {error}</span>}
                        <div className="pd-icon-btn">🔔</div>
                        <div className="pd-icon-btn">⚙️</div>
                        <div className="pd-icon-btn" style={{ padding: 0, overflow: 'hidden' }}>
                            <div className="user-avatar" style={{ width: '100%', height: '100%', borderRadius: 0 }}>
                                {user.firstName?.[0]}{user.lastName?.[0]}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="pd-main-grid">
                    {/* ── Left Column ── */}
                    <div className="pd-left-column">

                        {/* Stat Cards Row */}
                        <div className="pd-stats-row">
                            <div className="pd-card pd-stat-widget">
                                <span className="pd-card-title">Progress Tracking</span>
                                <div className="pd-stat-value-row">
                                    <span className="pd-stat-number">{completedTriageCount}</span>
                                    <span className={`pd-stat-trend ${calculateTrend().startsWith('+') ? 'pd-trend-up' : 'pd-trend-down'}`}>
                                        {calculateTrend()}
                                    </span>
                                </div>
                                <p className="pd-stat-desc">Triage assessments completed to date</p>
                                <div className="pd-progress-track">
                                    <div className="pd-progress-fill" style={{ width: `${Math.min(completedTriageCount * 10, 100)}%` }}></div>
                                </div>
                            </div>

                            <div className="pd-card pd-stat-widget">
                                <span className="pd-card-title">Symptom Logs</span>
                                <div className="pd-stat-value-row">
                                    <span className="pd-stat-number">{stats.symptoms.length}</span>
                                    <span className="pd-stat-trend" style={{ background: '#f1f5f9', color: '#64748b' }}>Total</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: '#3b82f6' }}>✅</span> Regular tracking maintained
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                        <span style={{ color: '#3b82f6' }}>✅</span> Patterns identified
                                    </div>
                                </div>
                            </div>

                            <div className="pd-card pd-stat-widget">
                                <span className="pd-card-title">Medical Documents</span>
                                <div className="pd-stat-value-row">
                                    <span className="pd-stat-number">{stats.reports.length}</span>
                                    <span className="pd-stat-trend pd-trend-up">Files</span>
                                </div>
                                <p className="pd-stat-desc">Securely stored in your vault</p>
                                <div className="pd-progress-track">
                                    <div className="pd-progress-fill" style={{ width: `${Math.min(stats.reports.length * 20, 100)}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Row: Chart & Urgent */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                            <div className="pd-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <span className="pd-card-title">Health Stability Trend</span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <span className="pd-stat-trend" style={{ background: '#f1f5f9', color: '#64748b' }}>Recent</span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
                                    Stability score based on your latest triage results (0-100 scale)
                                </p>

                                <div className="pd-chart-container">
                                    {chartData.length > 0 ? chartData.map((d, i) => (
                                        <div key={i} className="pd-chart-bar-group">
                                            <div className="pd-chart-bar-stack" style={{ height: '140px' }}>
                                                <div className="pd-chart-fill pd-chart-fill-secondary" style={{ height: `${d.unfilled}%` }}></div>
                                                <div className="pd-chart-fill pd-chart-fill-primary" style={{ height: `${d.score}%` }}></div>
                                            </div>
                                            <span className="pd-chart-label">{d.day}</span>
                                        </div>
                                    )) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                                            No assessment data yet.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pd-urgent-card" style={{
                                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                padding: '2.5rem 1.5rem',
                                gap: '1.25rem'
                            }}>
                                {/* Orb at Top */}
                                <div style={{
                                    width: '160px',
                                    height: '160px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: 'none',
                                    boxShadow: '0 0 50px rgba(59, 130, 246, 0.5)',
                                    flexShrink: 0
                                }}>
                                    <video
                                        src="/orb.mp4"
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                </div>

                                <div style={{ flex: 1 }}>
                                    <h3 style={{ color: '#fff', fontSize: '1.25rem', marginBottom: '0.5rem' }}>AI Support Assistant</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>Ask me about your health insights or symptoms.</p>
                                </div>

                                {/* Integrated Chat Bar */}
                                <div style={{ width: '100%', position: 'relative', marginTop: 'auto' }}>
                                    <input
                                        type="text"
                                        placeholder="Ask anything..."
                                        value={chatText}
                                        onChange={(e) => setChatText(e.target.value)}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '25px',
                                            padding: '0.75rem 3rem 0.75rem 1.25rem',
                                            color: '#fff',
                                            outline: 'none',
                                            fontSize: '0.9rem'
                                        }}
                                    />

                                    {/* Live Insights Overlay */}
                                    {showInsights && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '100%',
                                            left: '0',
                                            width: '100%',
                                            background: 'rgba(30, 41, 59, 0.95)',
                                            backdropFilter: 'blur(10px)',
                                            borderRadius: '12px',
                                            padding: '1rem',
                                            marginBottom: '1rem',
                                            border: '1px solid rgba(59, 130, 246, 0.3)',
                                            textAlign: 'left',
                                            boxShadow: '0 -10px 25px rgba(0,0,0,0.3)',
                                            zIndex: 10
                                        }}>
                                            <div style={{ fontSize: '0.7rem', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                                                ClinicalBERT Insights
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                {liveInsights.symptoms.map((s, i) => (
                                                    <span key={i} style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid rgba(59,130,246,0.2)' }}>
                                                        Symptom: {s}
                                                    </span>
                                                ))}
                                                {liveInsights.medications.map((m, i) => (
                                                    <span key={i} style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', border: '1px solid rgba(16,185,129,0.2)' }}>
                                                        Medication: {m}
                                                    </span>
                                                ))}
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.75rem' }}>
                                                Extracting clinical context safely...
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        style={{
                                            position: 'absolute',
                                            right: '6px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'var(--pd-accent)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#fff',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
                                        }}
                                    >
                                        <span style={{ transform: 'rotate(-90deg)', display: 'inline-block' }}>▼</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Row: History Summary */}
                        <div className="pd-card">
                            <span className="pd-card-title">Latest History Summary</span>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '2rem' }}>
                                Recent health submissions and their current processing status
                            </p>

                            <div className="pd-exercise-list">
                                {stats.symptoms.slice(0, 2).map((s, idx) => (
                                    <div key={s._id} className="pd-exercise-item">
                                        <div className="pd-exercise-icon">{idx === 0 ? '📝' : '🩺'}</div>
                                        <div className="pd-exercise-name">{s.symptoms.map(sym => sym.name).join(', ')}</div>
                                        <div className="pd-exercise-percent">{new Date(s.createdAt).toLocaleDateString()}</div>
                                        <div className="pd-progress-track" style={{ width: '100px', margin: 0 }}>
                                            <div className="pd-progress-fill" style={{ width: s.status === 'reviewed' ? '100%' : '50%' }}></div>
                                        </div>
                                        <div className="pd-exercise-time">{s.status}</div>
                                        <div style={{ color: '#3b82f6', fontWeight: 600 }}>{s.symptoms[0]?.severity}/10 Severity</div>
                                    </div>
                                ))}
                                {stats.symptoms.length === 0 && (
                                    <p style={{ textAlign: 'center', color: '#94a3b8' }}>No symptom logs submitted yet.</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Right Column ── */}
                    <div className="pd-right-column">

                        {/* Upcoming Reminders Section */}
                        <div className="pd-card pd-calendar-widget">
                            <span className="pd-card-title">Upcoming Tasks</span>
                            <div className="pd-days-row" style={{ marginTop: '0.5rem' }}>
                                {[...Array(7)].map((_, i) => {
                                    const d = new Date();
                                    d.setDate(d.getDate() + i);
                                    return (
                                        <div key={i} className={`pd-day ${i === 0 ? 'active' : ''}`}>
                                            <span className="pd-day-name">{d.toLocaleDateString([], { weekday: 'short' })}</span>
                                            <span className="pd-day-number">{d.getDate()}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="pd-appointments-list" style={{ marginTop: '1rem' }}>
                                {stats.reminders.slice(0, 3).map((r) => (
                                    <div key={r._id} className="pd-appointment">
                                        <div className="pd-avatar" style={{ background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                                            {r.type === 'medication' ? '💊' : '🏥'}
                                        </div>
                                        <div className="pd-app-info">
                                            <div className="pd-app-name">{r.title}</div>
                                            <div className="pd-app-role">{r.type}</div>
                                        </div>
                                        <div className="pd-app-time">
                                            {new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            <div className="pd-app-date">{new Date(r.scheduledAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}</div>
                                        </div>
                                    </div>
                                ))}
                                {stats.reminders.length === 0 && (
                                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>No upcoming reminders.</p>
                                )}
                            </div>

                            <button className="pd-urgent-btn" style={{ background: '#1e293b', width: '100%', marginTop: '1rem' }} onClick={() => navigate('/patient/reminders')}>
                                Manage Reminders
                            </button>
                        </div>

                        {/* Recent Reports Section */}
                        <div className="pd-card">
                            <span className="pd-card-title">Latest Medical Reports</span>
                            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
                                Access your securely stored diagnostic results and documents
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {stats.reports.slice(0, 3).map((rep) => (
                                    <div key={rep._id} className="pd-session-item" onClick={() => navigate(`/patient/reports/${rep._id}`)}>
                                        <div className="pd-play-btn">📄</div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{rep.originalName}</div>
                                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                                {rep.reportType.replace('_', ' ')} • {new Date(rep.reportDate || rep.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {stats.reports.length === 0 && (
                                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '1rem' }}>No reports uploaded yet.</p>
                                )}
                            </div>
                            <button className="pd-urgent-btn" style={{ background: 'transparent', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', marginTop: '1rem' }} onClick={() => navigate('/patient/reports')}>
                                View all reports
                            </button>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}
