import { ProductTechSignals } from '../types/index.js';

// Section keywords for extraction
const SECTION_KEYWORDS = [
  'product', 'solution', 'technology', 'platform', 'features', 'tech', 'architecture'
];

// Sector detection keywords
const SECTOR_KEYWORDS: Record<string, string[]> = {
  saas: ['saas', 'software', 'subscription', 'cloud'],
  fintech: ['fintech', 'finance', 'payments', 'banking', 'lending', 'wallet'],
  healthtech: ['healthtech', 'healthcare', 'medical', 'patient', 'clinical', 'doctor', 'hospital'],
};

// Metric regex patterns
const METRIC_PATTERNS: Record<string, RegExp> = {
  MRR: /(?:MRR|monthly recurring revenue)\s*[:\-]?\s*\$?([\d,.]+[mk]?)?/i,
  users: /(?:users|customers|clients)\s*[:\-]?\s*([\d,.]+[mk]?)?/i,
  pilots: /(?:pilots|trials)\s*[:\-]?\s*([\d,.]+)?/i,
  accuracy: /accuracy\s*[:\-]?\s*([\d.]+%?)/i,
  uptime: /uptime\s*[:\-]?\s*([\d.]+%?)/i,
};

export function extractProductTechSignals(
  _deckText: string, // unused, for future compatibility
  sectionChunks: Array<{ section: string; text: string }>
): ProductTechSignals {
  // 1. Extract product summary from relevant sections
  const evidence: Array<{ section: string; snippet: string }> = [];
  let productSummary = '';
  let sector: ProductTechSignals['sector'] = 'unknown';
  const keyMetrics: Record<string, string | number> = {};

  for (const chunk of sectionChunks) {
    const lowerSection = chunk.section.toLowerCase();
    if (SECTION_KEYWORDS.some(k => lowerSection.includes(k))) {
      evidence.push({ section: chunk.section, snippet: chunk.text });
      productSummary += chunk.text + '\n';
    }
    // Sector detection
    for (const [sec, keywords] of Object.entries(SECTOR_KEYWORDS)) {
      if (keywords.some(k => chunk.text.toLowerCase().includes(k))) {
        sector = sec as ProductTechSignals['sector'];
      }
    }
    // Metric extraction
    for (const [metric, regex] of Object.entries(METRIC_PATTERNS)) {
      const match = chunk.text.match(regex);
      if (match && match[1]) {
        keyMetrics[metric] = match[1];
      }
    }
  }

  // If no product summary, leave empty
  productSummary = productSummary.trim();

  return {
    sector,
    productSummary,
    polishedSummary: '', // To be filled by Groq
    keyMetrics,
    defensibility: { pros: [], cons: [] }, // To be filled by Groq
    rawEvidence: evidence,
  };
}
