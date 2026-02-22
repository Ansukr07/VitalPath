import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../api/services';

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
        <div className="auth-page">
            <div style={{
                position: 'absolute', width: 500, height: 500, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)',
                bottom: '0', right: '50%', pointerEvents: 'none',
            }} />

            <div className="auth-card" style={{ maxWidth: '520px' }}>
                <div className="auth-logo">VitalPath</div>
                <h1 className="auth-title">Create Account</h1>
                <p className="auth-sub">Join the healthcare decision-support platform</p>

                {/* Role selection */}
                <div className="role-pills">
                    {['patient', 'doctor'].map((r) => (
                        <button key={r} className={`role-pill ${role === r ? 'active' : ''}`} type="button" onClick={() => setRole(r)}>
                            {r === 'patient' ? '🏥 Patient' : '👨‍⚕️ Doctor'}
                        </button>
                    ))}
                </div>

                {error && <div className="alert alert-critical">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">First Name</label>
                            <input className="form-input" placeholder="Jane" value={form.firstName} onChange={set('firstName')} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Last Name</label>
                            <input className="form-input" placeholder="Doe" value={form.lastName} onChange={set('lastName')} required />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <input className="form-input" type="email" placeholder="name@example.com" value={form.email} onChange={set('email')} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Phone (optional)</label>
                        <input className="form-input" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={set('phone')} />
                    </div>

                    {role === 'doctor' && (
                        <div className="form-group">
                            <label className="form-label">Medical License Number</label>
                            <input className="form-input" placeholder="MH-2024-XXXXX" value={form.licenseNumber} onChange={set('licenseNumber')} />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input className="form-input" type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} required />
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
                        {loading ? 'Creating account…' : `Register as ${role === 'patient' ? 'Patient' : 'Doctor'} →`}
                    </button>
                </form>

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </div>
            </div>
        </div>
    );
}
