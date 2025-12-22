import axios from 'axios';
import { ProductTechSignals } from '../types/index.js';
import { buildProductTechGroqPrompt } from './productTechGroqPrompt.js';


// Do not read env at module scope. Lazy-load inside function.
const DEFAULT_TIMEOUT = 60000;
export async function polishProductTechWithGroq(
  extracted: ProductTechSignals
): Promise<Pick<ProductTechSignals, 'polishedSummary' | 'defensibility'>> {
  // Lazy-load env vars
  const ENABLE_GROQ_ANALYSIS = process.env.ENABLE_GROQ_ANALYSIS === 'true';
  const GROQ_API_URL = process.env.GROQ_API_URL;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';

  if (!ENABLE_GROQ_ANALYSIS) {
    console.warn('[GROQ] Skipping Groq analysis: ENABLE_GROQ_ANALYSIS is not true');
    return {
      polishedSummary: extracted.productSummary,
      defensibility: { pros: [], cons: [] },
    };
  }
  if (!GROQ_API_URL || !GROQ_API_KEY) {
    console.warn('[GROQ] API credentials not configured. Skipping Groq analysis.');
    return {
      polishedSummary: extracted.productSummary,
      defensibility: { pros: [], cons: [] },
    };
  }
  try {
    const { system, prompt } = buildProductTechGroqPrompt({
      productSummary: extracted.productSummary,
      keyMetrics: extracted.keyMetrics,
      rawEvidence: extracted.rawEvidence,
    });
    const payload = {
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 512,
      response_format: { type: 'json_object' },
    };
    const resp = await axios.post(GROQ_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: DEFAULT_TIMEOUT,
    });
    const data = resp.data;
    if (data?.choices && data.choices[0]) {
      const content = data.choices[0].message?.content || data.choices[0].text;
      // ...existing code...
      return JSON.parse(content);
    }
    // fallback if no choices
    return {
      polishedSummary: extracted.productSummary,
      defensibility: { pros: [], cons: [] },
    };
  } catch (err) {
    console.warn('[GROQ] Error during Groq analysis:', err);
    return {
      polishedSummary: extracted.productSummary,
      defensibility: { pros: [], cons: [] },
    };
  }
}
