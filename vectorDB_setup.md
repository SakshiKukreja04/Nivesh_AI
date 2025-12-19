# Setting Up and Connecting to Pinecone Vector Database

This guide provides step-by-step instructions to set up and connect Pinecone as the vector database for use in the NiveshAI platform. The `vectorStore.js` implementation is already complete, so follow the steps below to integrate and test the setup.

---

## Step 1: Create a Pinecone Account

1. Go to [Pinecone](https://www.pinecone.io/).
2. Sign up for an account.
3. Create a new project in the Pinecone dashboard.
4. Note down the following details:
   - **API Key**
   - **Environment**
   - **Index Name**

---

## Step 2: Install Required Dependencies

Ensure the Pinecone client library is installed in your project:

```bash
npm install @pinecone-database/pinecone
```

---

## Step 3: Add Environment Variables

Add the following environment variables to your `.env` file:

```env
PINECONE_API_KEY=your-pinecone-api-key
PINECONE_ENVIRONMENT=your-pinecone-environment
PINECONE_INDEX_NAME=your-index-name
```

---

## Step 4: Create the Vector Index

1. Go to the Pinecone dashboard.
2. Create a new index with the following settings:
   - **Dimension**: Match the size of your embedding vectors (e.g., 1536 for OpenAI embeddings).
   - **Metric**: `cosine` (recommended for similarity search).
   - **Pods**: Choose the appropriate number of pods based on your workload.

---

## Step 5: Test the VectorStore Implementation

The `vectorStore.js` file already includes the following functions:

- **`upsertVectors(chunks)`**: Adds embeddings and metadata to the Pinecone index.
- **`queryVectors(queryEmbedding, filters, topK)`**: Retrieves relevant vectors based on a query embedding and metadata filters.

### Create a Test Script

1. Create a new file `testVectorDB.js` in the `server` directory.
2. Add the following code:

```javascript
import { upsertVectors, queryVectors } from './services/vectorStore';

(async () => {
  const testChunks = [
    {
      id: 'test1',
      embedding: [0.1, 0.2, 0.3],
      metadata: { startupId: '123', documentType: 'pdf' },
    },
  ];

  console.log('Upserting test vectors...');
  await upsertVectors(testChunks);

  console.log('Querying vectors...');
  const results = await queryVectors([0.1, 0.2, 0.3], { startupId: '123' });
  console.log('Query Results:', results);
})();
```

3. Run the script:

```bash
node testVectorDB.js
```

4. Verify that the vectors are successfully upserted and queried.

---

## Step 6: Integrate with the RAG Pipeline

Ensure the `vectorStore.js` functions are used in the RAG pipeline for:

1. **Storing Embeddings**:
   - During document processing, use `upsertVectors` to store embeddings and metadata in the Pinecone index.

2. **Retrieving Relevant Chunks**:
   - During query-time, use `queryVectors` to retrieve relevant text snippets based on the user query.

---

## Step 7: Monitor and Optimize

- Use the Pinecone dashboard to monitor usage and optimize performance.
- Adjust the number of pods or index settings as needed.

---

You have now successfully set up and connected Pinecone as the vector database for use in the NiveshAI platform!