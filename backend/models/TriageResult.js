const mongoose = require('mongoose');

const reasoningItemSchema = new mongoose.Schema(
    {
        factor: { type: String }, // e.g. "Oxygen Saturation"
        value: { type: String }, // e.g. "88%"
        threshold: { type: String }, // e.g. "< 90% = critical"
        contribution: { type: String }, // "high" | "medium" | "low"
        source: { type: String, enum: ['rule_engine', 'ml_model', 'doctor_override'] },
    },
    { _id: false }
);

const triageResultSchema = new mongoose.Schema(
    {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
        symptomLog: { type: mongoose.Schema.Types.ObjectId, ref: 'Symptom' },
        triggeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

        // Rule-based engine output
        ruleEngine: {
            priority: { type: String, enum: ['stable', 'moderate', 'high', 'critical'] },
            score: { type: Number, min: 0, max: 100 },
            reasoning: [reasoningItemSchema],
            triggeredRules: [{ type: String }],
        },

        // ML model output
        mlModel: {
            priority: { type: String, enum: ['stable', 'moderate', 'high', 'critical'] },
            probabilityMap: {
                stable: { type: Number },
                moderate: { type: Number },
                high: { type: Number },
                critical: { type: Number },
            },
            confidence: { type: Number },
            modelVersion: { type: String },
            available: { type: Boolean, default: false }, // false if ML service offline
        },

        // Final merged priority (max of rule + ML)
        finalPriority: { type: String, enum: ['stable', 'moderate', 'high', 'critical'], required: true },
        finalScore: { type: Number, min: 0, max: 100 },
        prioritySource: { type: String, enum: ['rule_engine', 'ml_model', 'tie', 'doctor_override'] },

        // Doctor override
        doctorOverride: {
            overriddenBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            originalPriority: { type: String },
            newPriority: { type: String },
            reason: { type: String },
            overriddenAt: { type: Date },
        },

        isActive: { type: Boolean, default: true },  // only latest is active
        vitalsSnapshot: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true }
);

module.exports = mongoose.model('TriageResult', triageResultSchema);
