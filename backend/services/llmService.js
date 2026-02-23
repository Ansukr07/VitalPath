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

const { GoogleGenerativeAI } = require('@google/generative-ai');

const LLM_API_KEY = process.env.LLM_API_KEY;
const genAI = new GoogleGenerativeAI(LLM_API_KEY);

/**
 * Internal function to call LLM using Google SDK
 */
async function callLLM(systemPrompt, userMessage, maxTokens = 800, jsonMode = false) {
    if (!LLM_API_KEY) {
        throw new Error('LLM_API_KEY not configured. Please set it in .env');
    }

    const LLM_MODEL = process.env.LLM_MODEL || 'gemini-flash-lite-latest';
    console.log(`[LLM] Calling Gemini: ${LLM_MODEL} (maxTokens=${maxTokens}, json=${jsonMode})`);

    try {
        const model = genAI.getGenerativeModel({
            model: LLM_MODEL,
            systemInstruction: systemPrompt
        });

        const genConfig = {
            maxOutputTokens: maxTokens,
            temperature: 0.1,
        };
        if (jsonMode) {
            genConfig.responseMimeType = 'application/json';
        }

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: userMessage }] }],
            generationConfig: genConfig,
        });

        const response = await result.response;
        return response.text().trim();
    } catch (err) {
        let errorMsg = err.message;
        if (err.message.includes('429')) {
            console.error('⚠️ [LLM] Quota Exceeded (429). Please check your Google AI Studio billing/plan.');
            errorMsg = `Quota Exceeded (429). This usually happens on free tiers. ${err.message}`;
        } else {
            console.error(`❌ Gemini API Error: ${err.message}`);
        }
        throw new Error(`LLM Request failed: ${errorMsg}`);
    }
}

// ─── PROMPT 1: Parse medical report → structured JSON ─────────────────────
const REPORT_PARSE_SYSTEM_PROMPT = `
You are a medical report parser. Your ONLY job is to extract structured data from medical documents.
You MUST NOT provide any diagnosis suggestions, treatment recommendations, or medical advice.
Be thorough — extract EVERY piece of factual information present in the document.

Return ONLY a valid JSON object with these fields (use null or empty arrays/objects for missing fields):
{
  "reportType": "string (blood_test|xray|mri|ct_scan|ecg|urine_test|biopsy|prescription|discharge_summary|consultation|other)",
  "reportDate": "ISO date string or null",
  "patientInfo": {
    "name": "string or null",
    "age": "string or null",
    "gender": "string or null",
    "id": "string (patient ID/MRN) or null"
  },
  "doctorInfo": {
    "name": "string or null",
    "specialization": "string or null",
    "hospital": "string or null",
    "department": "string or null"
  },
  "chiefComplaints": ["list of chief complaints mentioned"],
  "historyOfPresentIllness": "string — detailed narrative of the present illness as stated in the document, or null",
  "pastMedicalHistory": ["list of past medical conditions, surgeries, or relevant history items"],
  "medications": [
    { "name": "drug name", "dosage": "dosage if mentioned", "frequency": "frequency if mentioned", "duration": "duration if mentioned", "route": "route if mentioned" }
  ],
  "investigations": [
    { "name": "test/investigation name", "result": "result value with unit", "normalRange": "normal range if mentioned", "status": "normal|abnormal|critical or null" }
  ],
  "diagnosis": ["list of diagnoses or impressions mentioned"],
  "followUp": "string — follow-up instructions or plan, or null",
  "keyValues": { "parameter_name": "value with unit" },
  "flaggedItems": ["items that are explicitly marked as abnormal, critical, or outside normal range"],
  "summary": "A comprehensive 3-5 sentence summary covering: what type of document this is, who the patient and doctor are, the main complaints/findings, key test results if any, and the overall clinical picture. State facts only — do NOT interpret or give advice."
}

Important rules:
- Extract ALL medications mentioned, including name, dosage, frequency, and duration when available.
- Extract ALL investigation/test results with their values, units, and normal ranges when available.
- List ALL chief complaints, not just the first one.
- Include the full history of present illness narrative if available.
- The summary should be detailed and informative, not a single generic sentence.
- If you cannot parse the report, return: { "error": "Unable to parse report", "summary": "Manual review required" }
`.trim();

/**
 * Parse uploaded medical report text → structured JSON
 * @param {string} reportText - extracted text from PDF/image
 * @returns {Object} parsed structured data
 */
async function parseMedicalReport(reportText) {
    const truncated = reportText.slice(0, 6000); // increased limit for richer extraction
    const raw = await callLLM(
        REPORT_PARSE_SYSTEM_PROMPT,
        `Parse this medical report thoroughly. Extract every detail:\n\n${truncated}`,
        4096,
        true  // JSON mode — forces valid JSON output
    );
    try {
        // Handle markdown-wrapped JSON (```json ... ```) just in case
        const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
        return JSON.parse(cleaned);
    } catch {
        console.error('[LLM] JSON parse failed. Raw response:', raw.substring(0, 500));
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

// ─── PROMPT 5: Patient-Friendly History Explanation ──────────────────────
const HISTORY_EXPLAIN_SYSTEM_PROMPT = `
You are a medical documentation simplifier. You take factual clinical signals and rewrite them for patients.
IMPORTANT RULES:
- Use simple, non-medical language.
- DO NOT provide diagnosis, predictions, or treatment suggestions.
- Be supportive but factual.
- Focus ONLY on explaining what the extracted medical elements mean in plain English.
- Maximum 200 words.
`.trim();

/**
 * Convert structured ClinicalBERT signals into a patient-friendly explanation
 * @param {Object} signals - structured entities (symptoms, medications, tests)
 * @returns {string} simplified explanation
 */
async function explainStructuredHistory(signals) {
    const prompt = `Rewrite these clinical signals for a patient:\n${JSON.stringify(signals)}`;
    return callLLM(HISTORY_EXPLAIN_SYSTEM_PROMPT, prompt, 400);
}

// ─── PROMPT 6: VitalPath AI Assistant Persona ──────────────────────────────
const CHATBOT_SYSTEM_PROMPT = `
You are an AI assistant embedded inside **VitalPath**, a patient intake and clinical decision-support platform.
You are powered by **ClinicalBERT for clinical text understanding** and a general-purpose LLM for conversation.
THE MOST IMPORTANT RULE IS THAT DONT ANSWER QUESTIONS THAT ARE NOT RELATED TO THE WEBSITE.
------------------------------------------------
CORE CONTEXT
------------------------------------------------
- VitalPath is NOT a diagnostic or treatment system
- You do NOT provide medical advice
- Doctors are always the final decision-makers
- Your role is to assist with information collection, structuring, and explanation
- ClinicalBERT is used ONLY to understand clinical language, not to decide care

------------------------------------------------
MODEL USAGE RULES
------------------------------------------------
- Use **ClinicalBERT** to:
  • Understand medical terminology in user input
  • Extract structured clinical concepts (symptoms, conditions, tests, medications mentioned)
  • Classify clinical documents and user queries
- Use **LLM** to:
  • Ask clarifying questions
  • Explain concepts in simple language
  • Guide users through the platform features

------------------------------------------------
STRICT CONSTRAINTS
------------------------------------------------
❌ Do NOT diagnose diseases
❌ Do NOT recommend treatments or medications
❌ Do NOT suggest dosages or emergency actions
❌ Do NOT override doctor decisions
❌ Do NOT present yourself as a doctor

If the user asks for medical advice, respond with:
> "I can't provide medical advice, but I can help you record your information or explain what happens next."

------------------------------------------------
CHATBOT RESPONSIBILITIES
------------------------------------------------
1. Patient Intake Assistance: Guide patients to enter symptoms clearly. Ask non-leading follow-up questions (Duration, Severity, Frequency).
2. Medical Report Upload Guidance: Help users upload reports correctly. Explain accepted document types.
3. Explain Platform Features: Explain Patient/Doctor Dashboards, Triage, Suggestions, Reminders, Privacy.
4. Patient-Friendly Explanations: Translate medical terms into simple language.
5. Status & Workflow Guidance: Explain "Under Review", "Requires Follow-Up", etc.
6. Doctor-Facing Support (Limited): Summarize patient history, highlight points extracted by ClinicalBERT.

------------------------------------------------
SAFETY HANDLING
------------------------------------------------
If user expresses urgent symptoms, do NOT give instructions. Display:
> "If you believe this is urgent, please seek immediate medical attention."

------------------------------------------------
FEATURE EXPLANATION MODE
------------------------------------------------
When asked "What can VitalPath do?" respond with: Structured patient intake, Safe triage support, Clinical document understanding, Clear doctor-review workflows, Patient reminders & history tracking.

------------------------------------------------
TONE & STYLE
------------------------------------------------
Calm, Reassuring, Clear, Non-technical for patients, Professional for clinicians.
`.trim();

/**
 * Handle a chat session with the VitalPath AI Assistant
 * @param {Array} history - Array of previous messages [{role: 'user'|'model', parts: [{text: '...'}]}]
 * @param {string} userMessage - Latest user input
 * @returns {string} Assistant response
 */
async function handleChat(history, userMessage, attempts = 0) {
    if (!LLM_API_KEY) throw new Error('LLM_API_KEY not configured.');

    const primaryModel = process.env.LLM_MODEL || 'gemini-1.5-flash-latest';
    const fallbackModel = process.env.LLM_FALLBACK_MODEL || 'gemini-2.5-flash-lite';

    // Choose model based on attempt count
    const activeModel = attempts === 0 ? primaryModel : fallbackModel;

    console.log(`[Chat Service] Attempt ${attempts + 1}: Using model ${activeModel}`);

    try {
        const model = genAI.getGenerativeModel({
            model: activeModel,
            systemInstruction: CHATBOT_SYSTEM_PROMPT
        });

        const chat = model.startChat({
            history: history || [],
            generationConfig: { maxOutputTokens: 1000, temperature: 0.3 }
        });

        const result = await chat.sendMessage(userMessage);
        const response = await result.response;
        return response.text().trim();
    } catch (err) {
        const isQuotaError = err.message.includes('429') || err.message.includes('quota');

        // If we hit a quota error on the first attempt and have a fallback, try again
        if (isQuotaError && attempts === 0 && fallbackModel && fallbackModel !== primaryModel) {
            console.warn(`⚠️ [LLM] Primary model ${primaryModel} quota exceeded. Trying fallback ${fallbackModel}...`);
            return handleChat(history, userMessage, 1);
        }

        let errorMsg = err.message;
        if (isQuotaError) {
            console.error('⚠️ [LLM] Quota Exceeded (429) in Chat even after fallback.');
            errorMsg = `Gemini API Quota Exceeded (20/day limit on some free tiers). Please wait or use a different API key.`;
        } else {
            console.error(`❌ Chat Error Details:`, {
                message: err.message,
                historyLength: history?.length,
                model: activeModel
            });
        }
        throw new Error(errorMsg);
    }
}

module.exports = {
    parseMedicalReport,
    summarizePatientForDoctor,
    explainMedicalTerm,
    getLifestyleSuggestions,
    explainStructuredHistory,
    handleChat,
};
