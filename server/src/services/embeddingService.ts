/**
 * Generates embeddings for text input.
 * 
 * Currently uses a deterministic local implementation for development.
 * For production, replace with a real embedding service (OpenAI, Cohere, etc.)
 * 
 * @param text - Input text to embed
 * @param dim - Embedding dimension (default: 128, should match vector store)
 * @returns Normalized embedding vector
 */
export async function generateEmbedding(text: string, dim: number = 128): Promise<number[]> {
  if (!text || typeof text !== "string") {
    return new Array<number>(dim).fill(0);
  }

  // Validate dimension
  const validDim = Math.max(64, Math.min(2048, Math.floor(dim)));
  
  const vec = new Array<number>(validDim).fill(0);
  
  // Generate deterministic embedding from text
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    const idx = i % validDim;
    vec[idx] += (code % 100) / 100; // Small contribution per character
  }

  // Normalize vector to unit length (L2 normalization)
  const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) {
    return vec; // Return zero vector if magnitude is zero
  }

  return vec.map((v) => v / magnitude);
}
