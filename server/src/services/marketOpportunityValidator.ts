
import fs from "fs";
import path from "path";
// Import document and chunk extraction utilities
// import { extractMarketOpportunityFromPitchDeck, extractMarketOpportunityFromTxt } from "./documentProcessor";

export type MarketOpportunityInput = {
  sector: "SaaS" | "Fintech" | "Healthtech";
  TAM: number;
  SAM: number;
  SOM: number;
  growthRate: number;
};

export type MarketOpportunityValidationResult = {
  score: number;
  flags: string[];
  validatedTAM: number;
  growthAlignment: "aligned" | "aggressive" | "conservative";
};

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BENCHMARKS_PATH = path.join(__dirname, "../../data/sectorBenchmarks.json");

function getSectorBenchmarks(sector: string) {
  if (!fs.existsSync(BENCHMARKS_PATH)) throw new Error("Sector benchmarks not found");
  const data = JSON.parse(fs.readFileSync(BENCHMARKS_PATH, "utf-8"));
  return data[sector];
}


/**
 * Enhanced: Extract market opportunity details from pitch deck first, then fallback to txt/eml if not found.
 * @param input MarketOpportunityInput
 * @param pitchDeckText string (raw text from pitch deck)
 * @param additionalDocs Array<{ type: 'txt'|'eml', text: string }>
 */
export function validateMarketOpportunity(
  input: MarketOpportunityInput,
  pitchDeckText?: string,
  additionalDocs?: Array<{ type: 'txt'|'eml', text: string }>
): MarketOpportunityValidationResult {
  const { sector, TAM, SAM, SOM, growthRate } = input;
  const benchmarks = getSectorBenchmarks(sector);
  let score = 100;
  const flags: string[] = [];
  let detailsFound = false;

  // 1. Try extracting from pitch deck first (placeholder logic)
  if (pitchDeckText && pitchDeckText.length > 0) {
    // TODO: Integrate with actual extraction logic for pitch deck
    // const extracted = extractMarketOpportunityFromPitchDeck(pitchDeckText);
    // if (extracted) { detailsFound = true; /* use extracted values */ }
    detailsFound = true; // Simulate found for now
  }

  // 2. If not found in pitch deck, try additional txt/eml docs
  if (!detailsFound && additionalDocs && additionalDocs.length > 0) {
    for (const doc of additionalDocs) {
      if (doc.text && doc.text.length > 0) {
        // TODO: Integrate with actual extraction logic for txt/eml
        // const extracted = extractMarketOpportunityFromTxt(doc.text);
        // if (extracted) { detailsFound = true; break; }
        detailsFound = true; // Simulate found for now
        break;
      }
    }
  }

  // Fallback: Use input values if nothing found
  // TAM validation
  if (TAM < benchmarks.minTAM) {
    flags.push("TAM below sector minimum");
  }
  if (TAM > benchmarks.maxReasonableTAM) {
    flags.push("TAM exceeds sector maximum");
    score -= 20;
  }

  // SAM validation
  if (SAM > TAM) {
    flags.push("SAM exceeds TAM");
    score -= 10;
  }

  // SOM validation
  if (SOM > 0.1 * SAM) {
    flags.push("SOM exceeds 10% of SAM");
    score -= 15;
  }

  // Growth rate validation
  let growthAlignment: "aligned" | "aggressive" | "conservative" = "aligned";
  if (growthRate > benchmarks.CAGR + 5) {
    growthAlignment = "aggressive";
    flags.push("Growth rate > sector CAGR + 5% (aggressive)");
    score -= 10;
  } else if (growthRate < benchmarks.CAGR - 5) {
    growthAlignment = "conservative";
    flags.push("Growth rate < sector CAGR - 5% (conservative)");
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    flags,
    validatedTAM: TAM,
    growthAlignment,
  };
}
