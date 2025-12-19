# PowerShell Test Script for NiveshAI Backend API
# Make sure the server is running on http://localhost:3000

$baseUrl = "http://localhost:3000"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing NiveshAI Backend API" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: File Upload and Analysis
Write-Host "1. Testing File Upload and Analysis Endpoint (POST /api/analyze)" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Gray

$formData = @{
    startupName = "TechFlow AI"
    location = "San Francisco, CA"
    stage = "Series A"
    sector = "SaaS"
    businessModel = "B2B"
    website = "https://techflow.ai"
    fundingRaised = "$2.5M"
    teamSize = "15"
    additionalNotes = "A promising B2B SaaS startup"
    pitchDeck = Get-Item -Path "sample_transcript.txt"
}

try {
    $response1 = Invoke-RestMethod -Uri "$baseUrl/api/analyze" -Method Post -Form $formData -ContentType "multipart/form-data"
    Write-Host "Response:" -ForegroundColor Green
    $response1 | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host ""

# Test 2: RAG Query - Risk Analysis
Write-Host "2. Testing RAG Query Endpoint - Risk Analysis (POST /api/rag/query)" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Gray

$ragBody = @{
    startupContext = @{
        startupName = "TechFlow AI"
        location = "San Francisco, CA"
        stage = "Series A"
        sector = "SaaS"
        businessModel = "B2B"
        website = "https://techflow.ai"
        fundingRaised = "$2.5M"
        teamSize = "15"
    }
    userQuery = "What are the main risks for this startup?"
} | ConvertTo-Json -Depth 10

try {
    $response2 = Invoke-RestMethod -Uri "$baseUrl/api/rag/query" -Method Post -Body $ragBody -ContentType "application/json"
    Write-Host "Response:" -ForegroundColor Green
    $response2 | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host ""

# Test 3: RAG Query - Team Assessment
Write-Host "3. Testing RAG Query - Team Assessment" -ForegroundColor Yellow
Write-Host "---------------------------------------------------" -ForegroundColor Gray

$ragBody2 = @{
    startupContext = @{
        startupName = "TechFlow AI"
        stage = "Series A"
        sector = "SaaS"
    }
    userQuery = "Evaluate the team and provide recommendations"
} | ConvertTo-Json -Depth 10

try {
    $response3 = Invoke-RestMethod -Uri "$baseUrl/api/rag/query" -Method Post -Body $ragBody2 -ContentType "application/json"
    Write-Host "Response:" -ForegroundColor Green
    $response3 | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Testing Complete" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

