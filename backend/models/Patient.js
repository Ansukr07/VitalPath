const mongoose = require('mongoose');

const vitalSchema = new mongoose.Schema(
    {
        bloodPressureSystolic: { type: Number },   // mmHg
        bloodPressureDiastolic: { type: Number },   // mmHg
        heartRate: { type: Number },   // bpm
        temperature: { type: Number },   // Celsius
        oxygenSaturation: { type: Number },   // %
        respiratoryRate: { type: Number },   // breaths/min
        bloodGlucose: { type: Number },   // mg/dL
        weight: { type: Number },   // kg
        height: { type: Number },   // cm
        recordedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const patientSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        dateOfBirth: { type: Date },
        gender: { type: String, enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
        bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'] },
        allergies: [{ type: String }],
        conditions: [{ type: String }],     // existing known conditions (entered by patient)
        medications: [{ type: String }],     // current medications (entered by patient)
        emergencyContact: {
            name: { type: String },
            relationship: { type: String },
            phone: { type: String },
        },
        address: {
            line1: { type: String },
            city: { type: String },
            state: { type: String },
            country: { type: String, default: 'India' },
            pincode: { type: String },
        },
        latestVitals: vitalSchema,
        vitalHistory: [vitalSchema],
        assignedDoctors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' }],
        triageStatus: {
            type: String,
            enum: ['stable', 'moderate', 'high', 'critical', 'unknown'],
            default: 'unknown',
        },
        lastTriageAt: { type: Date },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
