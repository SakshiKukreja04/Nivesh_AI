import { createRequire } from "module";
// `pdf-parse` is CommonJS; use createRequire for compatibility in ESM
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

import fs from "fs/promises";
import path from "path";

// Max characters for extracted text to avoid overload (12k chosen within 10k-15k)
const MAX_TEXT_LENGTH = 12000;

// Directory to save uploaded audio files
const UPLOADS_DIR = path.resolve("./data/uploads");

// Ensure uploads dir exists
async function ensureUploadsDir() {
  try {
    await fs.mkdir(UPLOADS_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create uploads directory:", err);
  }
}
ensureUploadsDir();

/**
 * Detect file type based on MIME type and filename extension.
 * Returns 'pdf', 'txt', or 'unknown'.
 */
export function detectFileType(file) {
  if (!file || !file.mimetype) return "unknown";
  const mime = file.mimetype.toLowerCase();
  const name = (file.originalname || "").toLowerCase();

  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (mime === "text/plain" || name.endsWith(".txt") || name.endsWith(".eml") || mime === "message/rfc822") return "txt";
  if (mime.startsWith("audio/") || name.endsWith(".mp3") || name.endsWith(".wav")) return "audio";
  return "unknown";
}

/**
 * Extracts plain text from an uploaded file object (Multer file in memory).
 * - For PDFs uses `pdf-parse` on the buffer
 * - For TXT uses buffer.toString('utf-8')
 * Returns a trimmed string limited to MAX_TEXT_LENGTH.
 */
export async function processUploadedFile(file, type) {
  if (!file || !file.buffer) return { text: "", savedFile: null };

  try {
    let text = "";
    let savedFile = null;

    if (type === "pdf") {
      // pdf-parse accepts a Buffer and returns an object with `text`
      const data = await pdfParse(file.buffer);
      text = data && data.text ? String(data.text) : "";
    } else if (type === "txt") {
      // Plain text file
      text = file.buffer.toString("utf-8");
    } else if (type === "audio") {
      // For audio files, persist the upload and do not attempt transcription here.
      const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
      const outPath = path.join(UPLOADS_DIR, filename);
      await fs.writeFile(outPath, file.buffer);
      savedFile = outPath;
      text = ""; // No transcription performed
    } else {
      // Unknown type - attempt best-effort to decode as utf-8 text
      text = file.buffer.toString("utf-8");
    }

    // Normalize whitespace and trim
    text = text.replace(/\s+/g, " ").trim();

    // Limit text length to avoid overload
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.slice(0, MAX_TEXT_LENGTH);
    }

    return { text, savedFile };
  } catch (err) {
    // On failure, log and return empty values — do not forward raw buffers
    console.error("processUploadedFile error:", err);
    return { text: "", savedFile: null };
  }
}

export default { detectFileType, processUploadedFile };
