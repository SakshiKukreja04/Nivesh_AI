
import dotenv from "dotenv";
dotenv.config();
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { processUploadedFile, detectFileType } from "./utils/fileUtils.js";
import { processAndStoreDocuments } from "./services/documentProcessor.js";
import { analyzeWithRAG } from "./services/groqAnalyzer.js";
import ragRouter from "./routes/ragQuery.route.js";
import productTechRouter from './routes/productTech.route.js';
import { extractProductTechSignals } from './services/productTechExtractor.js';
import { polishProductTechWithGroq } from './services/productTechGroqAnalyzer.js';
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY);
console.log('GROQ_API_URL:', process.env.GROQ_API_URL);

// Ensure DATA_DIR is declared before use
const DATA_DIR = path.resolve("./data");

const PRODUCT_TECH_FILE = path.join(DATA_DIR, 'productTech.json');

function loadProductTech() {
    try {
        if (!fs.existsSync(PRODUCT_TECH_FILE)) return {};
        return JSON.parse(fs.readFileSync(PRODUCT_TECH_FILE, 'utf-8'));
    } catch {
        return {};
    }
}
function saveProductTech(startupId: string, signals: any) {
    const all = loadProductTech();
    all[startupId] = signals;
    fs.writeFileSync(PRODUCT_TECH_FILE, JSON.stringify(all, null, 2));
}

import { ProcessedFile, StartupMetadata, FounderVerificationResult, TeamInfo } from "./types/index.js";
import { extractClaims } from "./services/claimExtractor.js";

import { validateMarketOpportunity, MarketOpportunityInput, MarketOpportunityValidationResult } from "./services/marketOpportunityValidator.js";
const MARKET_OPPORTUNITY_FILE = path.join(DATA_DIR, "marketOpportunity.json");

async function loadMarketOpportunities(): Promise<Record<string, MarketOpportunityValidationResult>> {
    try {
        const data = await fsPromises.readFile(MARKET_OPPORTUNITY_FILE, "utf-8");
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
}

async function saveMarketOpportunity(startupId: string, result: MarketOpportunityValidationResult): Promise<void> {
    try {
        const allResults = await loadMarketOpportunities();
        allResults[startupId] = result;
        await fsPromises.writeFile(MARKET_OPPORTUNITY_FILE, JSON.stringify(allResults, null, 2));
        console.log(`[SAVE-MARKET-OPPORTUNITY] Saved for ${startupId}`);
    } catch (err) {
        console.error("[SAVE-MARKET-OPPORTUNITY] Error saving:", err);
    }
}
import { parseResumePDF } from "./utils/resumeParser.js";

import { extractResumeSignals } from "./services/resumeSignalExtractor.js";
import { extractTeamInfo } from "./services/teamExtractor.js";
const FOUNDER_VERIFICATIONS_FILE = path.join(DATA_DIR, "founderVerifications.json");
const TEAM_INFO_FILE = path.join(DATA_DIR, "teamInfo.json");

const app = express();

// Get startup metadata, claims, and summary by startup ID
app.get("/api/startup/:startupId", async (req: Request, res: Response) => {
    const { startupId } = req.params;
    try {
        // Load metadata from startups.json
        const startupsPath = path.join(DATA_DIR, "startups.json");
        let metadata = {};
        if (fs.existsSync(startupsPath)) {
            const startupsArr = JSON.parse(fs.readFileSync(startupsPath, "utf-8"));
            const found = startupsArr.find((s: any) => (s.id === startupId || (s.metadata && s.metadata.name?.toLowerCase().replace(/\s+/g, "-") === startupId)));
            if (found && found.metadata) metadata = found.metadata;
        }

        // Load claims from claims.json (if exists)
        let claims: any[] = [];
        const claimsPath = path.join(DATA_DIR, "claims.json");
        if (fs.existsSync(claimsPath)) {
            const allClaims = JSON.parse(fs.readFileSync(claimsPath, "utf-8"));
            if (allClaims[startupId]) claims = allClaims[startupId];
        }

        // Load summary from analysis.json (if exists)
        let summary = "";
        const analysisPath = path.join(DATA_DIR, "analysis.json");
        if (fs.existsSync(analysisPath)) {
            const allAnalysis = JSON.parse(fs.readFileSync(analysisPath, "utf-8"));
            if (allAnalysis[startupId] && allAnalysis[startupId].summary) summary = allAnalysis[startupId].summary;
        }

        // Load market opportunity validation result
        let marketOpportunity = undefined;
        try {
            const allMarketOpp = await loadMarketOpportunities();
            if (allMarketOpp[startupId]) marketOpportunity = allMarketOpp[startupId];
        } catch (e) {
            console.warn(`[STARTUP-GET] Could not load market opportunity for ${startupId}`);
        }

        // Load product/tech signals
        let productTech = undefined;
        try {
            const productTechPath = path.join(DATA_DIR, "productTech.json");
            if (fs.existsSync(productTechPath)) {
                const allProductTech = JSON.parse(fs.readFileSync(productTechPath, "utf-8"));
                if (allProductTech[startupId]) productTech = allProductTech[startupId];
            }
        } catch (e) {
            console.warn(`[STARTUP-GET] Could not load product/tech for ${startupId}`);
        }

        return res.json({ success: true, metadata, claims, summary, marketOpportunity, productTech });
    } catch (err) {
        console.error(`[STARTUP-GET] ERROR:`, err);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
});

async function ensureDataDir(): Promise<void> {
    try {
        await fsPromises.mkdir(DATA_DIR, { recursive: true });
    } catch (err) {
        console.error("Failed to create data directory:", err);
    }
}

async function loadFounderVerifications(): Promise<Record<string, FounderVerificationResult>> {
    try {
        const data = await fsPromises.readFile(FOUNDER_VERIFICATIONS_FILE, "utf-8");
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
        await fsPromises.writeFile(FOUNDER_VERIFICATIONS_FILE, JSON.stringify(verifications, null, 2));
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
        const data = await fsPromises.readFile(TEAM_INFO_FILE, "utf-8");
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
        await fsPromises.writeFile(TEAM_INFO_FILE, JSON.stringify(allTeamInfo, null, 2));
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
import { analyzeTeamRoleImportanceLLM } from "./services/groqAnalyzer.js";
// (removed duplicate import fs from "fs")
app.use(cors());
app.use(express.json());

// Add request logging middleware (must be before routes)
app.use((req: Request, _res: Response, next: NextFunction) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    // Safely check req.body - it might be undefined or null for multipart/form-data requests
    if (req.body && req.body !== null && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
        if (req.method !== 'POST' || (req.method === 'POST' && !req.path.includes('/api/'))) {
            console.log(`  Body:`, JSON.stringify(req.body, null, 2).substring(0, 200));
        }
    }
    if ((req as any).files) {
        const fileInfo = Object.entries((req as any).files as { [key: string]: Express.Multer.File[] }).map(([key, files]) => 
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

                        // === Product/Tech Extraction and Save ===
                        // Try to extract product/tech signals from pitch deck text (if available)
                        let productTechSignals = null;
                        const pitchDeckText = processedFiles.find(f => f.fileType === 'pdf' || f.fileType === 'pptx')?.text || '';
                        if (pitchDeckText && pitchDeckText.length > 30) {
                            // Naive section splitter: split by lines with ALL CAPS or numbers (simulate sections)
                            const sectionChunks = pitchDeckText
                                .split(/\n(?=[A-Z0-9 .\-]{5,}\n)/)
                                .map((chunk, i) => ({ section: `Section ${i + 1}`, text: chunk.trim() }))
                                .filter(c => c.text.length > 30);
                            if (sectionChunks.length > 0) {
                                const extracted = extractProductTechSignals(pitchDeckText, sectionChunks);
                                try {
                                    const groq = await polishProductTechWithGroq(extracted);
                                    productTechSignals = { ...extracted, ...groq };
                                    saveProductTech(startupId, productTechSignals);
                                    console.log(`[ANALYZE] Product/Tech signals extracted and saved.`);
                                } catch (err) {
                                    console.error(`[ANALYZE] Product/Tech Groq error:`, err);
                                }
                            } else {
                                console.log(`[ANALYZE] No section chunks found for product/tech extraction.`);
                            }
                        } else {
                            console.log(`[ANALYZE] No pitch deck text for product/tech extraction.`);
                        }

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

            // Process CV if provided, else try pitch deck for founder verification
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
                            const role = (req.body && (req.body as any).role as string) || "Founder";
                            founderVerification = await extractResumeSignals(resumeText, startupId, role);
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
                console.log(`[ANALYZE] No CV file provided. Attempting to extract founder verification from pitch deck text...`);
                // Try to extract from pitch deck text if available
                const pitchDeckText = processedFilesWithKeys.find(f => f.fileKey === "pitchDeck")?.text || "";
                if (pitchDeckText && pitchDeckText.trim().length > 0) {
                    try {
                        const role = (req.body && (req.body as any).role as string) || "Founder";
                        founderVerification = await extractResumeSignals(pitchDeckText, startupId, role);
                        await saveFounderVerification(founderVerification);
                        console.log(`[ANALYZE] Founder verification extracted from pitch deck text.`);
                        console.log(JSON.stringify(founderVerification, null, 2));
                    } catch (err) {
                        console.error(`[ANALYZE] ERROR extracting founder verification from pitch deck:`, err);
                        if (err instanceof Error) {
                            console.error(`[ANALYZE] Error stack:`, err.stack);
                        }
                    }
                } else {
                    console.log(`[ANALYZE] No pitch deck text available for founder verification extraction.`);
                }
            }


            // Extract and log claims from all processed files
            console.log(`[ANALYZE] Processing ${processedFiles.length} files...`);
            const documentChunks = processedFiles
                .filter(f => f && f.text)
                .map((f, idx) => ({ id: String(idx + 1), text: f.text, metadata: {} }));
            const claims = extractClaims(documentChunks);
            console.log(`[ANALYZE] Extracted ${claims.length} claims`);
            console.log(`[ANALYZE] Claims JSON:`, JSON.stringify(claims, null, 2));

            // Market Opportunity Validation
            let marketOpportunityResult: MarketOpportunityValidationResult | null = null;
            try {
                // Extract required values from claims and metadata
                const sector = (metadata.sector || "").toLowerCase();
                let sectorKey: "SaaS" | "Fintech" | "Healthtech" | null = null;
                if (sector === "saas") sectorKey = "SaaS";
                if (sector === "fintech") sectorKey = "Fintech";
                if (sector === "healthtech") sectorKey = "Healthtech";
                if (sectorKey) {
                    // Find TAM, SAM, SOM, growthRate from claims (prefer numbers, fallback to 0)
                    const getClaimValue = (key: string) => {
                        const found = claims.find(c => c.claim.toLowerCase().includes(key.toLowerCase()));
                        return typeof found?.value === "number" ? found.value : (typeof found?.[key] === "number" ? found[key] : 0);
                    };
                    const TAM = getClaimValue("TAM");
                    const SAM = getClaimValue("SAM");
                    const SOM = getClaimValue("SOM");
                    const growthRate = getClaimValue("growthRate");
                    if (TAM && SAM && SOM && growthRate) {
                        const input: MarketOpportunityInput = { sector: sectorKey, TAM, SAM, SOM, growthRate };
                        marketOpportunityResult = validateMarketOpportunity(input);
                        await saveMarketOpportunity(startupId, marketOpportunityResult);
                        console.log(`[ANALYZE] Market Opportunity Validation:`, JSON.stringify(marketOpportunityResult, null, 2));
                    } else {
                        console.log(`[ANALYZE] Market Opportunity: Missing required values (TAM/SAM/SOM/growthRate)`);
                    }
                } else {
                    console.log(`[ANALYZE] Market Opportunity: Sector not supported for validation`);
                }
            } catch (err) {
                console.error(`[ANALYZE] Market Opportunity Validation error:`, err);
            }

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
                teamInfo: teamInfo || undefined,
                claims: claims || [],
                metadata: metadata || {},
                summary: analysis?.summary || "",
                marketOpportunity: marketOpportunityResult || undefined,
                productTech: productTechSignals || undefined
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
    const params = req.params as { startupId: string };
    console.log(`[FOUNDER-VERIFICATION] Request for startupId: ${params.startupId}`);
    try {
        const { startupId } = params;
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
    const params = req.params as { startupId: string };
    console.log(`[TEAM-INFO] Request for startupId: ${params.startupId}`);
    try {
        const { startupId } = params;
        const allTeamInfo = await loadTeamInfo();
        console.log(`[TEAM-INFO] Available startupIds:`, Object.keys(allTeamInfo));
        const teamInfo = allTeamInfo[startupId];

        if (!teamInfo) {
            console.log(`[TEAM-INFO] Not found for: ${startupId}`);
            return res.status(404).json({ success: false, error: "Team info not found" });
        }

        // Get the domain/sector for AI analysis (fallback to "startup" if not found)
        let domain = "startup";
        try {
            // Try to load metadata if available (optional, not fatal if missing)
            const metadataPath = `./data/startups.json`;
            if (fs.existsSync(metadataPath)) {
                const startups = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
                if (startups[startupId] && startups[startupId].sector) {
                    domain = startups[startupId].sector;
                }
            }
        } catch (e) {
            console.warn(`[TEAM-INFO] Could not load sector/domain for AI analysis:`, e);
        }

        // Add AI analysis to each team member using LLM
        const membersWithAI = await Promise.all(
            teamInfo.members.map(async member => ({
                ...member,
                aiAnalysis: await analyzeTeamRoleImportanceLLM(member.role || "", domain)
            }))
        );

        const teamInfoWithAI = {
            ...teamInfo,
            members: membersWithAI
        };

        console.log(`[TEAM-INFO] Found team info for: ${startupId}`);
        console.log(`[TEAM-INFO] Team info JSON:`, JSON.stringify(teamInfoWithAI, null, 2));
        return res.json({ success: true, teamInfo: teamInfoWithAI });
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
app.use(productTechRouter);

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