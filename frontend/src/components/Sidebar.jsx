import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PATIENT_LINKS = [
    { icon: '🏠', label: 'Overview', path: '/patient', id: 'overview' },
    { icon: '🩺', label: 'Symptoms', path: '/patient/symptoms', id: 'symptoms' },
    { icon: '📄', label: 'Reports', path: '/patient/reports', id: 'reports' },
    { icon: '🌿', label: 'Suggestions', path: '/patient/suggestions', id: 'suggestions' },
    { icon: '🔔', label: 'Reminders', path: '/patient/reminders', id: 'reminders' },
    { icon: '👤', label: 'Profile', path: '/patient/profile', id: 'profile' },
];

const DOCTOR_LINKS = [
    { icon: '🏥', label: 'Dashboard', path: '/doctor', id: 'dashboard' },
    { icon: '🚨', label: 'Alerts', path: '/doctor#alerts', id: 'alerts' },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const links = user?.role === 'doctor' || user?.role === 'admin' ? DOCTOR_LINKS : PATIENT_LINKS;
    const initials = user ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}` : '?';

    // Check if we are using the new Patient Dashboard redesign
    const isPatient = user?.role === 'patient';

    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <aside
            className={`${isPatient ? "pd-sidebar" : "sidebar"} ${isExpanded ? 'expanded' : ''}`}
            onMouseEnter={() => isPatient && setIsExpanded(true)}
            onMouseLeave={() => isPatient && setIsExpanded(false)}
        >
            {isPatient ? (
                <>
                    <div className="pd-logo" style={{ background: '#3b82f6', color: '#fff' }}>💙</div>

                    <nav className="pd-nav-list">
                        {links.map((link) => (
                            <div
                                key={link.path}
                                className={`pd-nav-link ${location.pathname === link.path ? 'active' : ''}`}
                                onClick={() => navigate(link.path)}
                                title={!isExpanded ? link.label : ''}
                            >
                                <span style={{ fontSize: '1.25rem' }}>{link.icon}</span>
                                <span className="pd-nav-label">{link.label}</span>
                            </div>
                        ))}
                    </nav>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: 'auto', width: '100%' }}>
                        <div className="pd-nav-link" title={!isExpanded ? "Help" : ""}>
                            <span style={{ fontSize: '1.25rem' }}>❓</span>
                            <span className="pd-nav-label">Help</span>
                        </div>
                        <div className="pd-nav-link" title={!isExpanded ? "Theme" : ""}>
                            <span style={{ fontSize: '1.25rem' }}>🏳️</span>
                            <span className="pd-nav-label">Theme</span>
                        </div>
                        <div className="pd-nav-link" title={!isExpanded ? "Logout" : ""} onClick={() => { logout(); navigate('/login'); }} style={{ color: '#ef4444' }}>
                            <span style={{ fontSize: '1.25rem' }}>🚪</span>
                            <span className="pd-nav-label">Logout</span>
                        </div>
                    </div>
                </>
            ) : (
                <>
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
                </>
            )}
        </aside>
    );
}
