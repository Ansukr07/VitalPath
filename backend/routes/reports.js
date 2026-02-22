const express = require('express');
const router = express.Router();
const path = require('path');
const MedicalReport = require('../models/MedicalReport');
const Patient = require('../models/Patient');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const audit = require('../middleware/audit');
const { parseMedicalReport } = require('../services/llmService');

// ─── POST /api/reports/upload ─────────────────────────────────────────────
router.post(
    '/upload',
    protect,
    authorize('patient'),
    upload.single('report'),
    audit('UPLOAD_REPORT', 'MedicalReport'),
    async (req, res) => {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        const patient = await Patient.findOne({ user: req.user._id });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

        const { reportType, reportDate } = req.body;

        const report = await MedicalReport.create({
            patient: patient._id,
            uploadedBy: req.user._id,
            fileName: req.file.filename,
            originalName: req.file.originalname,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            filePath: req.file.path,
            reportType: reportType || 'other',
            reportDate: reportDate || null,
            parsedData: { parseStatus: 'pending' },
        });

        // Async: trigger LLM parsing (fire and forget — don't block response)
        triggerLLMParsing(report._id).catch((err) =>
            console.error('LLM parse error for report', report._id, err.message)
        );

        res.status(201).json({
            success: true,
            message: 'Report uploaded successfully. Parsing in progress.',
            data: {
                reportId: report._id,
                fileName: report.originalName,
                reportType: report.reportType,
                parseStatus: 'pending',
            },
        });
    }
);

// ─── GET /api/reports ─────────────────────────────────────────────────────
router.get('/', protect, async (req, res) => {
    const filter = { isDeleted: false };

    if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ user: req.user._id });
        if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });
        filter.patient = patient._id;
    } else if (req.query.patientId) {
        filter.patient = req.query.patientId;
    }

    const reports = await MedicalReport.find(filter)
        .sort({ createdAt: -1 })
        .limit(50)
        .select('-filePath');

    res.json({ success: true, data: reports });
});

// ─── GET /api/reports/:id ─────────────────────────────────────────────────
router.get('/:id', protect, async (req, res) => {
    const report = await MedicalReport.findById(req.params.id).populate('uploadedBy', 'firstName lastName');

    if (!report || report.isDeleted) {
        return res.status(404).json({ success: false, message: 'Report not found.' });
    }
    res.json({ success: true, data: report });
});

// ─── PATCH /api/reports/:id/notes ─────────────────────────────────────────
router.patch('/:id/notes', protect, authorize('doctor', 'admin'), async (req, res) => {
    const { notes } = req.body;
    const report = await MedicalReport.findByIdAndUpdate(
        req.params.id,
        { doctorNotes: notes, reviewedBy: req.user._id, reviewedAt: new Date() },
        { new: true }
    );
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, data: report });
});

// ─── DELETE /api/reports/:id ──────────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
    const report = await MedicalReport.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found.' });

    // Patients can only delete their own; doctors/admins can delete any
    if (req.user.role === 'patient') {
        const patient = await Patient.findOne({ user: req.user._id });
        if (!patient || !report.patient.equals(patient._id)) {
            return res.status(403).json({ success: false, message: 'Not authorized.' });
        }
    }

    report.isDeleted = true;
    await report.save();
    res.json({ success: true, message: 'Report deleted.' });
});

// ─── Internal: Async LLM parsing ─────────────────────────────────────────
async function triggerLLMParsing(reportId) {
    const report = await MedicalReport.findById(reportId);
    if (!report) return;

    await MedicalReport.findByIdAndUpdate(reportId, { 'parsedData.parseStatus': 'processing' });

    try {
        // In production: extract text from PDF/image using a library like pdf-parse
        // Here we pass the file metadata as a placeholder
        const placeholder = `Report type: ${report.reportType}, File: ${report.originalName}, Size: ${report.fileSize} bytes`;
        const parsed = await parseMedicalReport(placeholder);

        await MedicalReport.findByIdAndUpdate(reportId, {
            'parsedData.summary': parsed.summary || 'Summarization unavailable.',
            'parsedData.keyValues': parsed.keyValues || {},
            'parsedData.flaggedItems': parsed.flaggedItems || [],
            'parsedData.rawJson': parsed,
            'parsedData.parsedAt': new Date(),
            'parsedData.parseStatus': 'done',
        });
    } catch (err) {
        await MedicalReport.findByIdAndUpdate(reportId, {
            'parsedData.parseStatus': 'failed',
        });
        throw err;
    }
}

module.exports = router;
