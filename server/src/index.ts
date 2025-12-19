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
import { ProcessedFile, StartupMetadata } from "./types/index.js";

const DATA_DIR = path.resolve("./data");

async function ensureDataDir(): Promise<void> {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (err) {
        console.error("Failed to create data directory:", err);
    }
}

ensureDataDir();
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage() });

// File upload and analysis endpoint
app.post("/api/analyze",
    upload.fields([
        { name: "pitchDeck", maxCount: 1 },
        { name: "transcript", maxCount: 1 },
        { name: "email", maxCount: 1 },
    ]),
    async (req: Request, res: Response) => {
        try {
            const metadata = req.body as StartupMetadata;
            const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;

            if (!files || Object.keys(files).length === 0) {
                return res.status(400).json({ success: false, error: "No files uploaded" });
            }

            // Process uploaded files
            const processedFiles: ProcessedFile[] = await Promise.all(
                Object.entries(files).map(async ([, fileArray]) => {
                    const file = fileArray[0];
                    if (!file) {
                        return { text: "", savedFile: null };
                    }
                    const fileType = detectFileType(file);
                    return processUploadedFile(file, fileType);
                })
            );

            // Store documents in vector store for RAG
            const startupId = metadata.startupName?.toLowerCase().replace(/\s+/g, "-") || `startup-${Date.now()}`;
            await processAndStoreDocuments(startupId, processedFiles, metadata);

            // Perform RAG-based analysis
            const userQuery = `Analyze this startup: ${metadata.startupName || "Unknown"}. Provide a comprehensive assessment including summary, risks, team evaluation, and market outlook.`;
            const analysis = await analyzeWithRAG(metadata, userQuery);

            return res.json({ success: true, analysis, startupId });
        } catch (err) {
            console.error("Error analyzing startup:", err);
            return res.status(500).json({ success: false, error: "Internal Server Error" });
        }
    }
);

// RAG query route
app.use("/api/rag", ragRouter);

const PORT = parseInt(process.env.PORT || "3000", 10);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});