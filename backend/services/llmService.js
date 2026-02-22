/**
 * LLM Integration Service
 * ─────────────────────────────────────────────────────────────────
 * SAFE USE ONLY:
 *  - Convert uploaded reports to structured JSON
 *  - Summarize patient history for doctors (decision support)
 *  - Explain medical terms in plain language for patients
 *
 * PROHIBITED:
 *  - No diagnosis
 *  - No treatment recommendations
 *  - No prescriptions
 * ─────────────────────────────────────────────────────────────────
 * Uses OpenAI-compatible API (works with OpenAI, Groq, or other providers)
 */

const axios = require('axios');

const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';
const LLM_BASE_URL = process.env.LLM_BASE_URL || 'https://api.openai.com/v1';
const LLM_TIMEOUT_MS = 30000;

/**
 * Internal function to call LLM
 */
async function callLLM(systemPrompt, userMessage, maxTokens = 800) {
    if (!LLM_API_KEY) {
        throw new Error('LLM_API_KEY not configured. Please set it in .env');
    }

    const response = await axios.post(
        `${LLM_BASE_URL}/chat/completions`,
        {
            model: LLM_MODEL,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
            max_tokens: maxTokens,
            temperature: 0.1,
        },
        {
            headers: { Authorization: `Bearer ${LLM_API_KEY}`, 'Content-Type': 'application/json' },
            timeout: LLM_TIMEOUT_MS,
        }
    );

    return response.data.choices[0].message.content.trim();
}

// ─── PROMPT 1: Parse medical report → structured JSON ─────────────────────
const REPORT_PARSE_SYSTEM_PROMPT = `
You are a medical report parser. Your ONLY job is to extract structured data from medical test reports.
You MUST NOT provide any diagnosis, treatment suggestions, or medical advice.
Return ONLY a valid JSON object with these fields:
{
  "reportType": "string (blood_test|xray|mri|ct_scan|ecg|urine_test|other)",
  "reportDate": "ISO date string or null",
  "keyValues": { "test_name": "value with unit" },
  "flaggedItems": ["item outside normal range (just state the fact, no interpretation)"],
  "summary": "One sentence describing what type of report this is and what it contains. Do NOT interpret results."
}
If you cannot parse the report, return: { "error": "Unable to parse report", "summary": "Manual review required" }
`.trim();

/**
 * Parse uploaded medical report text → structured JSON
 * @param {string} reportText - extracted text from PDF/image
 * @returns {Object} parsed structured data
 */
async function parseMedicalReport(reportText) {
    const truncated = reportText.slice(0, 4000); // avoid token limits
    const raw = await callLLM(REPORT_PARSE_SYSTEM_PROMPT, `Parse this medical report:\n\n${truncated}`, 600);
    try {
        return JSON.parse(raw);
    } catch {
        return { error: 'LLM returned invalid JSON', raw, summary: 'Manual review required' };
    }
}

// ─── PROMPT 2: Summarize patient history for doctors ─────────────────────
const PATIENT_SUMMARY_SYSTEM_PROMPT = `
You are a clinical documentation assistant. You summarize patient data for doctors.
IMPORTANT RULES:
- You are a DECISION SUPPORT tool only. Doctors make all final decisions.
- Do NOT suggest a diagnosis or treatment.
- Use clear, clinical language.
- Be concise. Maximum 200 words.
- Structure output as: Timeline | Current Symptoms | Notable Values | Points for Doctor Review
`.trim();

/**
 * Summarize patient history for doctors
 * @param {Object} patientData - symptoms, vitals, reports, triage history
 * @returns {string} clinical summary text
 */
async function summarizePatientForDoctor(patientData) {
    const prompt = `
Patient ID: ${patientData.patientId}
Recent Symptoms: ${JSON.stringify(patientData.symptoms?.slice(-3) || [])}
Latest Vitals: ${JSON.stringify(patientData.vitals || {})}
Recent Reports: ${JSON.stringify(patientData.reports?.slice(-2) || [])}
Current Triage Level: ${patientData.triageLevel || 'Unknown'}
  `.trim();

    return callLLM(PATIENT_SUMMARY_SYSTEM_PROMPT, prompt, 400);
}

// ─── PROMPT 3: Explain medical terms to patients ──────────────────────────
const PATIENT_EXPLAIN_SYSTEM_PROMPT = `
You are a healthcare literacy assistant. You help patients understand medical terms.
IMPORTANT RULES:
- Explain in simple, everyday language. Avoid jargon.
- Do NOT provide any diagnosis or treatment advice.
- Do NOT tell patients what action to take medically.
- End EVERY explanation with: "Always consult your doctor for personal medical guidance."
- Maximum 150 words.
`.trim();

/**
 * Explain a medical term to a patient in simple language
 * @param {string} term - medical term to explain
 * @returns {string} plain language explanation
 */
async function explainMedicalTerm(term) {
    return callLLM(PATIENT_EXPLAIN_SYSTEM_PROMPT, `Explain this medical term in simple language: "${term}"`, 300);
}

// ─── PROMPT 4: Generate lifestyle/diet suggestions (non-medical) ──────────
const LIFESTYLE_SYSTEM_PROMPT = `
You are a wellness and lifestyle educator. You provide general wellness information.
IMPORTANT RULES:
- Provide ONLY general wellness suggestions — not medical advice.
- These are lifestyle tips, NOT treatment or medical recommendations.
- Do NOT reference specific medications or therapies.
- Always add: "These are general wellness suggestions only, not medical advice."
- Maximum 200 words.
`.trim();

/**
 * Generate general lifestyle suggestions for a patient (non-medical)
 * @param {Object} context - age, general conditions pattern (no PII)
 * @returns {string} wellness suggestions
 */
async function getLifestyleSuggestions(context) {
    const prompt = `General wellness suggestions for a patient profile:
Age group: ${context.ageGroup || 'adult'}
Activity level: ${context.activityLevel || 'unknown'}
General concern area: ${context.concernArea || 'general wellness'}
Provide only general, non-medical lifestyle wellness suggestions.`;

    return callLLM(LIFESTYLE_SYSTEM_PROMPT, prompt, 400);
}

module.exports = {
    parseMedicalReport,
    summarizePatientForDoctor,
    explainMedicalTerm,
    getLifestyleSuggestions,
};
