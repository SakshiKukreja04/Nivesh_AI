import { ProductTechSignals } from '../types/index.js';

// Section keywords for extraction (add more synonyms, case-insensitive)
const SECTION_KEYWORDS = [
  'product', 'solution', 'technology', 'platform', 'features', 'tech', 'architecture',
  'innovation', 'system', 'stack', 'software', 'hardware', 'service', 'offering', 'capability', 'capabilities', 'tools', 'engine', 'infrastructure', 'api', 'mobile', 'web', 'app', 'application', 'applications', 'module', 'modules', 'integration', 'integrations', 'workflow', 'workflows', 'automation', 'ai', 'ml', 'machine learning', 'data', 'cloud', 'backend', 'frontend', 'interface', 'dashboard', 'analytics', 'reporting', 'compliance', 'security', 'scalability', 'performance', 'deployment', 'devops', 'pipeline', 'architecture', 'framework', 'library', 'libraries', 'sdk', 'ux', 'ui', 'user experience', 'user interface', 'design', 'proprietary', 'patent', 'patented', 'intellectual property', 'ip', 'unique', 'differentiator', 'differentiation', 'advantage', 'moat', 'core', 'core tech', 'core technology', 'core product', 'core platform', 'core solution', 'core feature', 'core capability', 'core offering', 'core module', 'core engine', 'core system', 'core stack', 'core software', 'core hardware', 'core service', 'core tool', 'core api', 'core mobile', 'core web', 'core app', 'core application', 'core applications', 'core integration', 'core integrations', 'core workflow', 'core workflows', 'core automation', 'core ai', 'core ml', 'core machine learning', 'core data', 'core cloud', 'core backend', 'core frontend', 'core interface', 'core dashboard', 'core analytics', 'core reporting', 'core compliance', 'core security', 'core scalability', 'core performance', 'core deployment', 'core devops', 'core pipeline', 'core architecture', 'core framework', 'core library', 'core libraries', 'core sdk', 'core ux', 'core ui', 'core user experience', 'core user interface', 'core design', 'core proprietary', 'core patent', 'core patented', 'core intellectual property', 'core ip', 'core unique', 'core differentiator', 'core differentiation', 'core advantage', 'core moat'
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
    // Flexible: allow fuzzy/partial match
    if (SECTION_KEYWORDS.some(k => lowerSection.includes(k) || chunk.text.toLowerCase().includes(k))) {
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

  // Fallback: if no product summary, use the largest chunk
  if (!productSummary && sectionChunks.length > 0) {
    const largest = sectionChunks.reduce((a, b) => (a.text.length > b.text.length ? a : b));
    productSummary = largest.text;
    evidence.push({ section: largest.section, snippet: largest.text });
  }


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
