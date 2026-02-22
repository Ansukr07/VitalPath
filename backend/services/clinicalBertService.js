const axios = require('axios');

/**
 * ClinicalBERT Integration Service
 * ─────────────────────────────────────────────────────────────────
 * This service acts as a bridge to the Python-based ClinicalBERT 
 * microservice (running on port 8001).
 * 
 * SAFE USE ONLY:
 * - Extraction of clinical entities (symptoms, medications, tests)
 * - Classification of medical document types
 * - Generation of clinical embeddings for similarity/risk logic
 * 
 * PROHIBITED:
 * - No diagnostic claims
 * - No treatment recommendations
 * ─────────────────────────────────────────────────────────────────
 */

const BERT_SERVICE_URL = process.env.BERT_SERVICE_URL || 'http://localhost:8001';
const BERT_TIMEOUT_MS = 15000; // 15s for heavy ML tasks
const OCR_TIMEOUT_MS = 60000; // 60s for OCR tasks

/**
 * Extract clinical entities from text
 */
async function extractEntities(text) {
    try {
        const response = await axios.post(`${BERT_SERVICE_URL}/extract`, { text }, {
            timeout: BERT_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' },
        });
        return { available: true, ...response.data };
    } catch (err) {
        console.warn('⚠️  ClinicalBERT extraction unavailable.', err.message);
        return { available: false, symptoms: [], conditions: [], medications: [], tests: [] };
    }
}

/**
 * Extract clinical entities via OCR from a file
 */
async function extractEntitiesOCR(filePath) {
    try {
        const response = await axios.post(`${BERT_SERVICE_URL}/extract_ocr`, { file_path: filePath }, {
            timeout: OCR_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' },
        });
        return { available: true, ...response.data };
    } catch (err) {
        console.warn('⚠️  ClinicalBERT OCR extraction unavailable.', err.message);
        return { available: false, symptoms: [], conditions: [], medications: [], tests: [] };
    }
}

/**
 * Classify medical document type
 */
async function classifyDocument(text) {
    try {
        const response = await axios.post(`${BERT_SERVICE_URL}/classify`, { text }, {
            timeout: BERT_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' },
        });
        return { available: true, ...response.data };
    } catch (err) {
        console.warn('⚠️  ClinicalBERT classification unavailable.', err.message);
        return { available: false, doc_type: 'unknown', consultation_type: 'routine', confidence: 0 };
    }
}

/**
 * Generate clinical embeddings for text
 */
async function getClinicalEmbeddings(text) {
    try {
        const response = await axios.post(`${BERT_SERVICE_URL}/encode`, { text }, {
            timeout: BERT_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' },
        });
        return { available: true, embeddings: response.data.embeddings };
    } catch (err) {
        console.warn('⚠️  ClinicalBERT encoding unavailable.', err.message);
        return { available: false, embeddings: [] };
    }
}

/**
 * Compare target embedding with multiple candidates
 */
async function findSimilarCases(targetEmbedding, candidateEmbeddings, topK = 5) {
    try {
        const response = await axios.post(`${BERT_SERVICE_URL}/similarity`, {
            target_embedding: targetEmbedding,
            candidate_embeddings: candidateEmbeddings,
            top_k: topK
        }, {
            timeout: BERT_TIMEOUT_MS,
            headers: { 'Content-Type': 'application/json' },
        });
        return { available: true, ...response.data };
    } catch (err) {
        console.warn('⚠️  ClinicalBERT similarity search unavailable.', err.message);
        return { available: false, indices: [], scores: [] };
    }
}

module.exports = {
    extractEntities,
    extractEntitiesOCR,
    classifyDocument,
    getClinicalEmbeddings,
    findSimilarCases
};
