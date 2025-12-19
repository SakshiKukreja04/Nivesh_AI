import { VectorStore } from "./VectorStore.js";
import { DocumentChunk, EmbeddingVector } from "../types/index.js";
import { generateEmbedding } from "../services/embeddingService.js";
// import { detectFileType } from "../utils/fileUtils";

/**
 * LocalVectorStore is an in-memory implementation of the VectorStore interface.
 */
export class LocalVectorStore implements VectorStore {
  private store: Array<EmbeddingVector & { text?: string }> = [];

  /**
    * Adds a document to the vector store with optional metadata.
   * @param id - Unique identifier for the document.
   * @param text - Text content of the document.
   * @param metadata - Optional metadata associated with the document.
   */
  async addDocument(id: string, text: string, metadata?: Record<string, any>): Promise<void> {
    const values = await generateEmbedding(text);
    this.store.push({ id, values, metadata, text });
  }

  /**
   * Performs a similarity search in the vector store and returns top K results.
   * @param queryEmbedding - Embedding of the query.
   * @param topK - Number of top results to retrieve.
   * @returns Array of matching documents with their metadata.
   */
  // kept for backward compatibility internally
  async similaritySearch(queryEmbedding: number[], topK: number): Promise<Array<{ id: string; text: string; metadata?: Record<string, any>; score: number }>> {
    const results = this.store.map((item) => {
      const score = this.cosineSimilarity(queryEmbedding, item.values);
      return { id: item.id, text: item.text || "", metadata: item.metadata, score };
    });

    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  /**
   * Upserts an embedding for the given ID. If the ID exists, updates the embedding and metadata.
   * otherwise, adds a new entry.
   * @param id - Unique identifier for the document.
   * @param embedding - Embedding of the document.
   * @param metadata - Metadata associated with the document.
   */
  async upsertEmbedding(id: string, embedding: number[], metadata: any): Promise<void> {
    const existingIndex = this.store.findIndex((v) => v.id === id);
    const vec: EmbeddingVector & { text?: string } = { id, values: embedding, metadata, text: metadata?.text };
    if (existingIndex !== -1) this.store[existingIndex] = vec;
    else this.store.push(vec);
  }

  /**
   * Generates an embedding for the given text.
   * @param text - The text to generate an embedding for.
   * @returns A simulated embedding vector.
   */
  // Internal helper no longer used; embedding generation moved to embeddingService

  /**
   * Calculates the cosine similarity between two vectors.
   * @param vecA - First vector.
   * @param vecB - Second vector.
   * @returns The cosine similarity score.
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    const dotProduct = vecA.reduce((sum, a, idx) => sum + a * vecB[idx], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Processes a file, chunks its text, and stores each chunk in the vector store.
   * @param id - Unique identifier for the file.
   * @param filePath - Path to the file.
   * @param metadata - Optional metadata associated with the file.
   */
  async processFileAndStoreChunks(id: string, filePath: string, metadata?: Record<string, any>): Promise<void> {
    const content = await this.readFileContent(filePath);
    const chunks = this.chunkText(content, 1000);
    for (const [index, chunk] of chunks.entries()) {
      const chunkId = `${id}_chunk_${index}`;
      await this.addDocument(chunkId, chunk, metadata);
    }
  }

  /**
   * Reads the content of a file.
   * @param _filePath - Path to the file (unused in current implementation).
   * @returns The content of the file as a string.
   */
  private async readFileContent(_filePath: string): Promise<string> {
    // Placeholder implementation
    return "";
  }

  /**
   * Splits text into chunks of a specified size.
   * @param content - The text content to chunk.
   * @param chunkSize - The size of each chunk.
   * @returns An array of text chunks.
   */
  private chunkText(content: string, chunkSize: number): string[] {
    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * Queries for similar items based on the given embedding.
   * @param embedding - The embedding to query similar items for.
   * @param topK - The number of top similar items to retrieve.
   * @returns An array of top K similar items.
   */
  async querySimilar(embedding: number[], topK: number): Promise<DocumentChunk[]> {
    const results = this.store
      .map((item) => ({
        id: item.id,
        text: item.text || "",
        score: this.cosineSimilarity(embedding, item.values),
        metadata: item.metadata || {},
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map((r) => ({ id: r.id, text: r.text, metadata: r.metadata }));

    return results;
  }

  /**
   * Implements VectorStore.upsert - adds or updates vectors in the store.
   * @param vectors - Array of embedding vectors to upsert.
   */
  async upsert(vectors: EmbeddingVector[]): Promise<void> {
    for (const vec of vectors) {
      const existingIndex = this.store.findIndex((v) => v.id === vec.id);
      const vectorWithText: EmbeddingVector & { text?: string } = {
        ...vec,
        text: (vec.metadata?.text as string) || "",
      };
      if (existingIndex !== -1) {
        this.store[existingIndex] = vectorWithText;
      } else {
        this.store.push(vectorWithText);
      }
    }
  }

  /**
   * Implements VectorStore.query - queries for similar documents.
   * @param queryEmbedding - The query embedding vector.
   * @param topK - Number of top results to return.
   * @returns Array of document chunks matching the query.
   */
  async query(queryEmbedding: number[], topK: number): Promise<DocumentChunk[]> {
    return this.querySimilar(queryEmbedding, topK);
  }
}

/**
 * Placeholder for future AWS OpenSearch integration.
 * Replace LocalVectorStore with OpenSearchVectorStore for production.
 */
export class OpenSearchVectorStore implements VectorStore {
  async upsert(_vectors: EmbeddingVector[]): Promise<void> {
    throw new Error("OpenSearchVectorStore.upsert not implemented");
  }

  async query(_queryEmbedding: number[], _topK: number): Promise<DocumentChunk[]> {
    return [];
  }
}