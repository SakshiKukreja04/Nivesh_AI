import { ProductTechSignals } from '../types/index.js';

/**
 * Builds a Groq prompt for product/tech summary polishing and defensibility analysis.
 * Only uses extracted productSummary, keyMetrics, and rawEvidence.
 * Strictly prohibits invention or hallucination.
 */
export function buildProductTechGroqPrompt({
  productSummary,
  keyMetrics,
  rawEvidence,
}: Pick<ProductTechSignals, 'productSummary' | 'keyMetrics' | 'rawEvidence'>): { system: string; prompt: string } {
  const system = `You are a venture capital analyst AI. You must NOT invent, infer, or hallucinate any information. Only use the provided extracted content and metrics. If information is missing, leave it blank or say 'Not specified'.`;

  const prompt = `Startup Product/Tech Analysis

Extracted Product Summary:
${productSummary || 'Not specified'}

Key Metrics:
${Object.entries(keyMetrics).map(([k, v]) => `- ${k}: ${v}`).join('\n') || 'None found'}

Evidence Snippets:
${rawEvidence.map(e => `Section: ${e.section}\n${e.snippet}`).join('\n---\n') || 'None'}

Instructions:
1. Polish the product summary for clarity and conciseness, but do NOT add any new information.
2. List exactly 2 pros and 2 cons about the product/tech, strictly based on the evidence and metrics above. If not enough data, leave blank or say 'Not specified'.
3. Do NOT invent or speculate about metrics, tech stack, or claims.
4. Output JSON in this format (STRICT):
{
  "polishedSummary": "<polished summary>",
  "defensibility": {
    "pros": ["<pro 1>", "<pro 2>"],
    "cons": ["<con 1>", "<con 2>"]
  }
}`;

  return { system, prompt };
}
