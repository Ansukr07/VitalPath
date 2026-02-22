import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import RiskBadge from '../../components/RiskBadge';
import { doctorService } from '../../api/services';

export default function DoctorDashboard() {
    const navigate = useNavigate();
    const [queue, setQueue] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [activeTab, setActiveTab] = useState('queue');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const [queueRes, alertsRes] = await Promise.all([
                    doctorService.getQueue(),
                    doctorService.getAlerts(),
                ]);
                setQueue(queueRes.data.data);
                setAlerts(alertsRes.data.data);
            } catch { setError('Unable to load dashboard.'); }
            finally { setLoading(false); }
        })();
    }, []);

    const critical = queue.filter(p => p.triageStatus === 'critical');
    const high = queue.filter(p => p.triageStatus === 'high');
    const moderate = queue.filter(p => p.triageStatus === 'moderate');
    const stable = queue.filter(p => p.triageStatus === 'stable');

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <div className="topbar">
                    <div className="topbar-title">Doctor Dashboard</div>
                    <div className="topbar-actions">
                        {alerts.length > 0 && (
                            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', padding: '0.4rem 0.85rem', fontSize: '0.8rem', color: '#fca5a5', fontWeight: 700, cursor: 'pointer' }}
                                onClick={() => setActiveTab('alerts')}>
                                🚨 {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
                            </div>
                        )}
                    </div>
                </div>

                <div className="page-body">
                    {error && <div className="alert alert-critical">{error}</div>}

                    {/* Stats */}
                    <div className="stats-grid">
                        <div className="stat-card">
                            <div className="stat-label">Total Patients</div>
                            <div className="stat-value">{queue.length}</div>
                            <div className="stat-sub">In system</div>
                        </div>
                        <div className="stat-card" style={{ borderColor: critical.length > 0 ? 'rgba(239,68,68,0.4)' : 'var(--border-light)' }}>
                            <div className="stat-label">Critical</div>
                            <div className="stat-value" style={{ background: 'linear-gradient(135deg, #fca5a5, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{critical.length}</div>
                            <div className="stat-sub">Urgent attention</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">High Priority</div>
                            <div className="stat-value" style={{ background: 'linear-gradient(135deg, #fdba74, #ea580c)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{high.length}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-label">Moderate / Stable</div>
                            <div className="stat-value">{moderate.length + stable.length}</div>
                            <div className="stat-sub">Lower priority</div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        {['queue', 'alerts'].map(tab => (
                            <button key={tab} className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-outline'} btn-sm`} onClick={() => setActiveTab(tab)}>
                                {tab === 'queue' ? '📋 Priority Queue' : `🚨 High-Risk Alerts (${alerts.length})`}
                            </button>
                        ))}
                    </div>

                    {loading ? <div className="spinner" /> : (
                        <>
                            {activeTab === 'queue' && (
                                <>
                                    {queue.length === 0 && (
                                        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                                            No patients in the system yet.
                                        </div>
                                    )}

                                    {/* Priority groups */}
                                    {[
                                        { label: '🔴 Critical', group: critical, color: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)' },
                                        { label: '🟠 High Priority', group: high, color: 'rgba(249,115,22,0.06)', border: 'rgba(249,115,22,0.3)' },
                                        { label: '🟡 Moderate', group: moderate, color: 'rgba(234,179,8,0.05)', border: 'var(--border-light)' },
                                        { label: '🟢 Stable', group: stable, color: 'transparent', border: 'var(--border-light)' },
                                    ].filter(g => g.group.length > 0).map(({ label, group, color, border }) => (
                                        <div key={label} style={{ marginBottom: '1.75rem' }}>
                                            <h2 className="section-heading">{label}</h2>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                                                {group.map(patient => (
                                                    <PatientCard key={patient._id} patient={patient} color={color} border={border} onClick={() => navigate(`/doctor/patient/${patient._id}`)} />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </>
                            )}

                            {activeTab === 'alerts' && (
                                <>
                                    {alerts.length === 0 ? (
                                        <div className="alert alert-success">✅ No high-risk alerts at this time.</div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {alerts.map(patient => (
                                                <div key={patient._id} className="glass-card"
                                                    style={{ borderColor: patient.triageStatus === 'critical' ? 'rgba(239,68,68,0.5)' : 'rgba(249,115,22,0.4)', cursor: 'pointer', background: patient.triageStatus === 'critical' ? 'rgba(239,68,68,0.06)' : 'var(--glass)' }}
                                                    onClick={() => navigate(`/doctor/patient/${patient._id}`)}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div>
                                                            <div style={{ fontWeight: 700 }}>
                                                                {patient.triageStatus === 'critical' ? '🚨' : '⚠️'} {patient.user?.firstName} {patient.user?.lastName}
                                                            </div>
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{patient.user?.email}</div>
                                                            {patient.lastTriageAt && <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>Triaged: {new Date(patient.lastTriageAt).toLocaleDateString()}</div>}
                                                        </div>
                                                        <RiskBadge priority={patient.triageStatus} size="lg" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function PatientCard({ patient, color, border, onClick }) {
    const v = patient.latestVitals;
    return (
        <div className="glass-card" style={{ cursor: 'pointer', background: color, borderColor: border, transition: 'all 0.2s' }}
            onClick={onClick}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div>
                    <div style={{ fontWeight: 700 }}>{patient.user?.firstName} {patient.user?.lastName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{patient.user?.email}</div>
                </div>
                <RiskBadge priority={patient.triageStatus} />
            </div>

            {v && (
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.75rem' }}>
                    {v.heartRate && <span style={{ color: 'var(--text-muted)' }}>❤️ {v.heartRate} bpm</span>}
                    {v.oxygenSaturation && <span style={{ color: 'var(--text-muted)' }}>🫁 SpO₂ {v.oxygenSaturation}%</span>}
                    {v.bloodPressureSystolic && <span style={{ color: 'var(--text-muted)' }}>💉 {v.bloodPressureSystolic}/{v.bloodPressureDiastolic}</span>}
                    {v.temperature && <span style={{ color: 'var(--text-muted)' }}>🌡️ {v.temperature}°C</span>}
                </div>
            )}

            {patient.lastTriageAt && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                    Last assessed: {new Date(patient.lastTriageAt).toLocaleDateString()}
                </div>
            )}

            <div style={{ marginTop: '0.75rem', textAlign: 'right', fontSize: '0.8rem', color: 'var(--primary-light)', fontWeight: 600 }}>
                View Details →
            </div>
        </div>
    );
}
