import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import RiskBadge from '../../components/RiskBadge';
import { patientService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

export default function PatientDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [triageHistory, setTriageHistory] = useState([]);
    const [symptoms, setSymptoms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const [profileRes, triageRes, symptomsRes] = await Promise.all([
                    patientService.getProfile(),
                    patientService.getTriageHistory(),
                    patientService.getSymptomHistory(),
                ]);
                setProfile(profileRes.data.data);
                setTriageHistory(triageRes.data.data);
                setSymptoms(symptomsRes.data.data);
            } catch (err) {
                setError('Unable to load dashboard. Check your connection.');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const latestTriage = triageHistory[0];
    const priorityColor = { critical: 'var(--critical)', high: 'var(--high)', moderate: 'var(--moderate)', stable: 'var(--stable)' };
    const pc = priorityColor[latestTriage?.finalPriority] || 'var(--text-dim)';

    const scoreColor = (score) => {
        if (score >= 75) return 'var(--critical)';
        if (score >= 50) return 'var(--high)';
        if (score >= 25) return 'var(--moderate)';
        return 'var(--stable)';
    };

    if (loading) return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content"><div className="spinner" /></div>
        </div>
    );

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <div className="topbar">
                    <div className="topbar-title">Patient Dashboard</div>
                    <div className="topbar-actions">
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Welcome, {user.firstName}</span>
                    </div>
                </div>

                <div className="page-body">
                    {error && <div className="alert alert-critical">{error}</div>}

                    {/* Current Triage Status Hero */}
                    {latestTriage && (
                        <div className="glass-card" style={{
                            marginBottom: '1.5rem',
                            background: `linear-gradient(135deg, rgba(${latestTriage.finalPriority === 'critical' ? '239,68,68' : latestTriage.finalPriority === 'high' ? '249,115,22' : latestTriage.finalPriority === 'moderate' ? '234,179,8' : '34,197,94'}, 0.08), transparent)`,
                            borderColor: `${pc}33`,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                <div>
                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Current Triage Status</div>
                                    <RiskBadge priority={latestTriage.finalPriority} size="lg" />
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                                        Last assessed: {new Date(latestTriage.createdAt).toLocaleDateString()}
                                    </p>
                                </div>

                                {/* Risk score bar */}
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Decision Support Score</span>
                                        <span style={{ fontWeight: 700, color: scoreColor(latestTriage.finalScore) }}>{latestTriage.finalScore}/100</span>
                                    </div>
                                    <div className="risk-bar-track">
                                        <div className="risk-bar-fill" style={{ width: `${latestTriage.finalScore}%`, background: scoreColor(latestTriage.finalScore) }} />
                                    </div>
                                </div>

                                <button className="btn btn-primary" onClick={() => navigate('/patient/symptoms')}>
                                    + Update Symptoms
                                </button>
                            </div>

                            {latestTriage.ruleEngine?.reasoning?.length > 0 && (
                                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 600 }}>WHY THIS LEVEL</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {latestTriage.ruleEngine.reasoning.slice(0, 4).map((r, i) => (
                                            <span key={i} style={{ fontSize: '0.78rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '0.3rem 0.65rem', color: 'var(--text-muted)' }}>
                                                {r.factor}: {r.value}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="disclaimer">
                                <strong>⚕️ Decision Support Only:</strong> This score is generated by our rule-based engine and is for decision support purposes only. A licensed doctor must review and validate your condition.
                            </div>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">Symptom Logs</div>
                            <div className="stat-value">{symptoms.length}</div>
                            <div className="stat-sub">Total submissions</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Triage Records</div>
                            <div className="stat-value">{triageHistory.length}</div>
                            <div className="stat-sub">Assessments done</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Blood Type</div>
                            <div className="stat-value" style={{ fontSize: '1.4rem' }}>{profile?.bloodType || 'N/A'}</div>
                            <div className="stat-sub">On record</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Status</div>
                            <div className="stat-value" style={{ fontSize: '1.1rem' }}><RiskBadge priority={profile?.triageStatus} /></div>
                            <div className="stat-sub">Current priority</div>
                        </div>
                    </div>

                    {/* Quick actions */}
                    <h2 className="section-heading">Quick Actions</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {[
                            { icon: '🩺', label: 'Report Symptoms', desc: 'Log new symptoms for triage', path: '/patient/symptoms' },
                            { icon: '📄', label: 'Upload Report', desc: 'Add medical test results', path: '/patient/reports' },
                            { icon: '🌿', label: 'View Suggestions', desc: 'Lifestyle wellness tips', path: '/patient/suggestions' },
                            { icon: '🔔', label: 'Reminders', desc: 'Upcoming appointments', path: '/patient/reminders' },
                        ].map((item) => (
                            <div key={item.path} className="glass-card" style={{ cursor: 'pointer', transition: 'all 0.25s' }}
                                onClick={() => navigate(item.path)}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
                            >
                                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{item.label}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.desc}</div>
                            </div>
                        ))}
                    </div>

                    {/* Recent symptom logs */}
                    {symptoms.length > 0 && (
                        <>
                            <h2 className="section-heading">Recent Submissions</h2>
                            <div className="glass-card">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Symptoms</th>
                                            <th>Max Severity</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {symptoms.slice(0, 5).map((s) => (
                                            <tr key={s._id}>
                                                <td style={{ color: 'var(--text-muted)' }}>{new Date(s.createdAt).toLocaleDateString()}</td>
                                                <td>{s.symptoms.slice(0, 2).map((sym) => sym.name).join(', ')}{s.symptoms.length > 2 ? '…' : ''}</td>
                                                <td>
                                                    <span style={{ color: s.symptoms.reduce((m, sym) => Math.max(m, sym.severity), 0) >= 7 ? 'var(--critical)' : 'var(--stable)', fontWeight: 700 }}>
                                                        {s.symptoms.reduce((m, sym) => Math.max(m, sym.severity), 0)}/10
                                                    </span>
                                                </td>
                                                <td><span className={`badge badge-${s.status === 'reviewed' ? 'stable' : 'moderate'}`}>{s.status}</span></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {/* First-time prompt */}
                    {symptoms.length === 0 && !latestTriage && (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏥</div>
                            <h2 style={{ marginBottom: '0.5rem' }}>Get Started</h2>
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Enter your symptoms to receive a decision-support triage assessment.</p>
                            <button className="btn btn-primary btn-lg" onClick={() => navigate('/patient/symptoms')}>
                                Report Symptoms →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
