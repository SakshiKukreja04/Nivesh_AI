import vectorStore from "./vectorStore.js";
import { generateEmbedding } from "./embeddingService.js";
import { DocumentChunk } from "../types/index.js";

const MAX_QUERY_LENGTH = 1000;
const DEFAULT_TOP_K = 5;
const MAX_TOP_K = 20;

/**
 * Retrieves relevant context from vector store using RAG.
 * 
 * Pipeline: Query → Embedding → Vector Search → Top-K Results
 * 
 * @param query - User query string (will be sanitized)
 * @param topK - Number of top results to retrieve (default: 5, max: 20)
 * @returns Array of relevant document chunks with metadata
 */
export async function retrieveRelevantContext(query: string, topK: number = DEFAULT_TOP_K): Promise<DocumentChunk[]> {
  if (!query || typeof query !== "string") {
    console.warn("Empty or invalid query provided, returning empty results");
    return [];
  }

  // Sanitize and limit query length
  const sanitizedQuery = query.trim().slice(0, MAX_QUERY_LENGTH);
  
  // Validate topK
  const validTopK = Math.min(Math.max(1, Math.floor(topK)), MAX_TOP_K);

  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(sanitizedQuery);
    
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      console.warn("Invalid query embedding generated");
      return [];
    }

    // Query vector store for similar documents
    const results = await vectorStore.query(queryEmbedding, validTopK);
    
    // Validate results
    if (!Array.isArray(results)) {
      console.warn("Vector store returned invalid results");
      return [];
    }

    // Filter out invalid chunks
    const validResults = results.filter(
      (chunk): chunk is DocumentChunk =>
        chunk &&
        typeof chunk.id === "string" &&
        typeof chunk.text === "string" &&
        chunk.text.length > 0 &&
        typeof chunk.metadata === "object"
    );

    console.log(`Retrieved ${validResults.length} relevant chunks for query`);
    return validResults;
  } catch (err) {
    console.error("Error retrieving relevant context:", err);
    // Return empty array on error rather than throwing
    return [];
  }
}

export default { retrieveRelevantContext };
