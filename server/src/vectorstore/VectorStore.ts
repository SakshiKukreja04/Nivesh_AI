import { DocumentChunk, EmbeddingVector } from "../types/index.js";

export interface VectorStore {
  upsert(vectors: EmbeddingVector[]): Promise<void>;
  query(queryEmbedding: number[], topK: number): Promise<DocumentChunk[]>;
}
