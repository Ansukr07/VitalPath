import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { reminderService } from '../../api/services';

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
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <div className="topbar">
                    <div className="topbar-title">Reminders</div>
                    <div className="topbar-actions">
                        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
                            {showForm ? '✕ Cancel' : '+ New Reminder'}
                        </button>
                    </div>
                </div>

                <div className="page-body">
                    {error && <div className="alert alert-critical">{error}</div>}

                    {/* Add reminder form */}
                    {showForm && (
                        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>New Reminder</h3>
                            <form onSubmit={handleCreate}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Title</label>
                                        <input className="form-input" placeholder="e.g. Blood test at Apollo" value={form.title} onChange={set('title')} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select className="form-input" value={form.type} onChange={set('type')}>
                                            {Object.keys(TYPE_ICONS).map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Date & Time</label>
                                        <input className="form-input" type="datetime-local" value={form.scheduledAt} onChange={set('scheduledAt')} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Doctor/Location (optional)</label>
                                        <input className="form-input" placeholder="Dr. Sharma, City Hospital" value={form.doctorName} onChange={set('doctorName')} />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Notes (optional)</label>
                                    <input className="form-input" placeholder="Fasting required, bring previous reports…" value={form.description} onChange={set('description')} />
                                </div>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save Reminder'}</button>
                            </form>
                        </div>
                    )}

                    {/* Overdue */}
                    {overdue.length > 0 && (
                        <>
                            <h2 className="section-heading" style={{ color: 'var(--high)' }}>⚠️ Overdue ({overdue.length})</h2>
                            <ReminderList items={overdue} onDone={handleMarkDone} onDelete={handleDelete} />
                        </>
                    )}

                    {/* Upcoming */}
                    <h2 className="section-heading">Upcoming ({upcoming.length})</h2>
                    {loading ? <div className="spinner" /> : upcoming.length === 0 ? (
                        <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                            No upcoming reminders. Add one above!
                        </div>
                    ) : (
                        <ReminderList items={upcoming} onDone={handleMarkDone} onDelete={handleDelete} />
                    )}
                </div>
            </div>
        </div>
    );
}

function ReminderList({ items, onDone, onDelete }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {items.map((r) => {
                const d = new Date(r.scheduledAt);
                const isToday = d.toDateString() === new Date().toDateString();
                return (
                    <div key={r._id} className="glass-card" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', borderColor: isToday ? 'rgba(167,139,250,0.4)' : 'var(--glass-border)' }}>
                        <div style={{ fontSize: '2rem', flexShrink: 0 }}>{TYPE_ICONS[r.type] || '🔔'}</div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, marginBottom: '0.2rem' }}>{r.title}</div>
                            <div style={{ fontSize: '0.82rem', color: isToday ? 'var(--primary-light)' : 'var(--text-muted)', fontWeight: isToday ? 700 : 400 }}>
                                📅 {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {isToday && <span style={{ marginLeft: '0.5rem', background: 'rgba(167,139,250,0.15)', padding: '2px 8px', borderRadius: '20px', fontSize: '0.7rem' }}>TODAY</span>}
                            </div>
                            {r.doctorName && <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>👨‍⚕️ {r.doctorName}</div>}
                            {r.description && <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>{r.description}</div>}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => onDone(r._id)}>✓ Done</button>
                            <button className="btn btn-danger btn-sm" onClick={() => onDelete(r._id)}>✕</button>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
