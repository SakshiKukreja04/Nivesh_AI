import { PDFParse } from 'pdf-parse';

/**
 * Safely extracts text from a PDF buffer.
 * 
 * @param buffer - PDF file buffer
 * @returns Extracted text content, or empty string if extraction fails
 */
export async function parseResumePDF(buffer: Buffer): Promise<string> {
  try {
    if (!buffer || buffer.length === 0) {
      console.warn('[RESUME-PARSER] Empty PDF buffer provided');
      return '';
    }

    console.log(`[RESUME-PARSER] Parsing PDF buffer (${buffer.length} bytes)...`);
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    const text = typeof textResult.text === "string" ? textResult.text : "";

    if (!text || text.trim().length === 0) {
      console.warn('[RESUME-PARSER] No text extracted from PDF');
      return '';
    }

    console.log(`[RESUME-PARSER] Successfully extracted ${text.length} characters from PDF`);
    
    // Normalize whitespace
    return text.replace(/\s+/g, ' ').trim();
  } catch (error) {
    console.error('[RESUME-PARSER] Error parsing PDF resume:', error);
    if (error instanceof Error) {
      console.error('[RESUME-PARSER] Error stack:', error.stack);
    }
    return '';
  }
}

