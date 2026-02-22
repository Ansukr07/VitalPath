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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [profileRes, triageRes, symptomsRes, remindersRes, reportsRes] = await Promise.all([
                    patientService.getProfile(),
                    patientService.getTriageHistory(),
                    patientService.getSymptomHistory(),
                    reminderService.list({ status: 'upcoming' }),
                    reportService.list()
                ]);

                setStats({
                    profile: profileRes.data.data,
                    triageHistory: triageRes.data.data || [],
                    symptoms: symptomsRes.data.data || [],
                    reminders: remindersRes.data.data || [],
                    reports: reportsRes.data.data || []
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

                            <div className="pd-urgent-card">
                                <div>
                                    <h3>Urgent Support</h3>
                                    <p>Contact crisis hotlines immediately if you're in distress.</p>
                                </div>

                                <div className="pd-urgent-illustration">🪷</div>

                                <button className="pd-urgent-btn" onClick={() => navigate('/patient/symptoms')}>Get help now</button>
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
                                    <div key={rep._id} className="pd-session-item" onClick={() => navigate('/patient/reports')}>
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
