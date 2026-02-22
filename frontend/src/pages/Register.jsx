import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/services';
import './Auth.css';

export default function Register() {
    const [role, setRole] = useState('patient');
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', phone: '', licenseNumber: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
        setLoading(true);
        try {
            const res = await authService.register({ ...form, role });
            const { accessToken, refreshToken, user } = res.data.data;
            login(user, { accessToken, refreshToken });
            navigate(user.role === 'patient' ? '/patient' : '/doctor');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-container">
                {/* ── Left Side: Form ── */}
                <div className="auth-left-panel">
                    <div className="auth-brand-icon">
                        <div className="auth-brand-mark">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="#000">
                                <path d="M12 2L4.5 20.29L5.21 21L12 18L18.79 21L19.5 20.29L12 2Z" />
                            </svg>
                        </div>
                    </div>

                    <h1 className="auth-main-title">Create Account</h1>
                    <p className="auth-main-desc">
                        Join VitalPath today. Professional decision support for modern clinical environments.
                    </p>

                    {/* Role selection row */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', maxWidth: '400px' }}>
                        <button
                            type="button"
                            className={`auth-tag ${role === 'patient' ? 'active' : ''}`}
                            style={{
                                flex: 1,
                                cursor: 'pointer',
                                border: '1px solid transparent',
                                borderColor: role === 'patient' ? '#d4f01e' : 'rgba(255,255,255,0.05)',
                                background: role === 'patient' ? 'rgba(212,240,30,0.1)' : '#111',
                                color: role === 'patient' ? '#d4f01e' : '#888'
                            }}
                            onClick={() => setRole('patient')}
                        >
                            Patient
                        </button>
                        <button
                            type="button"
                            className={`auth-tag ${role === 'doctor' ? 'active' : ''}`}
                            style={{
                                flex: 1,
                                cursor: 'pointer',
                                border: '1px solid transparent',
                                borderColor: role === 'doctor' ? '#d4f01e' : 'rgba(255,255,255,0.05)',
                                background: role === 'doctor' ? 'rgba(212,240,30,0.1)' : '#111',
                                color: role === 'doctor' ? '#d4f01e' : '#888'
                            }}
                            onClick={() => setRole('doctor')}
                        >
                            Doctor
                        </button>
                    </div>

                    {error && (
                        <div className="alert alert-critical" style={{ marginBottom: '1.5rem', maxWidth: '400px' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="auth-form" style={{ maxWidth: '440px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="auth-input-group">
                                <label className="auth-input-label">First Name</label>
                                <input
                                    className="auth-field"
                                    placeholder="Jane"
                                    value={form.firstName}
                                    onChange={set('firstName')}
                                    required
                                />
                            </div>
                            <div className="auth-input-group">
                                <label className="auth-input-label">Last Name</label>
                                <input
                                    className="auth-field"
                                    placeholder="Doe"
                                    value={form.lastName}
                                    onChange={set('lastName')}
                                    required
                                />
                            </div>
                        </div>

                        <div className="auth-input-group">
                            <label className="auth-input-label">Email</label>
                            <input
                                className="auth-field"
                                type="email"
                                placeholder="name@example.com"
                                value={form.email}
                                onChange={set('email')}
                                required
                            />
                        </div>

                        {role === 'doctor' && (
                            <div className="auth-input-group">
                                <label className="auth-input-label">Medical License</label>
                                <input
                                    className="auth-field"
                                    placeholder="MH-2024-XXXXX"
                                    value={form.licenseNumber}
                                    onChange={set('licenseNumber')}
                                    required
                                />
                            </div>
                        )}

                        <div className="auth-input-group">
                            <label className="auth-input-label">Password</label>
                            <input
                                className="auth-field"
                                type="password"
                                placeholder="Min 8 characters"
                                value={form.password}
                                onChange={set('password')}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="auth-submit-btn"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : `Sign up as ${role === 'patient' ? 'Patient' : 'Doctor'}`}
                        </button>
                    </form>

                    <div className="auth-panel-footer">
                        Already have an account? <Link to="/login">Sign in</Link>
                    </div>
                </div>

                {/* ── Right Side: Visual ── */}
                <div className="auth-right-panel">
                    <div className="auth-visual-card">
                        <div className="auth-visual-bg"></div>

                        <div className="auth-tag-row">
                            <span className="auth-tag">Global Clinical Support</span>
                            <span className="auth-tag">HIPAA Compliant</span>
                        </div>

                        <div className="auth-testimonial-box">
                            <p className="auth-testimonial-text">
                                "The level of precision in VitalPath's triage engine is unmatched. It has become an essential part of my daily practice."
                            </p>
                            <span className="auth-author-name">Dr. Michael Chen</span>
                            <span className="auth-author-title">Senior Consultant, St. Jude Medical</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
