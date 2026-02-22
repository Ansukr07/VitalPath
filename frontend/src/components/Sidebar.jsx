import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PATIENT_LINKS = [
    { icon: '🏠', label: 'Overview', path: '/patient' },
    { icon: '🩺', label: 'Symptoms', path: '/patient/symptoms' },
    { icon: '📄', label: 'Reports', path: '/patient/reports' },
    { icon: '🌿', label: 'Suggestions', path: '/patient/suggestions' },
    { icon: '🔔', label: 'Reminders', path: '/patient/reminders' },
    { icon: '👤', label: 'Profile', path: '/patient/profile' },
];

const DOCTOR_LINKS = [
    { icon: '🏥', label: 'Dashboard', path: '/doctor' },
    { icon: '🚨', label: 'Alerts', path: '/doctor#alerts' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const links = user?.role === 'doctor' || user?.role === 'admin' ? DOCTOR_LINKS : PATIENT_LINKS;
    const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : '?';

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                VitalPath
                <span>Healthcare Decision Support</span>
            </div>

            <nav className="sidebar-nav">
                {links.map((link) => (
                    <button
                        key={link.path}
                        className={`nav-item ${location.pathname === link.path ? 'active' : ''}`}
                        onClick={() => navigate(link.path)}
                    >
                        <span className="icon">{link.icon}</span>
                        {link.label}
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <div className="user-chip">
                    <div className="user-avatar">{initials}</div>
                    <div>
                        <div className="user-name">{user?.firstName} {user?.lastName}</div>
                        <div className="user-role">{user?.role}</div>
                    </div>
                </div>
                <button
                    className="btn btn-outline btn-sm"
                    style={{ width: '100%', marginTop: '0.75rem', borderRadius: '8px' }}
                    onClick={() => { logout(); navigate('/login'); }}
                >
                    Sign out
                </button>
            </div>
        </aside>
    );
}
