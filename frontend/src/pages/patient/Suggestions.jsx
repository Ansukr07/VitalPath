import Sidebar from '../../components/Sidebar';

const SUGGESTIONS = [
    {
        category: 'Hydration & Nutrition',
        icon: '💧',
        items: [
            'Aim for 8–10 glasses of water daily to support general body function.',
            'Include a variety of colorful vegetables in your meals for micronutrient diversity.',
            'Reduce processed sugar and ultra-processed foods for general metabolic wellness.',
            'Consider smaller, more frequent meals to maintain stable energy levels.',
        ],
    },
    {
        category: 'Physical Activity',
        icon: '🏃',
        items: [
            'A 30-minute brisk walk 5 days a week supports cardiovascular health (general wellness).',
            'Stretching for 10 minutes in the morning can improve flexibility and reduce stiffness.',
            'Avoid prolonged sitting — stand or walk for a few minutes every hour.',
        ],
    },
    {
        category: 'Sleep & Rest',
        icon: '😴',
        items: [
            'Aim for 7–9 hours of sleep per night for general wellness.',
            'Maintain a consistent sleep schedule, even on weekends.',
            'Avoid screens for 30 minutes before bed to support better sleep quality.',
        ],
    },
    {
        category: 'Mental Wellness',
        icon: '🧘',
        items: [
            'Practice 10 minutes of mindful breathing or meditation daily.',
            'Engage in a hobby or creative activity at least once per week.',
            'Stay connected socially — regular interaction supports mental well-being.',
        ],
    },
    {
        category: 'Preventive Care',
        icon: '🩺',
        items: [
            'Schedule regular check-ups as advised by your doctor.',
            'Keep track of any new symptoms and discuss them at your next appointment.',
            'Stay up to date with vaccinations recommended for your age group.',
        ],
    },
];

export default function Suggestions() {
    return (
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <div className="topbar"><div className="topbar-title">Lifestyle & Wellness Suggestions</div></div>
                <div className="page-body">
                    <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                        <div>
                            <strong>🌿 General Wellness Suggestions — Not Medical Advice</strong>
                            <p style={{ marginTop: '0.3rem', fontSize: '0.85rem', opacity: 0.85 }}>
                                These are general wellness tips for a healthy lifestyle. They are <em>not</em> personalized medical recommendations, treatment plans, or dietary prescriptions. Always consult your doctor for personal medical guidance.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                        {SUGGESTIONS.map((section) => (
                            <div key={section.category} className="glass-card">
                                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{section.icon}</div>
                                <h3 style={{ fontWeight: 700, marginBottom: '1rem', color: 'var(--primary-light)' }}>{section.category}</h3>
                                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {section.items.map((item, i) => (
                                        <li key={i} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.88rem', color: 'var(--text-muted)', alignItems: 'flex-start' }}>
                                            <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }}>✦</span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="disclaimer" style={{ marginTop: '2rem' }}>
                        <strong>⚕️ Disclaimer:</strong> These suggestions are general wellness tips sourced from public health guidelines and are NOT personalized medical advice, treatment plans, or substitutes for professional healthcare. The VitalPath platform is a decision-support tool — a licensed doctor must always guide your healthcare decisions.
                    </div>
                </div>
            </div>
        </div>
    );
}
