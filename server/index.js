// index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import { processUploadedFile, detectFileType } from "./fileUtils.js";
import fs from "fs/promises";
import path from "path";
import { analyzeStartupWithGroq, createMockAnalysis } from "./services/groqAnalyzer.js";

// Directory to persist uploaded startup contexts
const DATA_DIR = path.resolve("./data");
const DATA_FILE = path.join(DATA_DIR, "startups.json");

// Ensure data directory exists at startup
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create data directory:", err);
  }
}

// Call ensure on startup (don't await here to avoid blocking)
ensureDataDir();

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Configure Multer to store files in memory
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/analyze
 * Accepts multipart/form-data with optional files and required metadata fields.
 */
app.post(
  "/api/analyze",
  // Expect up to one file for pitchDeck, transcript, and email
  upload.fields([
    { name: "pitchDeck", maxCount: 1 },
    { name: "transcript", maxCount: 1 },
    { name: "email", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      // Extract string fields from the form
      const {
        startupName,
        location,
        stage,
        sector,
        businessModel,
        website,
        fundingRaised,
        teamSize,
        additionalNotes,
      } = req.body;

      // Validate required fields
      const missing = [];
      if (!startupName) missing.push("startupName");
      if (!stage) missing.push("stage");
      if (!sector) missing.push("sector");
      if (!businessModel) missing.push("businessModel");
      if (missing.length > 0) {
        return res.status(400).json({
          success: false,
          error: `Missing required field(s): ${missing.join(", ")}`,
        });
      }

      // Files parsed by Multer (pitchDeck and transcript)
      const files = req.files || {};
      const pitchDeckFile = (files.pitchDeck && files.pitchDeck[0]) || null;
      const transcriptFile = (files.transcript && files.transcript[0]) || null;
      const emailFile = (files.email && files.email[0]) || null;

      // Process pitch deck if present; otherwise empty string
      let pitchDeckText = "";
      if (pitchDeckFile) {
        const type = detectFileType(pitchDeckFile);
        const result = await processUploadedFile(pitchDeckFile, type);
        pitchDeckText = result && result.text ? result.text : "";
      }

      // Process transcript (txt/pdf/audio). For audio, we save the file and do not transcribe now.
      let transcriptText = "";
      let transcriptSavedPath = null;
      if (transcriptFile) {
        const type = detectFileType(transcriptFile);
        const result = await processUploadedFile(transcriptFile, type);
        transcriptText = result && result.text ? result.text : "";
        transcriptSavedPath = result && result.savedFile ? result.savedFile : null;
      }

      // Process email (.eml or .txt)
      let emailText = "";
      if (emailFile) {
        const type = detectFileType(emailFile);
        const result = await processUploadedFile(emailFile, type);
        emailText = result && result.text ? result.text : "";
      }

      // Build startupContext according to spec
      const startupContext = {
        metadata: {
          name: startupName,
          location: location || "",
          stage,
          sector,
          businessModel,
          website: website || "",
          fundingRaised: fundingRaised || null,
          teamSize: teamSize || null,
        },
        documents: {
            pitchDeckText: pitchDeckText || "",
            transcriptText: transcriptText || "",
            transcriptFilePath: transcriptSavedPath || "",
            emailText: emailText || "",
          },
        notes: additionalNotes || "",
      };

      // Log received data (without raw buffers)
      console.log("Received startup upload:", {
        name: startupName,
        stage,
        sector,
        businessModel,
        website,
        fundingRaised,
        teamSize,
        hasPitchDeck: !!pitchDeckFile,
        hasTranscript: !!transcriptFile,
        hasEmail: !!emailFile,
      });

      // Persist the startupContext locally to server/data/startups.json
      try {
        // Read existing file if present
        let existing = [];
        try {
          const raw = await fs.readFile(DATA_FILE, "utf-8");
          existing = JSON.parse(raw || "[]");
        } catch (err) {
          // If file doesn't exist or parse fails, start with empty array
          existing = [];
        }

        const record = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          metadata: startupContext.metadata,
          documents: {
            pitchDeckText: startupContext.documents.pitchDeckText.slice(0, 12000),
            transcriptText: startupContext.documents.transcriptText
              ? startupContext.documents.transcriptText.slice(0, 12000)
              : "",
            transcriptFilePath: startupContext.documents.transcriptFilePath || "",
            emailText: startupContext.documents.emailText
              ? startupContext.documents.emailText.slice(0, 12000)
              : "",
          },
          notes: startupContext.notes,
        };

        existing.push(record);

        await fs.writeFile(DATA_FILE, JSON.stringify(existing, null, 2), "utf-8");
      } catch (err) {
        console.error("Failed to persist startupContext:", err);
      }

      // Call Groq analyzer to generate structured investor analysis
      try {
        // If Groq is not configured or points to a placeholder, skip the network call and use local mock.
        const GROQ_API_URL = process.env.GROQ_API_URL || "";
        const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
        const usingPlaceholder = !GROQ_API_URL || GROQ_API_URL.includes("groq.example") || !GROQ_API_KEY;
        if (usingPlaceholder) {
          console.warn("Groq not configured or using placeholder - returning mock analysis from route.");
          const analysis = createMockAnalysis(startupContext);
          return res.status(200).json({ success: true, analysis, note: "Returned local mock analysis (Groq not configured)" });
        }

        const analysis = await analyzeStartupWithGroq(startupContext);
        // Return the Groq analysis JSON as the API response
        return res.status(200).json({ success: true, analysis });
      } catch (err) {
        console.error("Groq analysis failed:", err);
        // Fallback to local mock analysis for any Groq error in development.
        // This ensures the platform remains usable even if external API is unreachable.
        try {
          const analysis = createMockAnalysis(startupContext);
          return res.status(200).json({ success: true, analysis, note: "Returned local mock analysis due to Groq error" });
        } catch (fallbackErr) {
          console.error("Mock analysis fallback failed:", fallbackErr);
          return res.status(500).json({ success: false, error: "Groq analysis failed and mock fallback failed", details: String(err) });
        }
      }
    } catch (err) {
      console.error("/api/analyze error:", err);
      return res.status(500).json({ success: false, error: "Internal server error" });
    }
  }
);

app.listen(5000, () => {
  console.log("Backend running on port 5000");
});
