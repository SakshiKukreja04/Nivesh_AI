import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { processUploadedFile, detectFileType } from "./utils/fileUtils.js";
import { processAndStoreDocuments } from "./services/documentProcessor.js";
import { analyzeWithRAG } from "./services/groqAnalyzer.js";
import ragRouter from "./routes/ragQuery.route.js";
import { ProcessedFile, StartupMetadata, FounderVerificationResult, TeamInfo } from "./types/index.js";
import { extractClaims } from "./services/claimExtractor.js";
import { parseResumePDF } from "./utils/resumeParser.js";
import { extractResumeSignals } from "./services/resumeSignalExtractor.js";
import { extractTeamInfo } from "./services/teamExtractor.js";

const DATA_DIR = path.resolve("./data");
const FOUNDER_VERIFICATIONS_FILE = path.join(DATA_DIR, "founderVerifications.json");
const TEAM_INFO_FILE = path.join(DATA_DIR, "teamInfo.json");

async function ensureDataDir(): Promise<void> {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (err) {
        console.error("Failed to create data directory:", err);
    }
}

async function loadFounderVerifications(): Promise<Record<string, FounderVerificationResult>> {
    try {
        const data = await fs.readFile(FOUNDER_VERIFICATIONS_FILE, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

async function saveFounderVerification(verification: FounderVerificationResult): Promise<void> {
    try {
        console.log(`[SAVE-VERIFICATION] Saving verification for startupId: ${verification.startupId}`);
        const verifications = await loadFounderVerifications();
        verifications[verification.startupId] = verification;
        await fs.writeFile(FOUNDER_VERIFICATIONS_FILE, JSON.stringify(verifications, null, 2));
        console.log(`[SAVE-VERIFICATION] Successfully saved verification. File contains ${Object.keys(verifications).length} entries.`);
        console.log(`[SAVE-VERIFICATION] Saved data JSON:`, JSON.stringify(verification, null, 2));
    } catch (err) {
        console.error("[SAVE-VERIFICATION] Error saving founder verification:", err);
        if (err instanceof Error) {
            console.error("[SAVE-VERIFICATION] Error stack:", err.stack);
        }
    }
}

async function loadTeamInfo(): Promise<Record<string, TeamInfo>> {
    try {
        const data = await fs.readFile(TEAM_INFO_FILE, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

async function saveTeamInfo(startupId: string, teamInfo: TeamInfo): Promise<void> {
    try {
        console.log(`[SAVE-TEAM-INFO] Saving team info for startupId: ${startupId}`);
        const allTeamInfo = await loadTeamInfo();
        allTeamInfo[startupId] = teamInfo;
        await fs.writeFile(TEAM_INFO_FILE, JSON.stringify(allTeamInfo, null, 2));
        console.log(`[SAVE-TEAM-INFO] Successfully saved team info. File contains ${Object.keys(allTeamInfo).length} entries.`);
        console.log(`[SAVE-TEAM-INFO] Saved data JSON:`, JSON.stringify(teamInfo, null, 2));
    } catch (err) {
        console.error("[SAVE-TEAM-INFO] Error saving team info:", err);
        if (err instanceof Error) {
            console.error("[SAVE-TEAM-INFO] Error stack:", err.stack);
        }
    }
}

ensureDataDir();
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Add request logging middleware (must be before routes)
app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    // Safely check req.body - it might be undefined or null for multipart/form-data requests
    if (req.body && req.body !== null && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        if (req.method !== 'POST' || (req.method === 'POST' && !req.path.includes('/api/'))) {
            console.log(`  Body:`, JSON.stringify(req.body, null, 2).substring(0, 200));
        }
    }
    if (req.files) {
        const fileInfo = Object.entries(req.files as { [key: string]: Express.Multer.File[] }).map(([key, files]) => 
            `${key}: ${files[0]?.originalname || 'none'} (${files[0]?.size || 0} bytes)`
        ).join(', ');
        console.log(`  Files: ${fileInfo}`);
    }
    next();
});

const upload = multer({ storage: multer.memoryStorage() });

// File upload and analysis endpoint
app.post("/api/analyze",
    upload.fields([
        { name: "pitchDeck", maxCount: 1 },
        { name: "transcript", maxCount: 1 },
        { name: "email", maxCount: 1 },
        { name: "cv", maxCount: 1 },
    ]),
    async (req: Request, res: Response) => {
        const startTime = Date.now();
        console.log("\n[ANALYZE] ========================================");
        console.log(`[ANALYZE] Request received at ${new Date().toISOString()}`);
        console.log(`[ANALYZE] Metadata:`, JSON.stringify(req.body, null, 2));
        
        try {
            const metadata = req.body as StartupMetadata;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

            console.log(`[ANALYZE] Files received:`, files ? Object.keys(files).join(', ') : 'none');

            if (!files || Object.keys(files).length === 0) {
                console.log(`[ANALYZE] ERROR: No files uploaded`);
                return res.status(400).json({ success: false, error: "No files uploaded" });
            }

            // Process uploaded files (excluding CV) - preserve order to match with file keys
            const fileEntries = Object.entries(files).filter(([key]) => key !== "cv");
            const processedFilesWithKeys: Array<ProcessedFile & { fileKey: string }> = await Promise.all(
                fileEntries.map(async ([key, fileArray]) => {
                    const file = fileArray[0];
                    const fileType = file ? detectFileType(file) : "unknown";
                    if (!file) {
                        return { text: "", savedFile: null, fileType, fileKey: key };
                    }
                    const processed = await processUploadedFile(file, fileType);
                    return { ...processed, fileKey: key };
                })
            );
            
            // Separate files for processing (without fileKey) and keep mapping for team extraction
            const processedFiles: ProcessedFile[] = processedFilesWithKeys.map(({ fileKey, ...file }) => file);
            const fileKeyMap = new Map<number, string>(processedFilesWithKeys.map((pf, idx) => [idx, pf.fileKey]));

            // Calculate startupId once (used for both CV and main analysis)
            const startupId = metadata.startupName?.toLowerCase().replace(/\s+/g, "-") || `startup-${Date.now()}`;
            console.log(`[ANALYZE] Startup ID: ${startupId}`);

            // Extract team information from pitch deck
            let teamInfo: TeamInfo | null = null;
            const pitchDeckFile = files["pitchDeck"]?.[0];
            if (pitchDeckFile) {
                console.log(`[ANALYZE] Pitch deck detected: ${pitchDeckFile.originalname} (${pitchDeckFile.size} bytes)`);
                try {
                    // Find pitch deck text from processed files using fileKeyMap
                    let pitchDeckText = "";
                    for (const [idx, key] of fileKeyMap.entries()) {
                        if (key === "pitchDeck" && processedFiles[idx]) {
                            pitchDeckText = processedFiles[idx].text;
                            break;
                        }
                    }

                    if (pitchDeckText && pitchDeckText.trim().length > 0) {
                        console.log(`[ANALYZE] Extracting team info from pitch deck (${pitchDeckText.length} characters)...`);
                        teamInfo = extractTeamInfo(pitchDeckText);
                        if (teamInfo && teamInfo.members.length > 0) {
                            await saveTeamInfo(startupId, teamInfo);
                        }
                        console.log(`[ANALYZE] Team info extracted:`, JSON.stringify(teamInfo, null, 2));
                    } else {
                        console.log(`[ANALYZE] WARNING: No text found in pitch deck for team extraction`);
                    }
                } catch (err) {
                    console.error(`[ANALYZE] ERROR extracting team info:`, err);
                    if (err instanceof Error) {
                        console.error(`[ANALYZE] Error stack:`, err.stack);
                    }
                }
            } else {
                console.log(`[ANALYZE] No pitch deck file provided for team extraction`);
            }

            // Process CV if provided
            let founderVerification: FounderVerificationResult | null = null;
            const cvFile = files["cv"]?.[0];
            if (cvFile) {
                console.log(`[ANALYZE] CV file detected: ${cvFile.originalname} (${cvFile.size} bytes, ${cvFile.mimetype})`);
                if (cvFile.mimetype === "application/pdf") {
                    try {
                        console.log(`[ANALYZE] Processing CV resume...`);
                        const resumeText = await parseResumePDF(cvFile.buffer);
                        if (resumeText && resumeText.trim().length > 0) {
                            console.log(`[ANALYZE] Resume text extracted: ${resumeText.length} characters`);
                            const role = (req.body.role as string) || "Founder";
                            founderVerification = extractResumeSignals(resumeText, startupId, role);
                            await saveFounderVerification(founderVerification);
                            console.log(`[ANALYZE] Founder verification completed:`);
                            console.log(JSON.stringify(founderVerification, null, 2));
                        } else {
                            console.log(`[ANALYZE] WARNING: No text extracted from CV`);
                        }
                    } catch (err) {
                        console.error(`[ANALYZE] ERROR processing CV:`, err);
                        if (err instanceof Error) {
                            console.error(`[ANALYZE] Error stack:`, err.stack);
                        }
                    }
                } else {
                    console.log(`[ANALYZE] WARNING: CV file is not PDF (${cvFile.mimetype})`);
                }
            } else {
                console.log(`[ANALYZE] No CV file provided`);
            }

            // Extract and log claims from all processed files
            console.log(`[ANALYZE] Processing ${processedFiles.length} files...`);
            const documentChunks = processedFiles
                .filter(f => f && f.text)
                .map((f, idx) => ({ id: String(idx + 1), text: f.text, metadata: {} }));
            const claims = extractClaims(documentChunks);
            console.log(`[ANALYZE] Extracted ${claims.length} claims`);
            console.log(`[ANALYZE] Claims JSON:`, JSON.stringify(claims, null, 2));

            // Store documents in vector store for RAG
            console.log(`[ANALYZE] Storing documents in vector store...`);
            await processAndStoreDocuments(startupId, processedFiles, metadata);

            // Perform RAG-based analysis (include founder verification if available)
            console.log(`[ANALYZE] Performing RAG analysis...`);
            const userQuery = `Analyze this startup: ${metadata.startupName || "Unknown"}. Provide a comprehensive assessment including summary, risks, team evaluation, and market outlook. Pay special attention to founder verification data and flag any red flags or concerns.`;
            const analysis = await analyzeWithRAG(metadata, userQuery, founderVerification);
            console.log(`[ANALYZE] RAG Analysis JSON:`, JSON.stringify(analysis, null, 2));

            const duration = Date.now() - startTime;
            const responseData = { 
                success: true, 
                analysis, 
                startupId,
                founderVerification: founderVerification || undefined,
                teamInfo: teamInfo || undefined
            };
            
            console.log(`[ANALYZE] Analysis completed in ${duration}ms`);
            console.log(`[ANALYZE] Final Response JSON:`, JSON.stringify(responseData, null, 2));
            console.log(`[ANALYZE] ========================================\n`);

            return res.json(responseData);
        } catch (err) {
            const duration = Date.now() - startTime;
            console.error(`[ANALYZE] ERROR after ${duration}ms:`, err);
            console.error(`[ANALYZE] Stack:`, err instanceof Error ? err.stack : 'No stack trace');
            console.log(`[ANALYZE] ========================================\n`);
            return res.status(500).json({ success: false, error: "Internal Server Error" });
        }
    }
);

// Get founder verification by startup ID
app.get("/api/founder-verification/:startupId", async (req: Request, res: Response) => {
    console.log(`[FOUNDER-VERIFICATION] Request for startupId: ${req.params.startupId}`);
    try {
        const { startupId } = req.params;
        const verifications = await loadFounderVerifications();
        console.log(`[FOUNDER-VERIFICATION] Available startupIds:`, Object.keys(verifications));
        const verification = verifications[startupId];
        
        if (!verification) {
            console.log(`[FOUNDER-VERIFICATION] Not found for: ${startupId}`);
            return res.status(404).json({ success: false, error: "Founder verification not found" });
        }
        
        console.log(`[FOUNDER-VERIFICATION] Found verification for: ${startupId}`);
        console.log(`[FOUNDER-VERIFICATION] Verification JSON:`, JSON.stringify(verification, null, 2));
        return res.json({ success: true, verification });
    } catch (err) {
        console.error(`[FOUNDER-VERIFICATION] ERROR:`, err);
        if (err instanceof Error) {
            console.error(`[FOUNDER-VERIFICATION] Error stack:`, err.stack);
        }
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

// Get team info by startup ID
app.get("/api/team-info/:startupId", async (req: Request, res: Response) => {
    console.log(`[TEAM-INFO] Request for startupId: ${req.params.startupId}`);
    try {
        const { startupId } = req.params;
        const allTeamInfo = await loadTeamInfo();
        console.log(`[TEAM-INFO] Available startupIds:`, Object.keys(allTeamInfo));
        const teamInfo = allTeamInfo[startupId];
        
        if (!teamInfo) {
            console.log(`[TEAM-INFO] Not found for: ${startupId}`);
            return res.status(404).json({ success: false, error: "Team info not found" });
        }
        
        console.log(`[TEAM-INFO] Found team info for: ${startupId}`);
        console.log(`[TEAM-INFO] Team info JSON:`, JSON.stringify(teamInfo, null, 2));
        return res.json({ success: true, teamInfo });
    } catch (err) {
        console.error(`[TEAM-INFO] ERROR:`, err);
        if (err instanceof Error) {
            console.error(`[TEAM-INFO] Error stack:`, err.stack);
        }
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

// RAG query route
app.use("/api/rag", ragRouter);

const PORT = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🚀 NiveshAI Server Started`);
    console.log(`📡 Server is running on port ${PORT}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}`);
    console.log(`📋 Available endpoints:`);
    console.log(`   POST /api/analyze - Upload and analyze startup files`);
    console.log(`   GET  /api/founder-verification/:startupId - Get founder verification`);
    console.log(`   POST /api/rag/query - RAG query endpoint`);
    console.log(`========================================`);
});