import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { patientService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';

export default function PatientProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [form, setForm] = useState({});
    const [vitals, setVitals] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        patientService.getProfile().then(res => {
            const p = res.data.data;
            setProfile(p);
            setForm({
                dateOfBirth: p.dateOfBirth?.split('T')[0] || '',
                gender: p.gender || '',
                bloodType: p.bloodType || '',
                allergies: (p.allergies || []).join(', '),
                conditions: (p.conditions || []).join(', '),
                medications: (p.medications || []).join(', '),
                emergencyName: p.emergencyContact?.name || '',
                emergencyPhone: p.emergencyContact?.phone || '',
                emergencyRelationship: p.emergencyContact?.relationship || '',
                city: p.address?.city || '',
                state: p.address?.state || '',
            });
            if (p.latestVitals) {
                const { bloodPressureSystolic, bloodPressureDiastolic, heartRate, temperature, oxygenSaturation, respiratoryRate, bloodGlucose, weight, height } = p.latestVitals;
                setVitals({ bloodPressureSystolic: bloodPressureSystolic || '', bloodPressureDiastolic: bloodPressureDiastolic || '', heartRate: heartRate || '', temperature: temperature || '', oxygenSaturation: oxygenSaturation || '', respiratoryRate: respiratoryRate || '', bloodGlucose: bloodGlucose || '', weight: weight || '', height: height || '' });
            }
        }).catch(() => setError('Could not load profile.'))
            .finally(() => setLoading(false));
    }, []);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    const setV = (k) => (e) => setVitals({ ...vitals, [k]: e.target.value });

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true); setError(''); setSuccess('');
        try {
            const payload = {
                dateOfBirth: form.dateOfBirth || undefined,
                gender: form.gender || undefined,
                bloodType: form.bloodType || undefined,
                allergies: form.allergies ? form.allergies.split(',').map(s => s.trim()).filter(Boolean) : [],
                conditions: form.conditions ? form.conditions.split(',').map(s => s.trim()).filter(Boolean) : [],
                medications: form.medications ? form.medications.split(',').map(s => s.trim()).filter(Boolean) : [],
                emergencyContact: { name: form.emergencyName, phone: form.emergencyPhone, relationship: form.emergencyRelationship },
                address: { city: form.city, state: form.state },
            };
            // Add vitals if any provided
            const v = {};
            Object.entries(vitals).forEach(([k, val]) => { if (val) v[k] = parseFloat(val); });
            if (Object.keys(v).length > 0) payload.latestVitals = v;

            await patientService.updateProfile(payload);
            setSuccess('Profile updated successfully!');
        } catch (err) { setError(err.response?.data?.message || 'Update failed.'); }
        finally { setSaving(false); }
    };

    if (loading) return <div className="app-layout"><Sidebar /><div className="main-content"><div className="spinner" /></div></div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <div className="topbar">
                    <div className="topbar-title">My Profile</div>
                </div>
                <div className="page-body" style={{ maxWidth: 720 }}>
                    {error && <div className="alert alert-critical">{error}</div>}
                    {success && <div className="alert alert-success">✅ {success}</div>}

                    {/* Identity card */}
                    <div className="glass-card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-dark), var(--primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800, flexShrink: 0 }}>
                            {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{user.firstName} {user.lastName}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</div>
                            <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '0.2rem' }}>Role: Patient</div>
                        </div>
                    </div>

                    <form onSubmit={handleSave}>
                        {/* Basic Info */}
                        <h2 className="section-heading">Basic Information</h2>
                        <div className="glass-card" style={{ marginBottom: '1.25rem' }}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Date of Birth</label>
                                    <input className="form-input" type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Gender</label>
                                    <select className="form-input" value={form.gender} onChange={set('gender')}>
                                        <option value="">Select</option>
                                        {['male', 'female', 'other', 'prefer_not_to_say'].map(g => <option key={g} value={g}>{g.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Blood Type</label>
                                    <select className="form-input" value={form.bloodType} onChange={set('bloodType')}>
                                        <option value="">Unknown</option>
                                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">City</label>
                                    <input className="form-input" placeholder="Mumbai" value={form.city} onChange={set('city')} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Known Allergies <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(comma separated)</span></label>
                                <input className="form-input" placeholder="Penicillin, Shellfish…" value={form.allergies} onChange={set('allergies')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Existing Conditions <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(comma separated)</span></label>
                                <input className="form-input" placeholder="Hypertension, Diabetes…" value={form.conditions} onChange={set('conditions')} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Current Medications <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>(comma separated)</span></label>
                                <input className="form-input" placeholder="Metformin 500mg, Atorvastatin…" value={form.medications} onChange={set('medications')} />
                            </div>
                        </div>

                        {/* Vitals */}
                        <h2 className="section-heading">Update Vitals</h2>
                        <div className="glass-card" style={{ marginBottom: '1.25rem' }}>
                            <div className="form-row">
                                {[
                                    { k: 'bloodPressureSystolic', label: 'BP Systolic', unit: 'mmHg', ph: '120' },
                                    { k: 'bloodPressureDiastolic', label: 'BP Diastolic', unit: 'mmHg', ph: '80' },
                                    { k: 'heartRate', label: 'Heart Rate', unit: 'bpm', ph: '72' },
                                    { k: 'temperature', label: 'Temperature', unit: '°C', ph: '37.0' },
                                    { k: 'oxygenSaturation', label: 'SpO₂', unit: '%', ph: '98' },
                                    { k: 'weight', label: 'Weight', unit: 'kg', ph: '70' },
                                    { k: 'height', label: 'Height', unit: 'cm', ph: '170' },
                                ].map(({ k, label, unit, ph }) => (
                                    <div key={k} className="form-group">
                                        <label className="form-label">{label} <span style={{ color: 'var(--text-dim)', fontWeight: 400 }}>({unit})</span></label>
                                        <input className="form-input" type="number" placeholder={ph} value={vitals[k]} onChange={setV(k)} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Emergency Contact */}
                        <h2 className="section-heading">Emergency Contact</h2>
                        <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Contact Name</label>
                                    <input className="form-input" placeholder="Jane Doe" value={form.emergencyName} onChange={set('emergencyName')} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Relationship</label>
                                    <input className="form-input" placeholder="Spouse, Parent…" value={form.emergencyRelationship} onChange={set('emergencyRelationship')} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Phone</label>
                                    <input className="form-input" placeholder="+91 98765 43210" value={form.emergencyPhone} onChange={set('emergencyPhone')} />
                                </div>
                            </div>
                        </div>

                        <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                            {saving ? 'Saving…' : '💾 Save Profile'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
