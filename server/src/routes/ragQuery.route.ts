import express, { Request, Response } from "express";
import { analyzeWithRAG } from "../services/groqAnalyzer.js";
import { StartupMetadata, GroqResponse } from "../types/index.js";

const router = express.Router();

interface RAGQueryRequest {
  startupContext: StartupMetadata;
  userQuery: string;
}

/**
 * POST /api/rag/query
 * 
 * RAG query endpoint for chat interface.
 * Retrieves relevant context and performs AI analysis.
 */
router.post("/query", async (req: Request, res: Response): Promise<Response> => {
  try {
    const { startupContext, userQuery } = req.body as RAGQueryRequest;

    // Validate request
    if (!startupContext || typeof startupContext !== "object") {
      return res.status(400).json({ 
        success: false, 
        error: "startupContext is required and must be an object" 
      });
    }

    if (!userQuery || typeof userQuery !== "string" || userQuery.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "userQuery is required and must be a non-empty string" 
      });
    }

    // Perform RAG-based analysis
    const analysis: GroqResponse = await analyzeWithRAG(startupContext, userQuery);
    
    return res.json({ success: true, analysis });
  } catch (err) {
    console.error("/api/rag/query error:", err);
    const errorMessage = err instanceof Error ? err.message : "Internal Server Error";
    return res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

export default router;
