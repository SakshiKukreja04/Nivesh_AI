#!/bin/bash
# Test script for NiveshAI Backend API
# Make sure the server is running on http://localhost:3000

BASE_URL="http://localhost:3000"

echo "=========================================="
echo "Testing NiveshAI Backend API"
echo "=========================================="
echo ""

# Test 1: File Upload and Analysis
echo "1. Testing File Upload and Analysis Endpoint (POST /api/analyze)"
echo "---------------------------------------------------"
curl -X POST "${BASE_URL}/api/analyze" \
  -F "startupName=TechFlow AI" \
  -F "location=San Francisco, CA" \
  -F "stage=Series A" \
  -F "sector=SaaS" \
  -F "businessModel=B2B" \
  -F "website=https://techflow.ai" \
  -F "fundingRaised=$2.5M" \
  -F "teamSize=15" \
  -F "additionalNotes=A promising B2B SaaS startup" \
  -F "pitchDeck=@sample_transcript.txt" \
  -H "Content-Type: multipart/form-data" \
  | jq '.'

echo ""
echo ""

# Test 2: RAG Query - Risk Analysis
echo "2. Testing RAG Query Endpoint - Risk Analysis (POST /api/rag/query)"
echo "---------------------------------------------------"
curl -X POST "${BASE_URL}/api/rag/query" \
  -H "Content-Type: application/json" \
  -d '{
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
  }' \
  | jq '.'

echo ""
echo ""

# Test 3: RAG Query - Team Assessment
echo "3. Testing RAG Query - Team Assessment"
echo "---------------------------------------------------"
curl -X POST "${BASE_URL}/api/rag/query" \
  -H "Content-Type: application/json" \
  -d '{
    "startupContext": {
      "startupName": "TechFlow AI",
      "stage": "Series A",
      "sector": "SaaS"
    },
    "userQuery": "Evaluate the team and provide recommendations"
  }' \
  | jq '.'

echo ""
echo "=========================================="
echo "Testing Complete"
echo "=========================================="

