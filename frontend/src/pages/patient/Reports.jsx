import { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Sidebar from '../../components/Sidebar';
import { reportService } from '../../api/services';

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
            setSuccess('Report uploaded! Parsing in progress…');
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
        <div className="app-layout">
            <Sidebar />
            <div className="main-content">
                <div className="topbar"><div className="topbar-title">Medical Reports</div></div>
                <div className="page-body">
                    {error && <div className="alert alert-critical">{error}</div>}
                    {success && <div className="alert alert-success">✅ {success}</div>}

                    {/* Upload area */}
                    <div className="glass-card" style={{ marginBottom: '1.5rem' }}>
                        <h2 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Upload Medical Report</h2>

                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                            <div className="form-group" style={{ flex: 1, minWidth: 180, margin: 0 }}>
                                <label className="form-label">Report Type</label>
                                <select className="form-input" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                                    {REPORT_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: 1, minWidth: 180, margin: 0 }}>
                                <label className="form-label">Report Date (optional)</label>
                                <input className="form-input" type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
                            </div>
                        </div>

                        <div {...getRootProps()} style={{
                            border: `2px dashed ${isDragActive ? 'var(--primary)' : 'var(--border)'}`,
                            borderRadius: '12px', padding: '2.5rem', textAlign: 'center', cursor: 'pointer',
                            background: isDragActive ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.02)',
                            transition: 'all 0.2s',
                        }}>
                            <input {...getInputProps()} />
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{uploading ? '⏳' : '📁'}</div>
                            <p style={{ fontWeight: 600, marginBottom: '0.3rem' }}>
                                {uploading ? 'Uploading…' : isDragActive ? 'Drop here' : 'Drag & drop or click to upload'}
                            </p>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>PDF, PNG, JPG, WEBP — Max 10MB</p>
                        </div>
                    </div>

                    {/* Reports list */}
                    <h2 className="section-heading">Your Reports ({reports.length})</h2>

                    {loading ? <div className="spinner" /> : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {reports.length === 0 && (
                                <div className="glass-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No reports uploaded yet.
                                </div>
                            )}
                            {reports.map((r) => (
                                <div key={r._id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', cursor: 'pointer' }}
                                    onClick={() => setSelected(selected?._id === r._id ? null : r)}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                                            📄 {r.originalName}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                            <span>{r.reportType?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                                            <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                                            <span className={`badge badge-${r.parsedData?.parseStatus === 'done' ? 'stable' : r.parsedData?.parseStatus === 'failed' ? 'critical' : 'moderate'}`}>
                                                🔍 {r.parsedData?.parseStatus || 'pending'}
                                            </span>
                                        </div>

                                        {/* Parsed summary */}
                                        {selected?._id === r._id && r.parsedData?.summary && (
                                            <div style={{ marginTop: '1rem', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '8px', padding: '0.9rem' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--primary-light)', fontWeight: 700, marginBottom: '0.35rem', textTransform: 'uppercase' }}>AI Summary (Non-Medical)</div>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{r.parsedData.summary}</p>
                                                {r.parsedData.flaggedItems?.length > 0 && (
                                                    <div style={{ marginTop: '0.75rem' }}>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--high)', fontWeight: 700, marginBottom: '0.35rem' }}>FLAGGED ITEMS</div>
                                                        {r.parsedData.flaggedItems.map((item, i) => (
                                                            <div key={i} style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>• {item}</div>
                                                        ))}
                                                    </div>
                                                )}
                                                <div className="disclaimer" style={{ marginTop: '0.75rem' }}>
                                                    <strong>⚕️ AI-Parsed Summary — Not a Diagnosis.</strong> Always consult your doctor for interpretation.
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <button className="btn btn-danger btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(r._id); }}>Delete</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
