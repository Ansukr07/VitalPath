import api from './axios';

// ── Auth ────────────────────────────────────────────────────────────────────
export const authService = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => {
        const rf = localStorage.getItem('refreshToken');
        localStorage.clear();
        return api.post('/auth/logout', { refreshToken: rf });
    },
};

// ── Patients ────────────────────────────────────────────────────────────────
export const patientService = {
    getProfile: () => api.get('/patients/me'),
    updateProfile: (data) => api.patch('/patients/me', data),
    submitSymptoms: (data) => api.post('/patients/symptoms', data),
    getSymptomHistory: () => api.get('/patients/symptoms'),
    getTriageHistory: () => api.get('/patients/triage/history'),
    getClinicalInsights: (text) => api.post('/patients/clinical-insights', { text }),
};

// ── Doctors ─────────────────────────────────────────────────────────────────
export const doctorService = {
    getProfile: () => api.get('/doctors/me'),
    updateProfile: (d) => api.patch('/doctors/me', d),
    getQueue: () => api.get('/doctors/queue'),
    getPatientDetail: (id) => api.get(`/doctors/patients/${id}`),
    getPatientSummary: (id) => api.get(`/doctors/patients/${id}/summary`),
    overrideTriage: (id, d) => api.post(`/doctors/patients/${id}/override`, d),
    getAlerts: () => api.get('/doctors/alerts'),
    getSimilarity: (id) => api.get(`/doctors/patients/${id}/similarity`),
};

// ── Reports ─────────────────────────────────────────────────────────────────
export const reportService = {
    upload: (formData) => api.post('/reports/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
    list: (params) => api.get('/reports', { params }),
    getById: (id) => api.get(`/reports/${id}`),
    addNotes: (id, n) => api.patch(`/reports/${id}/notes`, { notes: n }),
    delete: (id) => api.delete(`/reports/${id}`),
};

// ── Reminders ────────────────────────────────────────────────────────────────
export const reminderService = {
    list: (params) => api.get('/reminders', { params }),
    create: (data) => api.post('/reminders', data),
    update: (id, d) => api.patch(`/reminders/${id}`, d),
    delete: (id) => api.delete(`/reminders/${id}`),
};

// ── Triage ───────────────────────────────────────────────────────────────────
export const triageService = {
    getLatest: (patientId) => api.get(`/triage/${patientId}/latest`),
    getHistory: (patientId) => api.get(`/triage/${patientId}/history`),
};
