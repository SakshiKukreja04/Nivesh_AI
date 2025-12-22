import fs from "fs/promises";
import path from "path";
import { ProcessedFile } from "../types/index";
import { PDFParse } from "pdf-parse";
import Tesseract from "tesseract.js";
// Use dynamic import for pdf-poppler to support ESM
let PdfConverter: any;
async function getPdfConverter() {
    if (!PdfConverter) {
        const pdfPoppler = await import("pdf-poppler");
        // Support both ESM and CommonJS interop
        PdfConverter = pdfPoppler.PdfConverter || (pdfPoppler.default && pdfPoppler.default.PdfConverter) || pdfPoppler.default;
    }
    return PdfConverter;
}
// Utility to save analysis summary and metadata to a JSON file in data/uploads
export async function saveAnalysisSummary(startupId: string, summary: string, metadata: any) {
    const uploadsDir = path.resolve("./data/uploads");
    await fs.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, `${startupId}-analysis.json`);
    const data = { summary, metadata };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    return filePath;
}
import os from "os";

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
                    // Try to extract text using PDFParse
                    const parser = new PDFParse({ data: file.buffer });
                    const textResult = await parser.getText();
                    text = typeof textResult.text === "string" ? textResult.text : "";
                    // Log first 500 chars for debugging
                    console.log("[PDF-Parse] First 500 chars:", text.slice(0, 500));
                } catch (err) {
                    console.error("PDF parsing error (PDF-Parse):", err);
                    text = "";
                }
                // If text extraction failed or is empty, fallback to OCR for all pages
                if (!text || text.trim().length < 1000) {
                    console.warn("[PDF-Parse] Text is empty or too short. Running OCR fallback for all pages...");
                    // Save PDF buffer to a temp file
                    const tmpDir = os.tmpdir();
                    const tmpPdfPath = path.join(tmpDir, `ocr-fallback-${Date.now()}.pdf`);
                    await fs.writeFile(tmpPdfPath, file.buffer);
                    // Dynamically import PdfConverter for ESM compatibility
                    const PdfConverterClass = await getPdfConverter();
                    const converter = new PdfConverterClass(tmpPdfPath);
                    const imageDir = path.join(tmpDir, `ocr-images-${Date.now()}`);
                    await fs.mkdir(imageDir, { recursive: true });
                    await converter.convert({ format: 'jpeg', out_dir: imageDir, out_prefix: 'page', page: null });
                    // Get all image files
                    const imageFiles = (await fs.readdir(imageDir)).filter(f => f.endsWith('.jpg') || f.endsWith('.jpeg'));
                    let ocrText = '';
                    for (const imgFile of imageFiles) {
                        const imgPath = path.join(imageDir, imgFile);
                        const ocrResult = await Tesseract.recognize(imgPath, 'eng');
                        ocrText += ocrResult.data.text + '\n';
                    }
                    text = ocrText.trim();
                    console.log("[OCR] First 500 chars:", text.slice(0, 500));
                    // Cleanup temp files
                    try { await fs.unlink(tmpPdfPath); } catch {}
                    for (const imgFile of imageFiles) {
                        try { await fs.unlink(path.join(imageDir, imgFile)); } catch {}
                    }
                    try { await fs.rmdir(imageDir); } catch {}
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