import { v4 as uuidv4 } from "uuid";

const DEFAULT_CHUNK_SIZE = 500; // Approximate tokens
const DEFAULT_OVERLAP = 50;
const MIN_CHUNK_SIZE = 50;
const MAX_CHUNK_SIZE = 2000;

/**
 * Chunks text into token-sized chunks with overlap for better context preservation.
 * 
 * Uses word-based chunking to preserve semantic boundaries.
 * 
 * @param text - The raw text to chunk
 * @param metadata - Metadata to attach to each chunk
 * @param chunkSize - Approximate size of each chunk in words (default: 500)
 * @param overlap - Number of overlapping words between chunks (default: 50)
 * @returns Array of text chunks with metadata
 */
export function chunkText(
    text: string,
    metadata: Record<string, unknown>,
    chunkSize: number = DEFAULT_CHUNK_SIZE,
    overlap: number = DEFAULT_OVERLAP
): Array<{ id: string; text: string; metadata: Record<string, unknown> }> {
    if (!text || typeof text !== "string" || text.trim().length === 0) {
        return [];
    }

    // Validate and clamp parameters
    const validChunkSize = Math.max(MIN_CHUNK_SIZE, Math.min(MAX_CHUNK_SIZE, Math.floor(chunkSize)));
    const validOverlap = Math.max(0, Math.min(validChunkSize - 1, Math.floor(overlap)));

    // Split text into words
    const words = text.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length === 0) {
        return [];
    }

    const chunks: Array<{ id: string; text: string; metadata: Record<string, unknown> }> = [];
    const stepSize = validChunkSize - validOverlap;

    // Create chunks with overlap
    for (let i = 0; i < words.length; i += stepSize) {
        const chunkWords = words.slice(i, i + validChunkSize);
        const chunkText = chunkWords.join(" ").trim();

        // Only add non-empty chunks
        if (chunkText.length > 0) {
            chunks.push({
                id: uuidv4(),
                text: chunkText,
                metadata: {
                    ...metadata,
                    chunkIndex: chunks.length,
                    chunkStart: i,
                    chunkEnd: Math.min(i + validChunkSize, words.length),
                },
            });
        }
    }

    return chunks;
}