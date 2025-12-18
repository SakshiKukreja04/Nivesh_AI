import axios from "axios";
import util from "util";

// Analyze a startupContext with Groq LLM and return parsed JSON output.
// - Expects environment variables: GROQ_API_URL, GROQ_API_KEY, GROQ_MODEL
// - The LLM is instructed to output STRICT JSON only. We parse and return it.

const DEFAULT_TIMEOUT = 60_000; // 60s

function buildPrompt(startupContext) {
  // System role and task instructions kept concise and explicit.
  const system = `You are a venture capital analyst assisting with early-stage startup evaluation.`;

  // User/task instructions: enforce conservative reasoning, no hallucination, strict JSON output.
  const task = `Task: Analyze the startup based ONLY on the provided context. Reason conservatively, clearly flag uncertainty, and do NOT invent or assume metrics that are not present in the input. If data is missing for a requested field, explicitly return the string \"Insufficient data\" for that field. Output STRICT JSON only, no markdown, no commentary.`;

  // Inject structured startupContext as a JSON block for the model to consume.
  const input = `Input Context (JSON):\n${JSON.stringify(startupContext, null, 2)}`;

  // Expected output schema to guide the model. We include the exact JSON shape the model must produce.
  const expected = `Expected output: Produce a single JSON object exactly matching this schema (use these keys and types):\n${JSON.stringify({
    decision: "Proceed | Monitor | Reject",
    confidenceScore: "number (0-100)",
    executiveSummary: "string",
    founderTeamAssessment: {
      backgroundSummary: ["string"],
      founderStrengthScore: "number (0-10)",
      redFlags: ["string"],
    },
    marketOpportunity: {
      problemClarity: "High | Medium | Low",
      tamSamSom: { tam: "string", sam: "string", som: "string" },
      aiCommentary: "string",
    },
    productTechnology: {
      overview: "string",
      techStack: ["string"],
      defensibility: "string",
      readiness: {
        mvpBuilt: "Yes | No | Unknown",
        payingUsers: "Yes | No | Unknown",
        aiDependency: "Low | Medium | High",
        differentiation: "High | Moderate | Weak",
      },
    },
    tractionSignals: { revenue: "string", growthIndicators: "string", risks: ["string"] },
    competitiveLandscape: { positioningSummary: "string", keyCompetitors: ["string"] },
    riskAnalysis: {
      financialRisk: "number (0-10)",
      marketRisk: "number (0-10)",
      executionRisk: "number (0-10)",
      techRisk: "number (0-10)",
      topRisks: ["string"],
    },
    followUpQuestions: ["string"],
  }, null, 2)}`;

  // Compose the full prompt string that will be sent as the user message.
  const prompt = [system, "", task, "", input, "", expected, "", "Return only the JSON object as the response."]
    .join("\n");

  return { system, prompt };
}

export async function analyzeStartupWithGroq(startupContext) {
  const GROQ_API_URL = process.env.GROQ_API_URL;
  const GROQ_API_KEY = process.env.GROQ_API_KEY ;
  const GROQ_MODEL = process.env.GROQ_MODEL || "text-model";

  // If Groq config is missing or points to a placeholder domain, fall back to a local deterministic
  // mock analyzer. This prevents runtime DNS errors (e.g., getaddrinfo ENOTFOUND) during development
  // and when API credentials are not yet available.
  const isMockMode = !GROQ_API_URL || !GROQ_API_KEY || GROQ_API_URL.includes("groq.example");
  if (isMockMode) {
    console.warn("GROQ API not configured or using placeholder; running local mock analysis.");
    return createMockAnalysis(startupContext);
  }

  // Build the prompt to send to the model
  const { system, prompt } = buildPrompt(startupContext);

  // Construct the request payload in a generic chat-style shape.
  const payload = {
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt },
    ],
    temperature: 0.25,
    // limit tokens conservatively; caller can adjust via env if needed
    max_tokens: 2000,
  };

  try {
    const resp = await axios.post(GROQ_API_URL, payload, {
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      timeout: Number(process.env.GROQ_TIMEOUT_MS || DEFAULT_TIMEOUT),
    });

    // Groq may return different shapes; try to extract text content robustly
    const data = resp.data;

    // Typical chat shape: data.choices[0].message.content
    let textOutput = null;
    if (data?.choices && data.choices[0]) {
      const choice = data.choices[0];
      if (choice.message && choice.message.content) textOutput = choice.message.content;
      else if (choice.text) textOutput = choice.text;
    }

    // Some APIs return top-level `content` or `output`; fallback to stringifying body
    if (!textOutput && typeof data === "string") textOutput = data;
    if (!textOutput && data && typeof data === "object") textOutput = JSON.stringify(data);

    if (!textOutput) {
      throw new Error("Groq API returned no text output");
    }

    // The model is instructed to return STRICT JSON. Try to parse it.
    let analysis;
    try {
      analysis = JSON.parse(textOutput);
    } catch (err) {
      // Provide helpful diagnostic including a truncated model output
      const snippet = textOutput.slice(0, 2000);
      const message = `Failed to parse JSON from Groq model output. Raw output (truncated): ${snippet}`;
      const e = new Error(message);
      // Attach raw output for debugging
      e.raw = textOutput;
      throw e;
    }

    return analysis;
  } catch (err) {
    // If the error looks like a DNS/network resolution issue, fall back to mock analysis
    const code = err && (err.code || err?.response?.status);
    const isDnsError = err && (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN" || String(err.message).includes("ENOTFOUND"));
    console.error("analyzeStartupWithGroq error:", util.inspect(err, { depth: 2 }));
    if (isDnsError) {
      console.warn("Groq API network/DNS error detected; falling back to local mock analysis.");
      return createMockAnalysis(startupContext);
    }
    throw err;
  }
}

export default { analyzeStartupWithGroq };

/*
  TODO (RAG pipeline - future work):
  1. Chunk documents (pitch deck, emails, transcripts) into 500-1000 token segments.
  2. Generate embeddings for each chunk using a dedicated embeddings model.
  3. Store embeddings in a vector DB (Pinecone/Qdrant/Weaviate) with metadata: { startupId, documentType, chunkIndex }.
  4. Persist raw files to durable storage (S3 / Cloudinary / local storage) and store references alongside embeddings.
  5. For follow-up queries: embed the query, retrieve top-k chunks, and inject them into the Groq prompt to provide grounded answers.
*/

// A small deterministic mock analyzer used when Groq credentials/URL are not configured.
function createMockAnalysis(startupContext) {
  // Conservative defaults: prefer "Insufficient data" if nothing to analyze.
  const hasDeck = Boolean(startupContext?.documents?.pitchDeckText && startupContext.documents.pitchDeckText.trim().length > 50);
  const hasTranscript = Boolean(startupContext?.documents?.transcriptText && startupContext.documents.transcriptText.trim().length > 50);

  const executiveSummary = [];
  if (!hasDeck && !hasTranscript && !startupContext?.notes) {
    executiveSummary.push("Insufficient data to form an executive summary.");
  } else {
    if (hasDeck) executiveSummary.push("Pitch deck content available for review.");
    if (hasTranscript) executiveSummary.push("Found a transcript with spoken details.");
    if (startupContext?.notes) executiveSummary.push("Additional notes provided by uploader.");
  }

  // Conservative scoring: increase confidence slightly when more sources exist
  let confidence = 35;
  if (hasDeck) confidence += 25;
  if (hasTranscript) confidence += 20;
  if (startupContext?.notes) confidence += 10;
  confidence = Math.min(95, confidence);

  // Quick founder/team heuristics: if notes mention 'founder' or 'team' include them, otherwise Insufficient data
  const backgroundSummary = [];
  if (startupContext?.notes?.toLowerCase()?.includes("founder") || startupContext?.notes?.toLowerCase()?.includes("team")) {
    backgroundSummary.push(startupContext.notes.trim().slice(0, 200));
  } else {
    backgroundSummary.push("Insufficient data");
  }

  const analysis = {
    decision: hasDeck || hasTranscript ? "Monitor" : "Insufficient data",
    confidenceScore: confidence,
    executiveSummary: executiveSummary.join(" "),
    founderTeamAssessment: {
      backgroundSummary,
      founderStrengthScore: hasDeck ? 6 : 3,
      redFlags: [],
    },
    marketOpportunity: {
      problemClarity: "Insufficient data",
      tamSamSom: { tam: "Insufficient data", sam: "Insufficient data", som: "Insufficient data" },
      aiCommentary: "Insufficient data",
    },
    productTechnology: {
      overview: hasDeck ? startupContext.documents.pitchDeckText.slice(0, 300) : "Insufficient data",
      techStack: [],
      defensibility: "Insufficient data",
      readiness: {
        mvpBuilt: "Unknown",
        payingUsers: "Unknown",
        aiDependency: "Unknown",
        differentiation: "Weak",
      },
    },
    tractionSignals: { revenue: "Insufficient data", growthIndicators: "Insufficient data", risks: [] },
    competitiveLandscape: { positioningSummary: "Insufficient data", keyCompetitors: [] },
    riskAnalysis: { financialRisk: 5, marketRisk: 5, executionRisk: 5, techRisk: 5, topRisks: [] },
    followUpQuestions: [
      "Please provide more detailed traction metrics (revenue, MRR, growth rates).",
      "Share founder bios and relevant customer references.",
    ],
  };

  return analysis;
}

// Export mock creator for external fallback handling
export { createMockAnalysis };
