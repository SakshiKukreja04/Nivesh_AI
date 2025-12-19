import { LocalVectorStore } from "../vectorstore/LocalVectorStore.js";
import { VectorStore } from "../vectorstore/VectorStore.js";

/**
 * Singleton vector store instance.
 * 
 * Currently uses LocalVectorStore (in-memory).
 * For production, replace with AWS OpenSearch or other vector database.
 * 
 * Example for AWS OpenSearch:
 * const store: VectorStore = new OpenSearchVectorStore();
 */
const store: VectorStore = new LocalVectorStore();

export default store;
