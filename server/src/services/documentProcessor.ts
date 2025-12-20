import { chunkText } from "../utils/textChunker.js";
import { normalizeToPlainText } from "../utils/normalizeText.js";
import vectorStore from "./vectorStore.js";
import { generateEmbedding } from "./embeddingService.js";
import { EmbeddingVector, ProcessedFile } from "../types/index.js";

const MAX_TEXT_LENGTH = 50000;

/**
 * Processes and stores documents in the vector store for RAG retrieval.
 * 
 * Pipeline: Text → Chunking → Embedding → Vector Store
 * 
 * @param startupId - Unique identifier for the startup
 * @param files - Array of processed files with text content
 * @param metadata - Additional metadata to attach to chunks
 */
export async function processAndStoreDocuments(
  startupId: string,
  files: ProcessedFile[],
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!startupId || typeof startupId !== "string") {
    throw new Error("startupId must be a non-empty string");
  }

  const allVectors: EmbeddingVector[] = [];

  try {

    for (const file of files) {
      if (!file || !file.text) {
        console.warn("Skipping file with no text content");
        continue;
      }

      // Normalize to plain string (flatten arrays/objects)
      let normalizedText = normalizeToPlainText(file.text);
      // Limit text length to prevent excessive processing
      normalizedText = normalizedText.slice(0, MAX_TEXT_LENGTH);
      // Debug log: print first 300 chars of normalized text
      console.log(`[Ingestion] Normalized text (first 300 chars):`, normalizedText.slice(0, 300));

      // Chunk the text with metadata
      const chunks = chunkText(normalizedText, {
        startupId,
        source: file.savedFile || "upload",
        ...(metadata || {}),
      });

      for (const chunk of chunks) {
        // Hard guard: chunk.text must be string
        if (typeof chunk.text !== "string") {
          console.error(`[Ingestion] Invalid chunk.text type:`, typeof chunk.text, chunk.text);
          continue;
        }
        // Debug log: typeof and first 200 chars
        console.log(`[Ingestion] typeof chunk.text: ${typeof chunk.text}, first 200 chars:`, chunk.text.slice(0, 200));

        try {
          const values = await generateEmbedding(chunk.text);
          // Validate embedding dimensions
          if (!Array.isArray(values) || values.length === 0) {
            console.warn(`Invalid embedding for chunk ${chunk.id}, skipping`);
            continue;
          }
          // Enforce string-only for metadata.text
          allVectors.push({
            id: chunk.id,
            values,
            metadata: {
              ...chunk.metadata,
              text: typeof chunk.text === "string" ? chunk.text : String(chunk.text),
            },
          });
        } catch (err) {
          console.error(`Error generating embedding for chunk ${chunk.id}:`, err);
          // Continue with other chunks
        }
      }
    }

    // Batch upsert all vectors
    if (allVectors.length > 0) {
      await vectorStore.upsert(allVectors);
      console.log(`Successfully stored ${allVectors.length} vectors for startup ${startupId}`);
    } else {
      console.warn(`No vectors to store for startup ${startupId}`);
    }
  } catch (err) {
    console.error("Error processing and storing documents:", err);
    throw new Error(`Failed to process documents: ${err instanceof Error ? err.message : "Unknown error"}`);
  }
}

export default { processAndStoreDocuments };
