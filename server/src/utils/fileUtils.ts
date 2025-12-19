import fs from "fs/promises";
import path from "path";
import { createRequire } from "module";
import { ProcessedFile } from "../types/index.js";

// pdf-parse is CommonJS, use createRequire for ES modules
const require = createRequire(import.meta.url);
const pdfParseModule = require("pdf-parse");
// Handle both default export and named export cases
const pdfParse = pdfParseModule.default || pdfParseModule;

const MAX_TEXT_LENGTH = 50000; // Increased for better RAG context
const UPLOADS_DIR = path.resolve("./data/uploads");

async function ensureUploadsDir(): Promise<void> {
    try {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
    } catch (err) {
        console.error("Failed to create uploads directory:", err);
    }
}
ensureUploadsDir();

export type FileType = "pdf" | "txt" | "audio" | "unknown";

/**
 * Detects file type from Express Multer file object.
 */
export function detectFileType(file: Express.Multer.File | undefined): FileType {
    if (!file || !file.mimetype) return "unknown";
    
    const mime = file.mimetype.toLowerCase();
    const name = (file.originalname || "").toLowerCase();

    if (mime === "application/pdf" || name.endsWith(".pdf")) {
        return "pdf";
    }
    if (
        mime === "text/plain" ||
        name.endsWith(".txt") ||
        name.endsWith(".eml") ||
        mime === "message/rfc822"
    ) {
        return "txt";
    }
    if (mime.startsWith("audio/") || name.endsWith(".mp3") || name.endsWith(".wav")) {
        return "audio";
    }
    return "unknown";
}

/**
 * Processes uploaded file and extracts text content.
 * 
 * Supports: PDF, TXT, EML files
 * Audio files are saved but not processed (text extraction would require transcription service)
 * 
 * @param file - Express Multer file object
 * @param type - Detected file type
 * @returns Processed file with text content and optional saved file path
 */
export async function processUploadedFile(
    file: Express.Multer.File | undefined,
    type: FileType
): Promise<ProcessedFile> {
    if (!file || !file.buffer) {
        return { text: "", savedFile: null };
    }

    try {
        let text = "";
        let savedFile: string | null = null;

        switch (type) {
            case "pdf": {
                try {
                    // pdf-parse returns a promise that resolves to an object with text property
                    const data = await pdfParse(file.buffer);
                    text = data && data.text ? String(data.text) : "";
                } catch (err) {
                    console.error("PDF parsing error:", err);
                    text = "";
                }
                break;
            }
            case "txt": {
                try {
                    text = file.buffer.toString("utf-8");
                } catch (err) {
                    console.error("Text file processing error:", err);
                    text = "";
                }
                break;
            }
            case "audio": {
                // Save audio file for potential future transcription
                try {
                    const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
                    const outPath = path.join(UPLOADS_DIR, filename);
                    await fs.writeFile(outPath, file.buffer);
                    savedFile = outPath;
                    text = ""; // Audio files require transcription service
                } catch (err) {
                    console.error("Audio file save error:", err);
                }
                break;
            }
            default: {
                // Try to extract as text for unknown types
                try {
                    text = file.buffer.toString("utf-8");
                } catch (err) {
                    console.error("Unknown file type processing error:", err);
                    text = "";
                }
            }
        }

        // Normalize whitespace
        text = text.replace(/\s+/g, " ").trim();

        // Limit text length to prevent excessive processing
        if (text.length > MAX_TEXT_LENGTH) {
            text = text.slice(0, MAX_TEXT_LENGTH);
            console.warn(`Text truncated to ${MAX_TEXT_LENGTH} characters`);
        }

        return { text, savedFile };
    } catch (err) {
        console.error("processUploadedFile error:", err);
        return { text: "", savedFile: null };
    }
}