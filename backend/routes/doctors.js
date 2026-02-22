const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Symptom = require('../models/Symptom');
const TriageResult = require('../models/TriageResult');
const MedicalReport = require('../models/MedicalReport');
const { protect, authorize } = require('../middleware/auth');
const audit = require('../middleware/audit');
const { summarizePatientForDoctor } = require('../services/llmService');

// ─── GET /api/doctors/me ──────────────────────────────────────────────────
router.get('/me', protect, authorize('doctor'), async (req, res) => {
    const doctor = await Doctor.findOne({ user: req.user._id }).populate('user', 'firstName lastName email phone');
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });
    res.json({ success: true, data: doctor });
});

// ─── PATCH /api/doctors/me ────────────────────────────────────────────────
router.patch('/me', protect, authorize('doctor'), async (req, res) => {
    const { specializations, qualifications, hospitalAffiliation, department, yearsOfExperience, bio } = req.body;
    const doctor = await Doctor.findOne({ user: req.user._id });
    if (!doctor) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

    if (specializations) doctor.specializations = specializations;
    if (qualifications) doctor.qualifications = qualifications;
    if (hospitalAffiliation) doctor.hospitalAffiliation = hospitalAffiliation;
    if (department) doctor.department = department;
    if (yearsOfExperience) doctor.yearsOfExperience = yearsOfExperience;
    if (bio) doctor.bio = bio;

    await doctor.save();
    res.json({ success: true, data: doctor });
});

// ─── GET /api/doctors/queue ────────────────────────────────────────────────
// Get priority-sorted patient queue
router.get('/queue', protect, authorize('doctor'), async (req, res) => {
    const priorityOrder = { critical: 0, high: 1, moderate: 2, stable: 3, unknown: 4 };

    const patients = await Patient.find({})
        .populate('user', 'firstName lastName email phone')
        .select('user triageStatus lastTriageAt latestVitals assignedDoctors');

    const sorted = patients.sort((a, b) => {
        const aRank = priorityOrder[a.triageStatus] ?? 4;
        const bRank = priorityOrder[b.triageStatus] ?? 4;
        return aRank - bRank;
    });

    res.json({ success: true, data: sorted });
});

// ─── GET /api/doctors/patients/:patientId ─────────────────────────────────
router.get('/patients/:patientId', protect, authorize('doctor', 'admin'), async (req, res) => {
    const patient = await Patient.findById(req.params.patientId)
        .populate('user', 'firstName lastName email phone createdAt')
        .populate('assignedDoctors');

    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    // Fetch recent data
    const [symptoms, triageHistory, reports] = await Promise.all([
        Symptom.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(5),
        TriageResult.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(5),
        MedicalReport.find({ patient: patient._id, isDeleted: false }).sort({ createdAt: -1 }).limit(5),
    ]);

    res.json({
        success: true,
        data: {
            patient,
            recentSymptoms: symptoms,
            triageHistory,
            reports,
        },
    });
});

// ─── GET /api/doctors/patients/:patientId/summary ─────────────────────────
// LLM-generated patient summary for doctors
router.get('/patients/:patientId/summary', protect, authorize('doctor', 'admin'), async (req, res) => {
    const patient = await Patient.findById(req.params.patientId).populate('user', 'firstName lastName');
    if (!patient) return res.status(404).json({ success: false, message: 'Patient not found.' });

    const [symptoms, reports, triage] = await Promise.all([
        Symptom.find({ patient: patient._id }).sort({ createdAt: -1 }).limit(3).lean(),
        MedicalReport.find({ patient: patient._id, isDeleted: false }).sort({ createdAt: -1 }).limit(2).lean(),
        TriageResult.findOne({ patient: patient._id, isActive: true }).lean(),
    ]);

    try {
        const summary = await summarizePatientForDoctor({
            patientId: patient._id,
            symptoms: symptoms.map((s) => ({ symptoms: s.symptoms, vitals: s.currentVitals, date: s.createdAt })),
            vitals: patient.latestVitals,
            reports: reports.map((r) => ({ type: r.reportType, summary: r.parsedData?.summary, date: r.reportDate })),
            triageLevel: triage?.finalPriority,
        });

        res.json({
            success: true,
            data: {
                summary,
                disclaimer: '[AI-Generated Summary — Decision Support Only. Doctor verification required.]',
                generatedAt: new Date().toISOString(),
            },
        });
    } catch (err) {
        res.status(503).json({ success: false, message: 'LLM service unavailable: ' + err.message });
    }
});

// ─── POST /api/doctors/patients/:patientId/override ───────────────────────
// Doctor overrides triage priority
router.post(
    '/patients/:patientId/override',
    protect,
    authorize('doctor'),
    audit('OVERRIDE_TRIAGE', 'TriageResult'),
    async (req, res) => {
        const { newPriority, reason } = req.body;

        if (!newPriority || !reason) {
            return res.status(400).json({ success: false, message: 'New priority and reason are required.' });
        }

        const triage = await TriageResult.findOne({ patient: req.params.patientId, isActive: true });
        if (!triage) return res.status(404).json({ success: false, message: 'No active triage found for patient.' });

        triage.doctorOverride = {
            overriddenBy: req.user._id,
            originalPriority: triage.finalPriority,
            newPriority,
            reason,
            overriddenAt: new Date(),
        };
        triage.finalPriority = newPriority;
        triage.prioritySource = 'doctor_override';

        await triage.save();

        // Update patient's status
        await Patient.findByIdAndUpdate(req.params.patientId, { triageStatus: newPriority });

        res.json({
            success: true,
            message: 'Triage priority overridden by doctor.',
            data: triage,
        });
    }
);

// ─── GET /api/doctors/alerts ──────────────────────────────────────────────
// High-risk / critical patients needing attention
router.get('/alerts', protect, authorize('doctor', 'admin'), async (req, res) => {
    const criticalPatients = await Patient.find({
        triageStatus: { $in: ['critical', 'high'] },
    })
        .populate('user', 'firstName lastName email phone')
        .sort({ lastTriageAt: -1 })
        .limit(20);

    res.json({
        success: true,
        data: criticalPatients,
        count: criticalPatients.length,
        message: criticalPatients.length > 0
            ? `${criticalPatients.length} patient(s) require urgent attention.`
            : 'No high-priority alerts at this time.',
    });
});

module.exports = router;
