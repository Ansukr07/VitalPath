import Sidebar from '../../components/Sidebar';
import './PatientDashboard.css';

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
        <div className="pd-wrapper">
            <Sidebar />
            <main className="pd-content">
                <header className="pd-page-header">
                    <h1 className="pd-page-title">Wellness Insights</h1>
                    <p className="pd-page-desc">General guidance for maintaining a healthy lifestyle. These suggestions are for informational purposes only.</p>
                </header>

                <div style={{ background: '#f0f9ff', border: '1px solid #e0f2fe', borderRadius: '16px', padding: '1.5rem', marginBottom: '2.5rem', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{ fontSize: '2rem' }}>🌿</div>
                    <div>
                        <strong style={{ color: '#0369a1', fontSize: '1.1rem', display: 'block', marginBottom: '0.25rem' }}>General Wellness Guidelines</strong>
                        <p style={{ color: '#0c4a6e', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            These tips are derived from public health guidelines. They are <em>not</em> prescriptions or personalized medical advice. Always consult your healthcare provider for clinical guidance.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
                    {SUGGESTIONS.map((section) => (
                        <div key={section.category} className="pd-section-card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ fontSize: '2.5rem' }}>{section.icon}</div>
                                <h3 style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--pd-text)' }}>{section.category}</h3>
                            </div>
                            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {section.items.map((item, i) => (
                                    <li key={i} style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem', color: '#475569', alignItems: 'flex-start', lineHeight: 1.5 }}>
                                        <span style={{ color: 'var(--pd-accent)', fontWeight: 800, marginTop: '2px' }}>✦</span>
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: '3rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem', fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>
                    <strong>⚕️ Medical Disclaimer:</strong> These suggestions are general wellness tips and are NOT personalized medical advice or substitutes for professional healthcare. The VitalPath platform is a decision-support tool — a licensed physician must always guide your healthcare decisions.
                </div>
            </main>
        </div>
    );
}
