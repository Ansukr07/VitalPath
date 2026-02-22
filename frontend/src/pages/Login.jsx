import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/services';

export default function Login() {
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await authService.login(form);
            const { accessToken, refreshToken, user } = res.data.data;
            login(user, { accessToken, refreshToken });
            navigate(user.role === 'patient' ? '/patient' : '/doctor');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>

            {/* ── Fullscreen hero video ── */}
            <video
                autoPlay
                loop
                muted
                playsInline
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 0,
                    filter: 'brightness(0.35) saturate(1.2)',
                }}
            >
                <source src="/hand.mp4" type="video/mp4" />
            </video>

            {/* ── Gradient overlay ── */}
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(10,10,20,0.6) 0%, rgba(124,58,237,0.15) 50%, rgba(10,10,20,0.7) 100%)',
                zIndex: 1,
            }} />

            {/* ── Brand mark (top-left) ── */}
            <div style={{
                position: 'absolute',
                top: '2rem',
                left: '2.5rem',
                zIndex: 3,
                fontSize: '1.4rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: 'rgba(255,255,255,0.9)',
                textShadow: '0 2px 12px rgba(0,0,0,0.5)',
            }}>
                VitalPath
            </div>

            {/* ── Hero tagline (left panel, desktop) ── */}
            <div style={{
                position: 'absolute',
                left: '4rem',
                bottom: '4rem',
                zIndex: 3,
                maxWidth: 420,
            }}>
                <h1 style={{
                    fontSize: 'clamp(1.6rem, 3vw, 2.8rem)',
                    fontWeight: 900,
                    lineHeight: 1.18,
                    letterSpacing: '-0.03em',
                    color: '#fff',
                    textShadow: '0 4px 24px rgba(0,0,0,0.6)',
                    marginBottom: '0.75rem',
                }}>
                    Healthcare<br />
                    <span style={{ color: 'var(--primary-light)' }}>decision support</span><br />
                    for every patient.
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: 340 }}>
                    Rule-based triage · ML-assisted scoring · Doctor-first override. Every output reviewed by a licensed professional.
                </p>
            </div>

            {/* ── Login card ── */}
            <div style={{
                position: 'relative',
                zIndex: 4,
                width: '100%',
                maxWidth: 440,
                margin: '0 auto',
                padding: '0 1rem',
                /* Push card to right on wider screens */
            }}>
                <div style={{
                    background: 'rgba(12, 12, 22, 0.82)',
                    backdropFilter: 'blur(24px)',
                    WebkitBackdropFilter: 'blur(24px)',
                    border: '1px solid rgba(167, 139, 250, 0.2)',
                    borderRadius: '20px',
                    padding: '2.5rem 2rem',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
                }}>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
                        Welcome back
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
                        Sign in to your healthcare platform
                    </p>

                    {error && (
                        <div className="alert alert-critical" style={{ marginBottom: '1rem', fontSize: '0.84rem' }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                                className="form-input"
                                type="email"
                                placeholder="name@example.com"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Password</label>
                            <input
                                className="form-input"
                                type="password"
                                placeholder="••••••••"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', marginTop: '0.5rem' }}
                            disabled={loading}
                        >
                            {loading ? 'Signing in…' : 'Sign In →'}
                        </button>
                    </form>

                    {/* Quick demo fill */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ flex: 1, borderRadius: '8px', fontSize: '0.75rem' }}
                            onClick={() => setForm({ email: 'patient@demo.com', password: 'Demo@1234' })}
                        >
                            🏥 Fill Patient Demo
                        </button>
                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ flex: 1, borderRadius: '8px', fontSize: '0.75rem' }}
                            onClick={() => setForm({ email: 'doctor@demo.com', password: 'Demo@1234' })}
                        >
                            👨‍⚕️ Fill Doctor Demo
                        </button>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                        Don't have an account?{' '}
                        <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
                            Create account
                        </Link>
                    </div>

                    <div style={{
                        fontSize: '0.72rem',
                        color: 'rgba(255,255,255,0.3)',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '8px',
                        padding: '0.6rem 0.9rem',
                        marginTop: '1.25rem',
                        fontStyle: 'italic',
                        lineHeight: 1.5,
                    }}>
                        <strong style={{ color: 'rgba(255,255,255,0.45)' }}>⚕️ Decision Support Only:</strong> All
                        outputs are for clinical decision-support and must be reviewed by a licensed doctor. Not a diagnostic tool.
                    </div>
                </div>
            </div>
        </div>
    );
}
