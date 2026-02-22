import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import RiskBadge from '../../components/RiskBadge';
import { patientService } from '../../api/services';

const COMMON_SYMPTOMS = [
    'Headache', 'Chest Pain', 'Shortness of Breath', 'Fever', 'Fatigue',
    'Nausea', 'Dizziness', 'Abdominal Pain', 'Back Pain', 'Joint Pain',
    'Cough', 'Sore Throat', 'Vomiting', 'Diarrhea', 'Muscle Pain',
];

const STEPS = ['Symptoms', 'Vitals', 'Review'];

const emptySymptom = () => ({ name: '', severity: 5, duration: '1 day', frequency: 'occasional', bodyPart: '', notes: '' });

export default function SymptomForm() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [symptoms, setSymptoms] = useState([emptySymptom()]);
    const [vitals, setVitals] = useState({
        bloodPressureSystolic: '', bloodPressureDiastolic: '', heartRate: '',
        temperature: '', oxygenSaturation: '', respiratoryRate: '', bloodGlucose: '',
    });
    const [additionalNotes, setAdditionalNotes] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const addSymptom = () => setSymptoms([...symptoms, emptySymptom()]);
    const removeSymptom = (i) => setSymptoms(symptoms.filter((_, idx) => idx !== i));
    const updateSym = (i, field, val) => {
        const updated = [...symptoms];
        updated[i] = { ...updated[i], [field]: val };
        setSymptoms(updated);
    };
    const setV = (k) => (e) => setVitals({ ...vitals, [k]: e.target.value });

    const handleSubmit = async () => {
        if (symptoms.every((s) => !s.name.trim())) { setError('Please enter at least one symptom.'); return; }
        setError('');
        setLoading(true);
        try {
            const currentVitals = {};
            Object.entries(vitals).forEach(([k, v]) => { if (v) currentVitals[k] = parseFloat(v); });
            const res = await patientService.submitSymptoms({ symptoms, currentVitals: Object.keys(currentVitals).length > 0 ? currentVitals : undefined, additionalNotes });
            setResult(res.data.data.triage);
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (result) {
        const sc = { critical: 'var(--critical)', high: 'var(--high)', moderate: 'var(--moderate)', stable: 'var(--stable)' };
        return (
            <div className="app-layout">
                <Sidebar />
                <div className="main-content">
                    <div className="topbar"><div className="topbar-title">Triage Assessment Result</div></div>
                    <div className="page-body" style={{ maxWidth: 700 }}>
                        <div className="glass-card">
                            <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>
                                    {result.finalPriority === 'critical' ? '🚨' : result.finalPriority === 'high' ? '⚠️' : result.finalPriority === 'moderate' ? '🟡' : '✅'}
                                </div>
                                <h2 style={{ marginBottom: '0.5rem' }}>Decision Support Assessment</h2>
                                <RiskBadge priority={result.finalPriority} size="lg" />
                                <p style={{ marginTop: '1rem', color: 'var(--text-muted)', maxWidth: 400, margin: '1rem auto 0' }}>
                                    {result.explanation?.message}
                                </p>
                            </div>

                            {/* Score bar */}
                            <div style={{ margin: '1.5rem 0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                                    <span style={{ color: 'var(--text-muted)' }}>Support Score</span>
                                    <span style={{ color: sc[result.finalPriority], fontWeight: 700 }}>{result.finalScore}/100</span>
                                </div>
                                <div className="risk-bar-track">
                                    <div className="risk-bar-fill" style={{ width: `${result.finalScore}%`, background: sc[result.finalPriority] }} />
                                </div>
                            </div>

                            {/* Reasoning */}
                            <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Why this level</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
                                {result.ruleEngine?.reasoning?.map((r, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', padding: '0.65rem 1rem', fontSize: '0.85rem' }}>
                                        <span>{r.factor}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>{r.value}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="disclaimer">
                                <strong>⚕️ Decision Support Only — NOT a Diagnosis:</strong> This assessment was generated by a rule-based engine {result.mlAvailable ? 'and ML model' : '(ML service offline — rule-engine only)'}. It is for informational decision-support purposes. A licensed doctor must review and validate your condition. This is NOT medical advice.
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button className="btn btn-primary" onClick={() => navigate('/patient')}>Back to Dashboard</button>
                                <button className="btn btn-outline" onClick={() => { setResult(null); setStep(0); setSymptoms([emptySymptom()]); }}>
                                    Submit Another
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <div className="topbar"><div className="topbar-title">Report Symptoms</div></div>
                <div className="page-body" style={{ maxWidth: 720 }}>
                    {/* Step indicator */}
                    <div style={{ display: 'flex', gap: '0', marginBottom: '2rem' }}>
                        {STEPS.map((s, i) => (
                            <div key={s} style={{ flex: 1, textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    {i > 0 && <div style={{ flex: 1, height: 2, background: i <= step ? 'var(--primary)' : 'var(--border-light)', transition: 'background 0.3s' }} />}
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '0.85rem', margin: '0 auto', flexShrink: 0,
                                        background: i <= step ? 'var(--primary-dark)' : 'var(--bg-card2)',
                                        border: `2px solid ${i <= step ? 'var(--primary)' : 'var(--border-light)'}`,
                                        color: i <= step ? '#fff' : 'var(--text-dim)',
                                        transition: 'all 0.3s',
                                    }}>{i + 1}</div>
                                    {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? 'var(--primary)' : 'var(--border-light)', transition: 'background 0.3s' }} />}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: i === step ? 'var(--primary-light)' : 'var(--text-dim)', marginTop: '0.35rem', fontWeight: i === step ? 700 : 400 }}>{s}</div>
                            </div>
                        ))}
                    </div>

                    {error && <div className="alert alert-critical" style={{ marginBottom: '1rem' }}>⚠️ {error}</div>}

                    {/* STEP 0: Symptoms */}
                    {step === 0 && (
                        <div className="glass-card">
                            <h2 style={{ marginBottom: '1.25rem' }}>What symptoms are you experiencing?</h2>

                            {/* Quick pills */}
                            <div style={{ marginBottom: '1.25rem' }}>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Common Symptoms</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    {COMMON_SYMPTOMS.map((s) => (
                                        <button key={s} type="button"
                                            style={{ padding: '0.3rem 0.8rem', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid var(--border)', background: symptoms.some(sym => sym.name === s) ? 'rgba(167,139,250,0.15)' : 'transparent', color: symptoms.some(sym => sym.name === s) ? 'var(--primary-light)' : 'var(--text-muted)', cursor: 'pointer' }}
                                            onClick={() => { if (!symptoms.some(sym => sym.name === s)) { const last = symptoms[symptoms.length - 1]; last.name ? setSymptoms([...symptoms, { ...emptySymptom(), name: s }]) : updateSym(symptoms.length - 1, 'name', s); } }}
                                        >{s}</button>
                                    ))}
                                </div>
                            </div>

                            {symptoms.map((sym, idx) => (
                                <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Symptom {idx + 1}</div>
                                        {symptoms.length > 1 && <button type="button" onClick={() => removeSymptom(idx)} style={{ background: 'none', border: 'none', color: 'var(--critical)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>}
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">Symptom Name</label>
                                        <input className="form-input" placeholder="e.g. Chest Pain" value={sym.name} onChange={(e) => updateSym(idx, 'name', e.target.value)} />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Severity: <strong style={{ color: sym.severity >= 8 ? 'var(--critical)' : sym.severity >= 5 ? 'var(--moderate)' : 'var(--stable)' }}>{sym.severity}/10</strong></label>
                                            <input type="range" min="1" max="10" value={sym.severity} onChange={(e) => updateSym(idx, 'severity', parseInt(e.target.value))}
                                                style={{ width: '100%', accentColor: 'var(--primary)', cursor: 'pointer' }} />
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                                                <span>Mild</span><span>Moderate</span><span>Severe</span>
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Duration</label>
                                            <select className="form-input" value={sym.duration} onChange={(e) => updateSym(idx, 'duration', e.target.value)}>
                                                {['A few hours', '1 day', '2 days', '3 days', '1 week', '2 weeks', '1 month', 'More than 1 month'].map((d) => <option key={d}>{d}</option>)}
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Frequency</label>
                                            <select className="form-input" value={sym.frequency} onChange={(e) => updateSym(idx, 'frequency', e.target.value)}>
                                                <option value="constant">Constant</option>
                                                <option value="frequent">Frequent</option>
                                                <option value="occasional">Occasional</option>
                                                <option value="rare">Rare</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">Location (optional)</label>
                                            <input className="form-input" placeholder="e.g. Left chest" value={sym.bodyPart} onChange={(e) => updateSym(idx, 'bodyPart', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button type="button" className="btn btn-outline btn-sm" onClick={addSymptom}>+ Add Another Symptom</button>

                            <div style={{ marginTop: '1.5rem' }}>
                                <button className="btn btn-primary" onClick={() => setStep(1)}>Next: Vitals →</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 1: Vitals */}
                    {step === 1 && (
                        <div className="glass-card">
                            <h2 style={{ marginBottom: '0.5rem' }}>Optional: Enter Vitals</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Leave blank if you don't know. Vitals help improve triage accuracy.</p>

                            <div className="form-row">
                                {[
                                    { key: 'bloodPressureSystolic', label: 'Blood Pressure (Systolic)', unit: 'mmHg', placeholder: '120' },
                                    { key: 'bloodPressureDiastolic', label: 'Blood Pressure (Diastolic)', unit: 'mmHg', placeholder: '80' },
                                    { key: 'heartRate', label: 'Heart Rate', unit: 'bpm', placeholder: '72' },
                                    { key: 'temperature', label: 'Temperature', unit: '°C', placeholder: '37.0' },
                                    { key: 'oxygenSaturation', label: 'Oxygen Saturation (SpO₂)', unit: '%', placeholder: '98' },
                                    { key: 'respiratoryRate', label: 'Respiratory Rate', unit: 'br/min', placeholder: '16' },
                                    { key: 'bloodGlucose', label: 'Blood Glucose', unit: 'mg/dL', placeholder: '110' },
                                ].map(({ key, label, unit, placeholder }) => (
                                    <div key={key} className="form-group">
                                        <label className="form-label">{label} <span style={{ color: 'var(--text-dim)' }}>({unit})</span></label>
                                        <input className="form-input" type="number" placeholder={placeholder} value={vitals[key]} onChange={setV(key)} />
                                    </div>
                                ))}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Additional Notes</label>
                                <textarea className="form-input" rows={3} placeholder="Any other context, recent events, or concerns…" value={additionalNotes} onChange={(e) => setAdditionalNotes(e.target.value)} style={{ resize: 'vertical' }} />
                            </div>

                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button className="btn btn-outline" onClick={() => setStep(0)}>← Back</button>
                                <button className="btn btn-primary" onClick={() => setStep(2)}>Next: Review →</button>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Review */}
                    {step === 2 && (
                        <div className="glass-card">
                            <h2 style={{ marginBottom: '1.25rem' }}>Review & Submit</h2>

                            <div style={{ marginBottom: '1.25rem' }}>
                                <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Symptoms ({symptoms.filter(s => s.name).length})</h3>
                                {symptoms.filter(s => s.name).map((s, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', marginBottom: '0.4rem', fontSize: '0.88rem' }}>
                                        <span>{s.name}</span>
                                        <span style={{ color: 'var(--text-muted)' }}>Severity {s.severity}/10 · {s.frequency} · {s.duration}</span>
                                    </div>
                                ))}
                            </div>

                            {Object.values(vitals).some(v => v) && (
                                <div style={{ marginBottom: '1.25rem' }}>
                                    <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Vitals Entered</h3>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                        {Object.entries(vitals).filter(([, v]) => v).map(([k, v]) => (
                                            <span key={k} style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '0.3rem 0.65rem' }}>
                                                {k.replace(/([A-Z])/g, ' $1').trim()}: {v}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="disclaimer">
                                <strong>⚕️ Decision Support Only:</strong> Submitting this form will generate a triage assessment. This is NOT a diagnosis. A licensed doctor must always review and validate the output.
                            </div>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                                <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
                                <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                                    {loading ? 'Generating Assessment…' : '🚀 Submit for Triage'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
