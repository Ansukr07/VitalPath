import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Sidebar from '../../components/Sidebar';
import { reportService } from '../../api/services';
import './PatientDashboard.css';

const REPORT_TYPES = ['blood_test', 'xray', 'mri', 'ct_scan', 'ecg', 'urine_test', 'biopsy', 'prescription', 'discharge_summary', 'other'];

export default function Reports() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [reportType, setReportType] = useState('other');
    const [reportDate, setReportDate] = useState('');
    const [selected, setSelected] = useState(null);

    const fetchReports = async () => {
        try {
            const res = await reportService.list();
            setReports(res.data.data);
        } catch { setError('Unable to load reports.'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchReports(); }, []);

    const onDrop = useCallback(async (acceptedFiles) => {
        if (!acceptedFiles.length) return;
        const file = acceptedFiles[0];
        setUploading(true); setError(''); setSuccess('');
        try {
            const fd = new FormData();
            fd.append('report', file);
            fd.append('reportType', reportType);
            if (reportDate) fd.append('reportDate', reportDate);
            await reportService.upload(fd);
            setSuccess('Report uploaded! Our AI engine is parsing your document.');
            fetchReports();
        } catch (err) {
            setError(err.response?.data?.message || 'Upload failed.');
        } finally { setUploading(false); }
    }, [reportType, reportDate]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop, accept: { 'application/pdf': ['.pdf'], 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }, maxFiles: 1,
    });

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this report?')) return;
        try { await reportService.delete(id); setReports(reports.filter(r => r._id !== id)); }
        catch { setError('Delete failed.'); }
    };

    return (
        <div className="pd-wrapper">
            <Sidebar />
            <main className="pd-content">
                <header className="pd-page-header">
                    <h1 className="pd-page-title">Medical Documents</h1>
                    <p className="pd-page-desc">Securely upload and manage your medical records. Our AI engine automatically extracts key information for your care team.</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '2.5rem' }}>
                    {/* Left Column: Upload */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="pd-section-card">
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>Upload Record</h2>

                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Document Type</label>
                                <select className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', borderRadius: '12px', padding: '0 1rem' }} value={reportType} onChange={(e) => setReportType(e.target.value)}>
                                    {REPORT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label className="pd-app-role" style={{ marginBottom: '0.5rem', display: 'block' }}>Date (optional)</label>
                                <input className="pd-urgent-btn" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', width: '100%', borderRadius: '12px', padding: '0 1rem', textAlign: 'left' }} type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
                            </div>

                            <div {...getRootProps()} style={{
                                border: `2px dashed ${isDragActive ? 'var(--pd-accent)' : '#e2e8f0'}`,
                                borderRadius: '24px', padding: '2.5rem 1.5rem', textAlign: 'center', cursor: 'pointer',
                                background: isDragActive ? '#f0f9ff' : '#f8fafc',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative'
                            }}>
                                <input {...getInputProps()} />
                                <div style={{ fontSize: '3rem', marginBottom: '1rem', filter: uploading ? 'grayscale(1)' : 'none' }}>{uploading ? '⏳' : '📥'}</div>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.5rem', color: isDragActive ? 'var(--pd-accent)' : 'inherit' }}>
                                    {uploading ? 'Processing...' : isDragActive ? 'Drop File' : 'Drop file or click'}
                                </h3>
                                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>PDF or Images up to 10MB</p>
                            </div>

                            {error && <div style={{ background: '#fee2e2', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: '12px', marginTop: '1.5rem', border: '1px solid #fecaca', fontSize: '0.85rem' }}>⚠️ {error}</div>}
                            {success && <div style={{ background: '#dcfce7', color: '#166534', padding: '0.75rem 1rem', borderRadius: '12px', marginTop: '1.5rem', border: '#bbf7d0', fontSize: '0.85rem' }}>✅ {success}</div>}
                        </div>
                    </div>

                    {/* Right Column: List & Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Vault History
                            <span style={{ fontSize: '0.9rem', color: 'var(--pd-text-muted)', fontWeight: 500 }}>{reports.length} records</span>
                        </h2>

                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}><div className="spinner" /></div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {reports.length === 0 && (
                                    <div className="pd-section-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>📂</div>
                                        <p style={{ color: 'var(--pd-text-muted)', fontWeight: 600 }}>No documents found in your vault.</p>
                                    </div>
                                )}
                                {reports.map((r) => (
                                    <div key={r._id}
                                        className="pd-section-card"
                                        style={{ padding: '1.5rem', cursor: 'pointer', transition: 'all 0.2s', border: selected?._id === r._id ? '2px solid var(--pd-accent)' : '1px solid var(--pd-border)' }}
                                        onClick={() => setSelected(selected?._id === r._id ? null : r)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                                <div style={{ width: 48, height: 48, borderRadius: '12px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                                                    {r.reportType === 'blood_test' ? '🧪' : r.reportType === 'xray' ? '🩻' : '📄'}
                                                </div>
                                                <div>
                                                    <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>{r.originalName}</h3>
                                                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                                                        <span style={{ textTransform: 'uppercase' }}>{r.reportType?.replace(/_/g, ' ')}</span>
                                                        <span>•</span>
                                                        <span>{new Date(r.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                                <span style={{
                                                    padding: '0.4rem 0.75rem', borderRadius: '30px', fontSize: '0.7rem', fontWeight: 800,
                                                    background: r.parsedData?.parseStatus === 'done' ? '#dcfce7' : '#fef3c7',
                                                    color: r.parsedData?.parseStatus === 'done' ? '#166534' : '#92400e'
                                                }}>
                                                    {r.parsedData?.parseStatus === 'done' ? 'PARSED' : 'PENDING'}
                                                </span>
                                                <button onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '1.1rem' }}>🗑️</button>
                                            </div>
                                        </div>

                                        {selected?._id === r._id && (
                                            <div className="fade-in" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                                                {r.parsedData?.summary ? (
                                                    <>
                                                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--pd-accent)', marginBottom: '0.75rem' }}>AI Insight Summary</h4>
                                                        <p style={{ fontSize: '0.9rem', color: '#475569', lineHeight: 1.6, marginBottom: '1.5rem' }}>{r.parsedData.summary}</p>

                                                        {r.parsedData.flaggedItems?.length > 0 && (
                                                            <div style={{ marginBottom: '1.5rem' }}>
                                                                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: '#ef4444', marginBottom: '0.75rem' }}>Flagged Items</h4>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                                                    {r.parsedData.flaggedItems.map((item, i) => (
                                                                        <span key={i} style={{ background: '#fee2e2', color: '#991b1b', padding: '0.35rem 0.75rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600 }}>{item}</span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', border: '1px solid #f1f5f9', marginBottom: '1.5rem' }}>
                                                            Note: This summary is generated via automated analysis. Please review the full document with your physician for clinical interpretation.
                                                        </div>

                                                        {/* ClinicalBERT Structured Entities */}
                                                        {r.clinicalEntities && (
                                                            <div style={{ marginTop: '1.5rem', background: 'rgba(59, 130, 246, 0.03)', padding: '1.25rem', borderRadius: '16px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                                                                <h4 style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', color: '#1e40af', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                                    <span style={{ fontSize: '1.2rem' }}>🧬</span> ClinicalBERT Extraction
                                                                </h4>

                                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: '0.25rem' }}>DOC TYPE</div>
                                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{r.bertClassification?.docType || 'General'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: '0.25rem' }}>CONSULTATION</div>
                                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1e293b' }}>{r.bertClassification?.consultationType || 'Routine'}</div>
                                                                    </div>
                                                                </div>

                                                                <div style={{ marginTop: '1rem' }}>
                                                                    <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: '0.5rem' }}>EXTRACTED SYMPTOMS & MEDICATIONS</div>
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                                                        {r.clinicalEntities.symptoms?.map((s, i) => <span key={i} style={{ fontSize: '0.75rem', background: '#eff6ff', color: '#3b82f6', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{s}</span>)}
                                                                        {r.clinicalEntities.medications?.map((m, i) => <span key={i} style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#10b981', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>{m}</span>)}
                                                                        {(!r.clinicalEntities.symptoms?.length && !r.clinicalEntities.medications?.length) && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>No clinical entities identified.</span>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', padding: '1rem' }}>Parsing is in progress. Check back soon for AI insights.</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
