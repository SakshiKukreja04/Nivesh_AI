import fs from "fs/promises";
import path from "path";
import { ProcessedFile } from "../types/index.js";
import { PDFParse } from "pdf-parse";

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

export type FileType = "pdf" | "txt" | "pptx" | "audio" | "unknown";

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
    if (
        mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
        name.endsWith(".pptx")
    ) {
        return "pptx";
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
        return { text: "", savedFile: null, fileType: type };
    }

    try {
        let text = "";
        let savedFile: string | null = null;

        switch (type) {
            case "pdf": {
                try {
                    const parser = new PDFParse({ data: file.buffer });
                    const textResult = await parser.getText();
                    text = typeof textResult.text === "string" ? textResult.text : "";
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
            case "pptx": {
                try {
                    // Save PPTX file temporarily for processing
                    const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
                    const tempPath = path.join(UPLOADS_DIR, filename);
                    await fs.writeFile(tempPath, file.buffer);
                    savedFile = tempPath;

                    // Basic text extraction using unzip and XML parsing (fallback)
                    // For now, we'll save the file but not extract text (requires additional setup)
                    text = ""; // PPTX text extraction would require additional libraries
                    console.warn("PPTX text extraction not implemented - file saved for future processing");
                } catch (err) {
                    console.error("PPTX file processing error:", err);
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


        // Enforce string-only text and add guard
        if (typeof text !== "string") {
            console.error(`[Ingestion] Non-string text detected for fileType ${type}:`, typeof text);
            throw new Error("ProcessedFile.text must be a string");
        }
        // Debug log: typeof and first 200 chars
        console.log(`[Ingestion] typeof text: ${typeof text}, first 200 chars:`, text.slice(0, 200));

        // Normalize whitespace
        text = text.replace(/\s+/g, " ").trim();

        // Limit text length to prevent excessive processing
        if (text.length > MAX_TEXT_LENGTH) {
            text = text.slice(0, MAX_TEXT_LENGTH);
            console.warn(`Text truncated to ${MAX_TEXT_LENGTH} characters`);
        }

        // Text validation: skip empty documents with logs
        if (!text || text.trim().length === 0) {
            console.warn(`Empty text extracted from ${type} file - skipping`);
            return { text: "", savedFile, fileType: type };
        }

        return { text, savedFile, fileType: type };
    } catch (err) {
        console.error("processUploadedFile error:", err);
        return { text: "", savedFile: null, fileType: type };
    }
}