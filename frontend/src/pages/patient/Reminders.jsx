import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { reminderService } from '../../api/services';
import './PatientDashboard.css';

const TYPE_ICONS = { appointment: '📅', test: '🧪', follow_up: '🔄', medication: '💊', lifestyle: '🌿', other: '🔔' };

export default function Reminders() {
    const [reminders, setReminders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', description: '', type: 'appointment', scheduledAt: '', location: '', doctorName: '' });
    const [saving, setSaving] = useState(false);

    const fetchReminders = async () => {
        try {
            const res = await reminderService.list({ status: 'upcoming' });
            setReminders(res.data.data);
        } catch { setError('Unable to load reminders.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchReminders(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.title || !form.scheduledAt) { setError('Title and date are required.'); return; }
        setSaving(true);
        try {
            await reminderService.create(form);
            setShowForm(false);
            setForm({ title: '', description: '', type: 'appointment', scheduledAt: '', location: '', doctorName: '' });
            fetchReminders();
        } catch (err) { setError(err.response?.data?.message || 'Failed to save reminder.'); }
        finally { setSaving(false); }
    };

    const handleMarkDone = async (id) => {
        try {
            await reminderService.update(id, { status: 'completed' });
            setReminders(reminders.filter(r => r._id !== id));
        } catch { setError('Update failed.'); }
    };

    const handleDelete = async (id) => {
        try {
            await reminderService.delete(id);
            setReminders(reminders.filter(r => r._id !== id));
        } catch { setError('Delete failed.'); }
    };

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const sortedReminders = [...reminders].sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
    const overdue = sortedReminders.filter(r => new Date(r.scheduledAt) < new Date());
    const upcoming = sortedReminders.filter(r => new Date(r.scheduledAt) >= new Date());

    return (
        <div className="pd-wrapper">
            <Sidebar />
            <main className="pd-content">
                <header className="pd-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 className="pd-page-title">Personal Reminders</h1>
                        <p className="pd-page-desc">Stay on track with your medical appointments, tests, and health routines.</p>
                    </div>
                    <button className="pd-urgent-btn" style={{ margin: 0, width: 'auto', background: showForm ? '#1e293b' : 'var(--pd-accent)', color: '#fff' }} onClick={() => setShowForm(!showForm)}>
                        {showForm ? '✕ Close' : '+ New Reminder'}
                    </button>
                </header>

                {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '1rem 1.5rem', borderRadius: '16px', marginBottom: '2rem', border: '1px solid #fecaca', fontWeight: 600 }}>⚠️ {error}</div>}

                {showForm && (
                    <div className="pd-section-card fade-in" style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '2rem' }}>Create New Reminder</h2>
                        <form onSubmit={handleCreate}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Subject</label>
                                    <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', textAlign: 'left', width: '100%', borderRadius: '12px' }} placeholder="e.g. Cardiology Follow-up" value={form.title} onChange={set('title')} required />
                                </div>
                                <div className="form-group">
                                    <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Category</label>
                                    <select className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', borderRadius: '12px', padding: '0 1rem' }} value={form.type} onChange={set('type')}>
                                        {Object.keys(TYPE_ICONS).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Date & Time</label>
                                    <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', borderRadius: '12px', padding: '0 1rem', textAlign: 'left' }} type="datetime-local" value={form.scheduledAt} onChange={set('scheduledAt')} required />
                                </div>
                                <div className="form-group">
                                    <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Location/Provider</label>
                                    <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', textAlign: 'left', width: '100%', borderRadius: '12px' }} placeholder="e.g. City General, Dr. Smith" value={form.doctorName} onChange={set('doctorName')} />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '2.5rem' }}>
                                <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Additional Notes</label>
                                <textarea className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', textAlign: 'left', width: '100%', borderRadius: '12px', height: '100px', padding: '1rem', resize: 'none' }} placeholder="Important details like fasting, medications, etc." value={form.description} onChange={set('description')} />
                            </div>
                            <button type="submit" className="pd-urgent-btn" style={{ margin: 0, width: '200px', background: 'var(--pd-accent)' }} disabled={saving}>
                                {saving ? 'Adding...' : 'Confirm Reminder'}
                            </button>
                        </form>
                    </div>
                )}

                <div> {/* Removed maxWidth: '1000px' */}
                    {overdue.length > 0 && (
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                ⚠️ Overdue <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>({overdue.length})</span>
                            </h2>
                            <ReminderList items={overdue} onDone={handleMarkDone} onDelete={handleDelete} status="overdue" />
                        </div>
                    )}

                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                            {upcoming.length > 0 ? 'Upcoming Schedule' : 'No Upcoming Tasks'}
                        </h2>
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>
                        ) : upcoming.length === 0 ? (
                            <div className="pd-section-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>🗓️</div>
                                <p style={{ color: 'var(--pd-text-muted)', fontWeight: 600 }}>You're all caught up! No upcoming reminders.</p>
                            </div>
                        ) : (
                            <ReminderList items={upcoming} onDone={handleMarkDone} onDelete={handleDelete} status="upcoming" />
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function ReminderList({ items, onDone, onDelete, status }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {items.map((r) => {
                const d = new Date(r.scheduledAt);
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                    <div key={r._id} className="pd-section-card" style={{ padding: '1.5rem', border: isToday ? '2px solid var(--pd-accent)' : '1px solid var(--pd-border)' }}>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                            <div style={{ width: 56, height: 56, borderRadius: '16px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0 }}>
                                {TYPE_ICONS[r.type] || '🔔'}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{r.title}</h3>
                                        <div style={{ fontSize: '0.85rem', color: status === 'overdue' ? '#ef4444' : isToday ? 'var(--pd-accent)' : '#64748b', fontWeight: 700 }}>
                                            {isToday ? 'TODAY at ' : ''}
                                            {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => onDone(r._id)} style={{ border: '1px solid #e2e8f0', background: '#fff', padding: '0.5rem 1rem', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#f8fafc'} onMouseLeave={(e) => e.target.style.background = '#fff'}>✓ Done</button>
                                        <button onClick={() => onDelete(r._id)} style={{ border: 'none', background: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
                                    </div>
                                </div>
                                {r.doctorName && <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}><span>📍</span> {r.doctorName}</div>}
                                {r.description && <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5, background: '#f8fafc', padding: '0.75rem 1rem', borderRadius: '8px', borderLeft: '4px solid #e2e8f0' }}>{r.description}</div>}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
