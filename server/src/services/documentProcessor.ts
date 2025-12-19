import { chunkText } from "../utils/textChunker.js";
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

      // Limit text length to prevent excessive processing
      const text = file.text.slice(0, MAX_TEXT_LENGTH);
      
      // Chunk the text with metadata
      const chunks = chunkText(text, {
        startupId,
        source: file.savedFile || "upload",
        ...(metadata || {}),
      });

      // Generate embeddings for each chunk
      for (const chunk of chunks) {
        try {
          const values = await generateEmbedding(chunk.text);
          
          // Validate embedding dimensions
          if (!Array.isArray(values) || values.length === 0) {
            console.warn(`Invalid embedding for chunk ${chunk.id}, skipping`);
            continue;
          }

          allVectors.push({
            id: chunk.id,
            values,
            metadata: {
              ...chunk.metadata,
              text: chunk.text, // Store text for retrieval
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
