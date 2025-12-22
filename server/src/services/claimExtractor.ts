import { DocumentChunk, StartupClaims } from "../types/index.js";

/**
 * Extracts structured factual claims from document text.
 * No LLM usage - uses regex and heuristics only.
 */
export function extractClaims(chunks: DocumentChunk[]): StartupClaims[] {
  const claims: StartupClaims[] = [];

  for (const chunk of chunks) {
    console.log(`[CLAIM-EXTRACTOR] Processing chunk ${chunk.id}:`, chunk.text.slice(0, 200));
    const chunkClaims = extractClaimsFromChunk(chunk);
    if (chunkClaims.length > 0) {
      console.log(`[CLAIM-EXTRACTOR] Claims found:`, JSON.stringify(chunkClaims, null, 2));
      claims.push(...chunkClaims.map(claim => ({ ...claim, sourceChunk: chunk.id, claim: Object.keys(claim)[0] })));
    } else {
      console.log(`[CLAIM-EXTRACTOR] No claims found in chunk ${chunk.id}`);
    }
  }

  return claims;
}

/**
 * Validates claims by cross-referencing across chunks.
 */
export function validateClaims(claims: StartupClaims[]): StartupClaims[] {
  // For now, return all claims as validated (no complex validation logic)
  // In production, this could cross-reference claims across chunks
  return claims;
}

/**
 * Extracts claims from a single chunk using regex patterns.
 */
function extractClaimsFromChunk(chunk: DocumentChunk): Omit<StartupClaims, 'sourceChunk'>[] {
  const text = chunk.text.toLowerCase();
  const claims: Omit<StartupClaims, 'sourceChunk'>[] = [];

  // Revenue patterns (monthly/annual)
  const revenuePatterns = [
    /(\$|₹|rs\.?|inr)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(k|m|b|cr|lakh|l|million|billion)?\s*(?:per\s+)?(month|monthly|year|annual|annually)/gi,
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(k|m|b|cr|lakh|l|million|billion)?\s*(?:per\s+)?(month|monthly|year|annual|annually)\s*(revenue|income|sales)/gi,
    /(revenue|income|sales)\s*(?:of|is|:)\s*(\$|₹|rs\.?|inr)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(k|m|b|cr|lakh|l|million|billion)?\s*(?:per\s+)?(month|monthly|year|annual|annually)/gi
  ];

  // User count patterns
  const userPatterns = [
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(k|m|b|million|billion)?\s*(users?|customers?|clients?|people)/gi,
    /(users?|customers?|clients?|people)\s*(?:base|count|number)\s*(?:of|is|:)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(k|m|b|cr|lakh|l|million|billion)?/gi
  ];

  // Growth rate patterns
  const growthPatterns = [
    /(\d+(?:\.\d{2})?)%\s*(month|monthly|year|annual|annually)\s*(?:over\s+)?(month|monthly|year|annual|annually)?\s*(growth|increase)/gi,
    /(growth|increase)\s*(?:rate|of)\s*(\d+(?:\.\d{2})?)%\s*(?:per\s+)?(month|monthly|year|annual|annually)/gi
  ];

  // Funding patterns
  const fundingPatterns = [
    /(?:raised|secured|received)\s*(\$|₹|rs\.?|inr)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(k|m|b|cr|lakh|l|million|billion)?\s*(?:in\s+)?(?:funding|investment|series|round)/gi,
    /(?:funding|investment|series|round)\s*(?:of|amount)\s*(\$|₹|rs\.?|inr)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(k|m|b|cr|lakh|l|million|billion)?/gi
  ];

  // Team size patterns
  const teamPatterns = [
    /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:person|people|member|employee|team|staff)/gi,
    /(team|staff|employees?|people)\s*(?:size|of|count)\s*(?:is|:)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
  ];

  // Market/Sector patterns
  const marketPatterns = [
    /(?:market|sector|industry|domain)\s*(?:is|:|of)\s*([a-zA-Z\s&,-]+)/gi,
    /(?:operating|working)\s*(?:in|on)\s*(?:the\s+)?([a-zA-Z\s&,-]+)\s*(?:market|sector|industry)/gi
  ];

  // Stage patterns
  const stagePatterns = [
    /(?:stage|phase)\s*(?:is|:|of)\s*(idea|mvp|prototype|beta|launch|growth|scale|series|seed|pre-seed|early|late)/gi,
    /(idea|mvp|prototype|beta|launch|growth|scale|series|seed|pre-seed|early|late)\s*(?:stage|phase)/gi
  ];

  // Geography patterns
  const geographyPatterns = [
    /(?:located|based|operating)\s*(?:in|at)\s*([a-zA-Z\s,]+)/gi,
    /(?:geography|location|region)\s*(?:is|:|of)\s*([a-zA-Z\s,]+)/gi
  ];

  // Extract revenue claims
  for (const pattern of revenuePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const amount = normalizeCurrency(match[2] || match[3] || match[4]);
      const period = match[4] || match[5] || match[6] || match[7];
      if (amount && period) {
        claims.push({
          revenue: amount,
          revenuePeriod: period.includes('month') ? 'monthly' : 'annual',
          rawEvidence: [chunk.text]
        });
      }
    }
  }

  // Extract user claims
  for (const pattern of userPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const users = normalizeNumber(match[1] || match[2]);
      if (users) {
        claims.push({
          users: users,
          rawEvidence: [chunk.text]
        });
      }
    }
  }

  // Extract growth claims
  for (const pattern of growthPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const rate = parseFloat(match[1] || match[2]);
      if (rate && !isNaN(rate)) {
        claims.push({
          growthRate: rate,
          rawEvidence: [chunk.text]
        });
      }
    }
  }

  // Extract funding claims
  for (const pattern of fundingPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const amount = normalizeCurrency(match[2] || match[3]);
      if (amount) {
        claims.push({
          fundingRaised: amount,
          rawEvidence: [chunk.text]
        });
      }
    }
  }

  // Extract team claims
  for (const pattern of teamPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const teamSize = parseInt(match[1] || match[2]);
      if (teamSize && !isNaN(teamSize)) {
        claims.push({
          teamSize: teamSize,
          rawEvidence: [chunk.text]
        });
      }
    }
  }

  // Extract market claims
  for (const pattern of marketPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const market = (match[1] || match[2]).trim();
      if (market && market.length > 2) {
        claims.push({
          market: market,
          rawEvidence: [chunk.text]
        });
      }
    }
  }

  // Extract stage claims
  for (const pattern of stagePatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const stage = (match[1] || match[2]).trim();
      if (stage) {
        claims.push({
          stage: stage,
          rawEvidence: [chunk.text]
        });
      }
    }
  }

  // Extract geography claims
  for (const pattern of geographyPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const geography = (match[1] || match[2]).trim();
      if (geography && geography.length > 2) {
        claims.push({
          geography: geography,
          rawEvidence: [chunk.text]
        });
      }
    }
  }

  return claims;
}

/**
 * Normalizes currency values to numbers.
 */
function normalizeCurrency(value: string): number | undefined {
  if (!value) return undefined;

  const numStr = value.replace(/[$,₹rs\.inr\s]/gi, '');
  let num = parseFloat(numStr);

  if (isNaN(num)) return undefined;

  // Handle multipliers
  const lowerValue = value.toLowerCase();
  if (lowerValue.includes('k')) num *= 1000;
  else if (lowerValue.includes('m') || lowerValue.includes('million')) num *= 1000000;
  else if (lowerValue.includes('b') || lowerValue.includes('billion')) num *= 1000000000;
  else if (lowerValue.includes('cr') || lowerValue.includes('lakh')) num *= 100000;
  else if (lowerValue.includes('l')) num *= 100000;

  return Math.round(num);
}

/**
 * Normalizes number strings to numbers.
 */
function normalizeNumber(value: string): number | undefined {
  if (!value) return undefined;

  const numStr = value.replace(/,/g, '');
  let num = parseFloat(numStr);

  if (isNaN(num)) return undefined;

  // Handle multipliers
  const lowerValue = value.toLowerCase();
  if (lowerValue.includes('k')) num *= 1000;
  else if (lowerValue.includes('m') || lowerValue.includes('million')) num *= 1000000;
  else if (lowerValue.includes('b') || lowerValue.includes('billion')) num *= 1000000000;

  return Math.round(num);
}
