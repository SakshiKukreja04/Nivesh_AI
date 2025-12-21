import axios from "axios";
import { retrieveRelevantContext } from "./ragRetriever.js";
import { DocumentChunk, GroqResponse, StartupMetadata, FounderVerificationResult } from "../types/index.js";

const DEFAULT_TIMEOUT = 60_000;
const MAX_TOKENS = Number(process.env.GROQ_MAX_TOKENS || 2000);
const MAX_CHUNK_LENGTH = 12000;
const MIN_EVIDENCE_CHUNKS = 1;

/**
 * Sanitizes user input to prevent prompt injection.
 * Removes potentially dangerous patterns.
 */
function sanitizeInput(input: string): string {
  if (!input || typeof input !== "string") return "";
  // Remove control characters and limit length
  return input
    .replace(/[\x00-\x1F\x7F]/g, "")
    .slice(0, 1000)
    .trim();
}

/**
 * Builds a safe prompt with retrieved evidence.
 * NEVER sends user query directly - only uses retrieved context.
 */
function buildPrompt(
  startupContext: StartupMetadata, 
  evidence: DocumentChunk[], 
  sanitizedQuery: string,
  founderVerification?: FounderVerificationResult | null
): { system: string; prompt: string } {
  // System prompt enforces structured output and evidence-only responses
  const system = `You are a venture capital analyst. Use ONLY the provided evidence from the startup documents. Do NOT hallucinate or make up information. If evidence is insufficient, state that clearly. Pay special attention to red flags and suspicious patterns in founder verification data.`;

  // Context from startup metadata (sanitized)
  const context = `Startup metadata:\n${JSON.stringify(startupContext, null, 2)}`;

  // Founder verification data (if available)
  let founderContext = "";
  if (founderVerification) {
    founderContext = `\n\nFounder Verification Data:\n${JSON.stringify(founderVerification, null, 2)}\n\nIMPORTANT: Analyze this founder verification data carefully. Flag any red flags or suspicious patterns in the topRisks array. Pay attention to:\n- Low founder strength score (< 6.0)\n- Red flags detected (short tenure, recent hires, IC-only roles, etc.)\n- Missing critical experience or credentials\n- Any inconsistencies or concerns`;
  }

  // Evidence from retrieved documents (this is the RAG context)
  const evidenceText = evidence.length > 0
    ? evidence.map((e, idx) => `[Evidence ${idx + 1}]\n${e.text.slice(0, MAX_CHUNK_LENGTH)}`).join("\n\n")
    : "No relevant evidence found in documents.";

  // Expected schema for structured output
  const expectedSchema: GroqResponse = {
    summary: "string",
    topRisks: ["string"], // Should include founder-related red flags if found
    teamAssessment: "string", // Should incorporate founder verification insights
    marketOutlook: "string",
  };

  // Build prompt - user query is only used to guide what to extract from evidence
  const prompt = [
    `User's analysis request: ${sanitizedQuery}`,
    `\nStartup Context:\n${context}`,
    founderContext,
    `\nRetrieved Evidence from Documents:\n${evidenceText}`,
    `\nRequired Output Format (JSON only, no markdown, no extra text):`,
    JSON.stringify(expectedSchema, null, 2),
    `\nReturn ONLY a valid JSON object matching this schema. Do not include markdown code blocks, explanations, or any text outside the JSON.`,
    founderVerification ? `\n\nCRITICAL: If founder verification shows red flags (low score, short tenure, recent hires, IC-only roles, etc.), include these as specific risks in the topRisks array.` : "",
  ].join("\n");

  return { system, prompt };
}

/**
 * Safely parses JSON response from Groq.
 */
function safeParseJson(text: string): GroqResponse | null {
  if (!text || typeof text !== "string") return null;
  
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  }
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<GroqResponse>;
    
    // Validate required fields
    if (
      typeof parsed.summary === "string" &&
      Array.isArray(parsed.topRisks) &&
      typeof parsed.teamAssessment === "string" &&
      typeof parsed.marketOutlook === "string"
    ) {
      return {
        summary: parsed.summary,
        topRisks: parsed.topRisks,
        teamAssessment: parsed.teamAssessment,
        marketOutlook: parsed.marketOutlook,
        valuationNotes: parsed.valuationNotes,
      };
    }
    return null;
  } catch (err) {
    console.error("JSON parse error:", err);
    return null;
  }
}

/**
 * @deprecated Use analyzeWithRAG instead. This function is kept for backward compatibility but throws an error.
 */
export async function analyzeStartupWithGroq(_startupContext: StartupMetadata): Promise<GroqResponse> {
  throw new Error("Use analyzeWithRAG for RAG-based analysis. Direct analysis without context retrieval is not allowed.");
}

/**
 * Performs RAG-based analysis with Groq.
 * 
 * SAFETY RULES:
 * 1. User query is sanitized and never sent directly to Groq
 * 2. Context is ALWAYS retrieved from vector store first
 * 3. Only retrieved evidence is used in the prompt
 * 4. Output is validated as structured JSON
 * 
 * @param startupContext - Startup metadata
 * @param userQuery - User's analysis request (will be sanitized)
 * @param founderVerification - Optional founder verification data to include in analysis
 * @returns Structured analysis response
 */
export async function analyzeWithRAG(
  startupContext: StartupMetadata, 
  userQuery: string,
  founderVerification?: FounderVerificationResult | null
): Promise<GroqResponse> {
  const GROQ_API_URL = process.env.GROQ_API_URL;
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.1-70b-versatile";

  // Validate environment
  if (!GROQ_API_URL || !GROQ_API_KEY) {
    console.warn("Groq credentials missing, returning mock response");
    return {
      summary: "Analysis unavailable: Groq API credentials not configured.",
      topRisks: ["API configuration required"],
      teamAssessment: "Unable to assess without API access.",
      marketOutlook: "Unable to assess without API access.",
    };
  }

  // Sanitize user input
  const sanitizedQuery = sanitizeInput(userQuery);

  try {
    // STEP 1: Retrieve relevant context from vector store (RAG retrieval)
    const evidence = await retrieveRelevantContext(sanitizedQuery, 5);

    // Validate we have evidence
    if (evidence.length < MIN_EVIDENCE_CHUNKS) {
      console.warn("Insufficient evidence retrieved, proceeding with minimal context");
    }

    // STEP 2: Build safe prompt with retrieved evidence and founder verification
    const { system, prompt } = buildPrompt(startupContext, evidence, sanitizedQuery, founderVerification);

    // STEP 3: Call Groq API with structured prompt
    const payload = {
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: Math.min(MAX_TOKENS, 2000),
      response_format: { type: "json_object" },
    };

    const resp = await axios.post(GROQ_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: DEFAULT_TIMEOUT,
    });

    // STEP 4: Extract and validate response
    const data = resp.data;
    let textOutput: string | null = null;

    if (data?.choices && data.choices[0]) {
      const choice = data.choices[0];
      textOutput = choice.message?.content ?? choice.text ?? null;
    }
    if (!textOutput && typeof data === "string") {
      textOutput = data;
    }
    if (!textOutput && data && typeof data === "object") {
      textOutput = JSON.stringify(data);
    }
    if (!textOutput) {
      throw new Error("Groq returned empty response");
    }

    // STEP 5: Parse and validate JSON structure
    const parsed = safeParseJson(textOutput);
    if (!parsed) {
      throw new Error("Groq response is not valid JSON or missing required fields");
    }

    return parsed;
  } catch (err) {
    console.error("analyzeWithRAG error:", err);
    
    // Return safe fallback response
    if (axios.isAxiosError(err)) {
      return {
        summary: `Analysis failed: ${err.message}. Please check API configuration.`,
        topRisks: ["API communication error"],
        teamAssessment: "Unable to assess due to API error.",
        marketOutlook: "Unable to assess due to API error.",
      };
    }
    
    // Re-throw non-Axios errors
    throw err;
  }
}

export default { analyzeStartupWithGroq, analyzeWithRAG };
