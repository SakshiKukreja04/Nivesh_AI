# Postman Testing Guide for NiveshAI Backend API

Complete step-by-step guide to test all API endpoints using Postman.

---

## 📋 Prerequisites

1. **Postman Installed**: Download from [postman.com](https://www.postman.com/downloads/)
2. **Server Running**: Make sure the backend server is running on `http://localhost:3000`
3. **Sample Files**: Have a PDF or text file ready for testing (you can use `sample_transcript.txt`)

---

## 🚀 Step 1: Import Postman Collection

### Option A: Import Collection JSON File

1. Open Postman
2. Click **Import** button (top left)
3. Click **Upload Files**
4. Select `NiveshAI_API.postman_collection.json` from the `server/` directory
5. Click **Import**

### Option B: Create Environment Variable

1. In Postman, click **Environments** (left sidebar)
2. Click **+** to create a new environment
3. Name it: `NiveshAI Local`
4. Add variable:
   - **Variable**: `baseUrl`
   - **Initial Value**: `http://localhost:3000`
   - **Current Value**: `http://localhost:3000`
5. Click **Save**
6. Select this environment from the dropdown (top right)

---

## 📤 Step 2: Test File Upload & Analysis Endpoint

### Endpoint: `POST /api/analyze`

This endpoint uploads startup files and metadata, processes them through the RAG pipeline, and returns AI analysis.

#### Steps:

1. **Open the Request**:
   - In Postman, find the collection: **NiveshAI Backend API**
   - Expand **File Upload & Analysis**
   - Click **1. Upload Pitch Deck and Analyze**

2. **Configure Request**:
   - Method: `POST` (already set)
   - URL: `{{baseUrl}}/api/analyze` (uses environment variable)

3. **Set Body**:
   - Go to **Body** tab
   - Select **form-data** (not raw or x-www-form-urlencoded)
   - Add the following fields:

   | Key | Type | Value |
   |-----|------|-------|
   | `startupName` | Text | `TechFlow AI` |
   | `location` | Text | `San Francisco, CA` |
   | `stage` | Text | `Series A` |
   | `sector` | Text | `SaaS` |
   | `businessModel` | Text | `B2B` |
   | `website` | Text | `https://techflow.ai` |
   | `fundingRaised` | Text | `$2.5M` |
   | `teamSize` | Text | `15` |
   | `additionalNotes` | Text | `A promising B2B SaaS startup` |
   | `pitchDeck` | **File** | Click **Select Files** and choose a PDF or text file |

4. **Send Request**:
   - Click **Send** button
   - Wait for response (may take 30-60 seconds)

5. **Verify Response**:
   - Status should be `200 OK`
   - Response body should contain:
     ```json
     {
       "success": true,
       "analysis": {
         "summary": "...",
         "topRisks": [...],
         "teamAssessment": "...",
         "marketOutlook": "..."
       },
       "startupId": "techflow-ai"
     }
     ```

6. **Check Test Results**:
   - Scroll down to **Test Results** tab
   - All tests should pass:
     - ✅ Status code is 200
     - ✅ Response has success field
     - ✅ Response contains analysis
     - ✅ Response contains startupId

---

## 🔍 Step 3: Test RAG Query Endpoints

### Endpoint: `POST /api/rag/query`

This endpoint queries the RAG system with specific questions about the startup.

#### Test 1: Risk Analysis Query

1. **Open Request**:
   - Expand **RAG Query Endpoints**
   - Click **1. Query - Risk Analysis**

2. **Configure Request**:
   - Method: `POST`
   - URL: `{{baseUrl}}/api/rag/query`
   - Headers: `Content-Type: application/json` (should be auto-set)

3. **Set Body**:
   - Go to **Body** tab
   - Select **raw**
   - Choose **JSON** from dropdown
   - Body is pre-filled, but you can modify:
     ```json
     {
       "startupContext": {
         "startupName": "TechFlow AI",
         "location": "San Francisco, CA",
         "stage": "Series A",
         "sector": "SaaS",
         "businessModel": "B2B",
         "website": "https://techflow.ai",
         "fundingRaised": "$2.5M",
         "teamSize": "15"
       },
       "userQuery": "What are the main risks for this startup?"
     }
     ```

4. **Send Request**:
   - Click **Send**
   - Wait for response

5. **Verify Response**:
   - Status: `200 OK`
   - Response structure:
     ```json
     {
       "success": true,
       "analysis": {
         "summary": "...",
         "topRisks": ["...", "..."],
         "teamAssessment": "...",
         "marketOutlook": "..."
       }
     }
     ```

6. **Check Console**:
   - Click **Console** (bottom of Postman)
   - Look for: `Groq Analysis Response:` log
   - This shows the full Groq API response

#### Test 2: Team Assessment Query

1. Click **2. Query - Team Assessment**
2. The request is pre-configured
3. Click **Send**
4. Verify the response contains team assessment

#### Test 3: Market Analysis Query

1. Click **3. Query - Market Analysis**
2. Click **Send**
3. Verify market outlook in response

#### Test 4: Valuation Notes Query

1. Click **4. Query - Valuation Notes**
2. Click **Send**
3. Check for `valuationNotes` in response (if provided by Groq)

---

## ✅ Step 4: Verify Groq API Integration

### Check Server Console

1. Look at your server terminal/console where `npm start` is running
2. You should see logs like:
   ```
   Successfully stored X vectors for startup techflow-ai
   Retrieved X relevant chunks for query
   ```

### Verify Groq Response Structure

1. In Postman, after sending a RAG query:
2. Check the **Console** tab (bottom of Postman)
3. Look for the logged Groq response
4. Verify it contains:
   - `summary` (string)
   - `topRisks` (array of strings)
   - `teamAssessment` (string)
   - `marketOutlook` (string)
   - `valuationNotes` (optional string)

### Expected Groq Response Format

```json
{
  "summary": "TechFlow AI is a B2B SaaS platform...",
  "topRisks": [
    "Limited runway - 8 months at current burn",
    "Key person dependency on CTO"
  ],
  "teamAssessment": "Strong founding team with prior exits...",
  "marketOutlook": "Large and growing market opportunity...",
  "valuationNotes": "Valuation appears reasonable given..."
}
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to server"

**Solution**:
- Verify server is running: `npm start` in `server/` directory
- Check URL is correct: `http://localhost:3000`
- Verify environment variable `baseUrl` is set

### Error: "No files uploaded"

**Solution**:
- Make sure you selected **form-data** (not raw) in Body tab
- Verify the file field is set to **File** type (not Text)
- Check file field name is exactly: `pitchDeck`, `transcript`, or `email`

### Error: "startupContext is required"

**Solution**:
- Verify Content-Type header is `application/json`
- Check JSON body is valid (use JSON validator)
- Ensure `startupContext` is an object, not a string

### Error: "GROQ_API_KEY not configured"

**Solution**:
- Create `.env` file in `server/` directory
- Add: `GROQ_API_KEY=your_api_key_here`
- Restart the server

### Response is slow (>30 seconds)

**This is normal**:
- File processing (PDF parsing, chunking)
- Embedding generation
- Vector store operations
- Groq API call
- All combined can take 30-60 seconds

### No analysis in response

**Check**:
- Server console for error messages
- Groq API key is valid
- Files were successfully uploaded
- Vector store has stored documents (check server logs)

---

## 📊 Testing Checklist

Use this checklist to verify all functionality:

- [ ] Server starts without errors
- [ ] Postman collection imported successfully
- [ ] Environment variable `baseUrl` configured
- [ ] File upload endpoint returns 200 OK
- [ ] File upload response contains `analysis` object
- [ ] File upload response contains `startupId`
- [ ] RAG query endpoint returns 200 OK
- [ ] RAG query response contains Groq analysis
- [ ] Analysis contains `summary` field
- [ ] Analysis contains `topRisks` array
- [ ] Analysis contains `teamAssessment` field
- [ ] Analysis contains `marketOutlook` field
- [ ] Server console shows vector storage logs
- [ ] Server console shows retrieval logs
- [ ] Groq API response logged in Postman console

---

## 🎯 Quick Test Sequence

1. **Start Server**: `cd server && npm start`
2. **Import Collection**: Import `NiveshAI_API.postman_collection.json`
3. **Set Environment**: Create environment with `baseUrl = http://localhost:3000`
4. **Test Upload**: Run "1. Upload Pitch Deck and Analyze"
5. **Verify Response**: Check for `success: true` and `analysis` object
6. **Test Query**: Run "1. Query - Risk Analysis"
7. **Check Groq**: Verify response in Postman console
8. **Review Logs**: Check server console for processing logs

---

## 📝 Notes

- **File Upload**: Supports PDF, TXT, and EML files
- **RAG Pipeline**: Files are automatically chunked, embedded, and stored
- **Groq Integration**: Uses retrieved context from vector store before calling Groq
- **Response Time**: First request may be slower due to processing
- **Vector Store**: Uses in-memory storage (resets on server restart)

---

## 🔗 Additional Resources

- **Postman Documentation**: https://learning.postman.com/
- **Groq API Docs**: https://console.groq.com/docs
- **Server Logs**: Check terminal where `npm start` is running

---

**Happy Testing! 🚀**

