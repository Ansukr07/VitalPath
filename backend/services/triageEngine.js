/**
 * Rule-Based Triage Engine
 * ─────────────────────────────────────────────────────────────────
 * This engine applies hard threshold rules on vitals and symptoms.
 * Output: { priority, score, reasoning, triggeredRules }
 *
 * Priority levels: 'stable' | 'moderate' | 'high' | 'critical'
 * Score: 0–100 (higher = more urgent)
 *
 * IMPORTANT: This is a decision-SUPPORT tool only.
 * A licensed doctor must always review and validate results.
 * ─────────────────────────────────────────────────────────────────
 */

// ─── Vital Sign Thresholds ────────────────────────────────────────────────
const VITAL_RULES = [
    // Oxygen Saturation
    {
        factor: 'Oxygen Saturation (SpO₂)', field: 'oxygenSaturation', unit: '%',
        rules: [
            { condition: (v) => v < 90, priority: 'critical', score: 95, label: '< 90% — severe hypoxemia' },
            { condition: (v) => v >= 90 && v < 94, priority: 'high', score: 70, label: '90–93% — moderate hypoxemia' },
            { condition: (v) => v >= 94 && v < 96, priority: 'moderate', score: 40, label: '94–95% — borderline low' },
        ],
    },
    // Heart Rate
    {
        factor: 'Heart Rate', field: 'heartRate', unit: 'bpm',
        rules: [
            { condition: (v) => v > 150, priority: 'critical', score: 90, label: '> 150 bpm — severe tachycardia' },
            { condition: (v) => v < 40, priority: 'critical', score: 90, label: '< 40 bpm — severe bradycardia' },
            { condition: (v) => v > 120 && v <= 150, priority: 'high', score: 65, label: '120–150 bpm — tachycardia' },
            { condition: (v) => v >= 40 && v < 50, priority: 'high', score: 65, label: '40–50 bpm — bradycardia' },
            {
                condition: (v) => (v > 100 && v <= 120) || (v >= 50 && v < 60),
                priority: 'moderate', score: 35, label: 'borderline heart rate'
            },
        ],
    },
    // Blood Pressure Systolic
    {
        factor: 'Blood Pressure (Systolic)', field: 'bloodPressureSystolic', unit: 'mmHg',
        rules: [
            { condition: (v) => v >= 180, priority: 'critical', score: 92, label: '≥ 180 mmHg — hypertensive crisis' },
            { condition: (v) => v < 80, priority: 'critical', score: 92, label: '< 80 mmHg — hypotensive shock' },
            { condition: (v) => v >= 160 && v < 180, priority: 'high', score: 68, label: '160–179 mmHg — stage 2 hypertension' },
            { condition: (v) => v >= 80 && v < 90, priority: 'high', score: 68, label: '80–89 mmHg — hypotension' },
            { condition: (v) => v >= 140 && v < 160, priority: 'moderate', score: 38, label: '140–159 mmHg — stage 1 hypertension' },
        ],
    },
    // Temperature
    {
        factor: 'Temperature', field: 'temperature', unit: '°C',
        rules: [
            { condition: (v) => v >= 40, priority: 'critical', score: 88, label: '≥ 40°C — hyperpyrexia' },
            { condition: (v) => v < 35, priority: 'critical', score: 88, label: '< 35°C — hypothermia' },
            { condition: (v) => v >= 39 && v < 40, priority: 'high', score: 62, label: '39–39.9°C — high fever' },
            { condition: (v) => v >= 38 && v < 39, priority: 'moderate', score: 35, label: '38–38.9°C — moderate fever' },
        ],
    },
    // Respiratory Rate
    {
        factor: 'Respiratory Rate', field: 'respiratoryRate', unit: 'breaths/min',
        rules: [
            { condition: (v) => v > 30 || v < 8, priority: 'critical', score: 88, label: 'severely abnormal respiratory rate' },
            { condition: (v) => v > 25 && v <= 30, priority: 'high', score: 65, label: '25–30 breaths/min — elevated' },
            { condition: (v) => v >= 8 && v < 12, priority: 'moderate', score: 35, label: '8–11 breaths/min — low-normal' },
        ],
    },
    // Blood Glucose
    {
        factor: 'Blood Glucose', field: 'bloodGlucose', unit: 'mg/dL',
        rules: [
            { condition: (v) => v > 400, priority: 'critical', score: 86, label: '> 400 mg/dL — severe hyperglycemia' },
            { condition: (v) => v < 50, priority: 'critical', score: 90, label: '< 50 mg/dL — severe hypoglycemia' },
            { condition: (v) => v > 250 && v <= 400, priority: 'high', score: 62, label: '250–400 mg/dL — high blood glucose' },
            { condition: (v) => v >= 50 && v < 70, priority: 'high', score: 62, label: '50–69 mg/dL — hypoglycemia' },
        ],
    },
];

// ─── Symptom Rules ────────────────────────────────────────────────────────
const CRITICAL_SYMPTOMS = [
    'chest pain', 'chest tightness', 'difficulty breathing', 'shortness of breath',
    'loss of consciousness', 'unconscious', 'seizure', 'stroke', 'paralysis',
    'severe bleeding', 'coughing blood', 'vomiting blood', 'severe head injury',
];

const HIGH_SYMPTOMS = [
    'severe abdominal pain', 'severe headache', 'sudden vision loss', 'sudden weakness',
    'high fever', 'persistent vomiting', 'signs of infection', 'severe allergic reaction',
    'fainting', 'dizziness', 'confusion', 'slurred speech',
];

const MODERATE_SYMPTOMS = [
    'nausea', 'vomiting', 'diarrhea', 'moderate pain', 'persistent cough',
    'ear pain', 'sore throat', 'urinary pain', 'joint pain', 'rash', 'swelling',
];

// ─── Priority Ordering ────────────────────────────────────────────────────
const PRIORITY_RANK = { stable: 0, moderate: 1, high: 2, critical: 3 };
const RANK_TO_PRIORITY = ['stable', 'moderate', 'high', 'critical'];

/**
 * Main triage function
 * @param {Object} vitals - vital sign values
 * @param {Array}  symptoms - array of { name, severity (1-10), durationDays, frequency }
 * @returns {{ priority, score, reasoning, triggeredRules }}
 */
function runTriageEngine(vitals = {}, symptoms = []) {
    const reasoning = [];
    const triggeredRules = [];
    let maxPriorityRank = 0;
    let maxScore = 0;

    // ─── Check vitals ──────────────────────────────────────────────
    for (const vitalDef of VITAL_RULES) {
        const value = vitals[vitalDef.field];
        if (value === undefined || value === null) continue;

        for (const rule of vitalDef.rules) {
            if (rule.condition(value)) {
                const rank = PRIORITY_RANK[rule.priority];
                if (rank >= maxPriorityRank) maxPriorityRank = rank;
                if (rule.score > maxScore) maxScore = rule.score;

                reasoning.push({
                    factor: vitalDef.factor,
                    value: `${value} ${vitalDef.unit}`,
                    threshold: rule.label,
                    contribution: rank >= 2 ? 'high' : 'medium',
                    source: 'rule_engine',
                });
                triggeredRules.push(`${vitalDef.factor}: ${rule.label}`);
                break; // only worst rule per vital
            }
        }
    }

    // ─── Check symptoms ────────────────────────────────────────────
    for (const symptom of symptoms) {
        const nameLower = symptom.name.toLowerCase();
        let symPriority = 'stable';
        let symScore = 0;

        if (CRITICAL_SYMPTOMS.some((s) => nameLower.includes(s))) {
            symPriority = 'critical'; symScore = 90;
        } else if (HIGH_SYMPTOMS.some((s) => nameLower.includes(s))) {
            symPriority = 'high'; symScore = 65;
        } else if (MODERATE_SYMPTOMS.some((s) => nameLower.includes(s))) {
            symPriority = 'moderate'; symScore = 35;
        }

        // Severity modifier (1-10 scale)
        if (symptom.severity >= 8) {
            symScore = Math.min(100, symScore + 15);
            if (PRIORITY_RANK[symPriority] < PRIORITY_RANK['high']) symPriority = 'high';
        } else if (symptom.severity >= 6) {
            symScore = Math.min(100, symScore + 8);
        }

        // Duration modifier
        if (symptom.durationDays && symptom.durationDays <= 1 && PRIORITY_RANK[symPriority] >= 1) {
            // Acute onset of moderate+ symptoms = escalate
            symScore = Math.min(100, symScore + 10);
        }

        // Frequency modifier
        if (symptom.frequency === 'constant' && PRIORITY_RANK[symPriority] >= 1) {
            symScore = Math.min(100, symScore + 5);
        }

        const rank = PRIORITY_RANK[symPriority];
        if (rank > 0) {
            if (rank >= maxPriorityRank) maxPriorityRank = rank;
            if (symScore > maxScore) maxScore = symScore;

            reasoning.push({
                factor: `Symptom: ${symptom.name}`,
                value: `Severity ${symptom.severity}/10, ${symptom.frequency}`,
                threshold: `Classified as ${symPriority}`,
                contribution: rank >= 2 ? 'high' : 'medium',
                source: 'rule_engine',
            });
            triggeredRules.push(`Symptom "${symptom.name}" — ${symPriority}`);
        }
    }

    const finalPriority = RANK_TO_PRIORITY[maxPriorityRank];

    // If no rules triggered
    if (reasoning.length === 0) {
        reasoning.push({
            factor: 'Overall Assessment',
            value: 'All values within normal range',
            threshold: 'No critical thresholds exceeded',
            contribution: 'low',
            source: 'rule_engine',
        });
        triggeredRules.push('No critical rules triggered');
    }

    return {
        priority: finalPriority,
        score: maxScore || 10,
        reasoning,
        triggeredRules,
    };
}

/**
 * Merge rule-engine and ML outputs → choose higher severity
 */
function mergePriorities(ruleResult, mlResult) {
    const ruleRank = PRIORITY_RANK[ruleResult.priority] ?? 0;
    const mlRank = mlResult?.available ? (PRIORITY_RANK[mlResult.priority] ?? 0) : -1;

    if (!mlResult?.available) {
        return { finalPriority: ruleResult.priority, finalScore: ruleResult.score, source: 'rule_engine' };
    }

    if (ruleRank > mlRank) {
        return { finalPriority: ruleResult.priority, finalScore: ruleResult.score, source: 'rule_engine' };
    } else if (mlRank > ruleRank) {
        return { finalPriority: mlResult.priority, finalScore: Math.round(mlResult.probabilityMap[mlResult.priority] * 100), source: 'ml_model' };
    } else {
        return {
            finalPriority: RANK_TO_PRIORITY[ruleRank],
            finalScore: Math.max(ruleResult.score, Math.round((mlResult.probabilityMap[mlResult.priority] || 0) * 100)),
            source: 'tie',
        };
    }
}

module.exports = { runTriageEngine, mergePriorities, PRIORITY_RANK };
