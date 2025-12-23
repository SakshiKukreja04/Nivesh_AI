# NiveshAI 🚀

**AI-Powered Startup Investment Analysis Platform**

NiveshAI is a comprehensive venture capital analysis platform that leverages RAG (Retrieval-Augmented Generation) and AI to analyze startup investments. Upload pitch decks, founder CVs, and other documents to receive detailed investment analysis, risk assessments, and actionable insights.

![License](https://img.shields.io/badge/license-ISC-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![React](https://img.shields.io/badge/React-18.x-61dafb.svg)

---

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Environment Variables](#-environment-variables)
- [Usage Guide](#-usage-guide)
- [Development](#-development)
- [Testing](#-testing)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### Core Capabilities

- **📄 Document Processing**: Upload and analyze PDF pitch decks, founder CVs, transcripts, and emails
- **🤖 RAG-Powered Analysis**: Context-aware AI analysis using retrieved document chunks
- **📊 Risk Assessment**: Automated risk scoring with visual radar charts and distribution analysis
- **👥 Team Evaluation**: Founder verification and team strength scoring
- **📈 Market Analysis**: TAM/SAM/SOM validation with sector benchmarks
- **🎯 Claim Extraction**: Deterministic extraction of revenue, users, growth metrics from documents
- **💬 Interactive Chat**: "Ask NiveshAI" context-aware Q&A about analyzed startups
- **📑 PDF Export**: Generate professional investment reports

### Analysis Outputs

- Executive Summary
- Top Risks Identification
- Team Assessment & Founder Verification
- Market Opportunity Validation
- Product & Technology Signals
- Competitive Landscape Analysis
- Traction & Growth Metrics
- Investment Decision Recommendation (Proceed/Reject)

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (React)                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐   │
│  │ Upload  │  │Dashboard│  │  Deals  │  │  Ask NiveshAI   │   │
│  │  Page   │  │  Page   │  │  Page   │  │     Chat        │   │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────────┬────────┘   │
└───────┼────────────┼────────────┼────────────────┼─────────────┘
        │            │            │                │
        ▼            ▼            ▼                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Express.js Backend                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Routes                             │  │
│  │  POST /api/analyze    POST /api/rag/query                │  │
│  │  GET /api/startup/:id  GET /api/founder-verification/:id │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────┼───────────────────────────────┐ │
│  │                    Services Layer                          │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │ │
│  │  │  Document   │  │   Claim     │  │    Groq AI      │   │ │
│  │  │  Processor  │  │  Extractor  │  │    Analyzer     │   │ │
│  │  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘   │ │
│  │         │                │                   │            │ │
│  │  ┌──────▼──────┐  ┌──────▼──────┐  ┌────────▼────────┐   │ │
│  │  │  Embedding  │  │   Team &    │  │   RAG           │   │ │
│  │  │  Service    │  │   Resume    │  │   Retriever     │   │ │
│  │  └──────┬──────┘  │  Extractor  │  └────────┬────────┘   │ │
│  │         │         └─────────────┘           │            │ │
│  └─────────┼───────────────────────────────────┼────────────┘ │
│            │                                   │               │
│  ┌─────────▼───────────────────────────────────▼────────────┐ │
│  │                   Vector Store (Local/FAISS)              │ │
│  │              Document Chunks + Embeddings                 │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                      AWS S3 Storage                        │ │
│  │              Files + Metadata + Analysis Results           │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🛠 Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime environment |
| **Express.js 5** | Web framework |
| **TypeScript** | Type safety |
| **Groq API** | LLM for AI analysis (Llama 3.3 70B) |
| **pdf-parse** | PDF text extraction |
| **Tesseract.js** | OCR fallback for scanned PDFs |
| **AWS S3** | File storage |
| **Multer** | File upload handling |

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **shadcn/ui** | UI components |
| **Framer Motion** | Animations |
| **Recharts** | Data visualization |
| **React Query** | Server state management |
| **React Router** | Navigation |

### Infrastructure
| Technology | Purpose |
|------------|---------|
| **Local Vector Store** | In-memory vector database (FAISS-ready) |
| **AWS S3** | Document and metadata storage |
| **JSON Files** | Local data persistence |

---

## 📁 Project Structure

```
NiveshAI/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── dashboard/           # Dashboard components
│   │   │   │   ├── AskNiveshAIChat.tsx
│   │   │   │   ├── FounderTeamCard.tsx
│   │   │   │   ├── MarketOpportunityCard.tsx
│   │   │   │   ├── ProductTechnologyCard.tsx
│   │   │   │   ├── CompetitiveLandscapeCard.tsx
│   │   │   │   ├── TractionGrowthCard.tsx
│   │   │   │   └── PDFExportButton.tsx
│   │   │   ├── home/                # Landing page components
│   │   │   ├── layout/              # Header, Footer, Layout
│   │   │   └── ui/                  # shadcn/ui components
│   │   ├── pages/
│   │   │   ├── Index.tsx            # Landing page
│   │   │   ├── Upload.tsx           # Startup upload form
│   │   │   ├── Dashboard.tsx        # Analysis dashboard
│   │   │   ├── Deals.tsx            # Portfolio management
│   │   │   ├── Login.tsx            # Authentication
│   │   │   └── Signup.tsx           # Registration
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── lib/                     # Utilities
│   │   └── App.tsx                  # Main app component
│   ├── package.json
│   └── vite.config.ts
│
├── server/                          # Express Backend
│   ├── src/
│   │   ├── routes/
│   │   │   ├── ragQuery.route.ts    # RAG query endpoints
│   │   │   └── productTech.route.ts # Product/tech endpoints
│   │   ├── services/
│   │   │   ├── documentProcessor.ts # Document → Vector pipeline
│   │   │   ├── claimExtractor.ts    # Deterministic claim extraction
│   │   │   ├── groqAnalyzer.ts      # Groq LLM integration
│   │   │   ├── ragRetriever.ts      # Vector similarity search
│   │   │   ├── embeddingService.ts  # Text embeddings
│   │   │   ├── teamExtractor.ts     # Team info extraction
│   │   │   ├── resumeSignalExtractor.ts # Founder verification
│   │   │   ├── marketOpportunityValidator.ts
│   │   │   ├── productTechExtractor.ts
│   │   │   └── vectorStore.ts       # Vector store singleton
│   │   ├── vectorstore/
│   │   │   ├── VectorStore.ts       # Abstract interface
│   │   │   └── LocalVectorStore.ts  # In-memory implementation
│   │   ├── utils/
│   │   │   ├── fileUtils.ts         # File processing
│   │   │   ├── textChunker.ts       # Text chunking
│   │   │   ├── normalizeText.ts     # Text normalization
│   │   │   └── resumeParser.ts      # Resume PDF parsing
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   ├── lib/
│   │   │   └── s3Client.ts          # AWS S3 client
│   │   └── index.ts                 # Express app entry
│   ├── data/                        # Local JSON storage
│   ├── package.json
│   └── tsconfig.json
│
├── data/                            # Shared data directory
│   └── uploads/                     # Uploaded files
│
├── vectorDB_setup.md                # Pinecone setup guide
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** or **yarn** or **bun**
- **Groq API Key** (get one at [console.groq.com](https://console.groq.com))
- **AWS Account** (optional, for S3 storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/NiveshAI.git
   cd NiveshAI
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies**
   ```bash
   cd ../client
   npm install
   ```

4. **Configure environment variables**
   ```bash
   cd ../server
   cp .env.example .env
   # Edit .env with your API keys
   ```

5. **Build the server**
   ```bash
   npm run build
   ```

6. **Start the development servers**

   Terminal 1 (Backend):
   ```bash
   cd server
   npm start
   ```

   Terminal 2 (Frontend):
   ```bash
   cd client
   npm run dev
   ```

7. **Open the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

---

## 📡 API Documentation

### File Upload & Analysis

```http
POST /api/analyze
Content-Type: multipart/form-data
```

**Form Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `startupName` | string | Yes | Name of the startup |
| `location` | string | No | Geographic location |
| `stage` | string | Yes | Funding stage (pre-seed, seed, series-a, etc.) |
| `sector` | string | Yes | Industry sector |
| `businessModel` | string | No | B2B, B2C, B2B2C, etc. |
| `website` | string | No | Company website URL |
| `fundingRaised` | string | No | Amount raised |
| `teamSize` | string | No | Number of employees |
| `pitchDeck` | file | No | PDF pitch deck |
| `cv` | file | No | Founder CV/Resume |
| `transcript` | file | No | Meeting transcript |
| `email` | file | No | Email correspondence |

**Response:**
```json
{
  "success": true,
  "analysis": {
    "summary": "Executive summary...",
    "topRisks": ["Risk 1", "Risk 2"],
    "teamAssessment": "Team evaluation...",
    "marketOutlook": "Market analysis..."
  },
  "startupId": "startup-name-slug"
}
```

### RAG Query

```http
POST /api/rag/query
Content-Type: application/json
```

**Request Body:**
```json
{
  "startupContext": {
    "startupName": "TechFlow AI",
    "sector": "SaaS",
    "stage": "Series A"
  },
  "userQuery": "What are the main risks for this startup?"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "summary": "...",
    "topRisks": ["..."],
    "teamAssessment": "...",
    "marketOutlook": "..."
  }
}
```

### Get Startup Data

```http
GET /api/startup/:startupId
```

**Response:**
```json
{
  "success": true,
  "metadata": { ... },
  "claims": [ ... ],
  "summary": "...",
  "marketOpportunity": { ... },
  "productTech": { ... }
}
```

### Founder Verification

```http
GET /api/founder-verification/:startupId
```

### Team Information

```http
GET /api/team-info/:startupId
```

---

## ⚙️ Environment Variables

Create a `.env` file in the `server/` directory:

```env
# Server Configuration
PORT=3000

# Groq API (Required)
GROQ_API_URL=https://api.groq.com/openai/v1/chat/completions
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_MAX_TOKENS=2000
GROQ_TIMEOUT_MS=60000

# AWS S3 (Optional - for file storage)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
```

---

## 📖 Usage Guide

### 1. Upload a Startup for Analysis

1. Navigate to `/upload`
2. Fill in startup details (name, stage, sector, etc.)
3. Upload relevant documents:
   - **Pitch Deck** (PDF) - Primary analysis source
   - **Founder CV** (PDF) - For team verification
   - **Transcripts/Emails** (TXT) - Additional context
4. Click "Run NiveshAI Analysis"
5. Wait 30-60 seconds for processing

### 2. Review Analysis Dashboard

The dashboard (`/dashboard/:startupId`) displays:

- **Executive Summary** - AI-generated overview
- **Decision Badge** - PROCEED or REJECT recommendation
- **Confidence Score** - Analysis confidence level
- **Risk Assessment** - Radar chart + risk chips
- **Startup Snapshot** - Key metadata
- **Founder & Team** - Verification results
- **Market Opportunity** - TAM/SAM/SOM analysis
- **Product & Technology** - Tech stack signals
- **Competitive Landscape** - Market positioning

### 3. Ask Follow-up Questions

Use the floating "Ask NiveshAI" chat to:
- Clarify risk factors
- Get founder interview questions
- Request specific analysis details
- Summarize key concerns

### 4. Export Reports

Click the PDF export button to generate a professional investment memo.

---

## 💻 Development

### Running in Development Mode

```bash
# Terminal 1: Backend with auto-rebuild
cd server
npm run dev

# Terminal 2: Start server
npm start

# Terminal 3: Frontend with HMR
cd client
npm run dev
```

### Building for Production

```bash
# Build server
cd server
npm run build

# Build client
cd client
npm run build
```

### Code Style

- TypeScript strict mode enabled
- ESLint for linting
- Prettier for formatting (recommended)

---

## 🧪 Testing

### API Testing with Postman

1. Import `server/NiveshAI_API.postman_collection.json`
2. Set environment variable: `baseUrl = http://localhost:3000`
3. Run the test collection

See `server/POSTMAN_TESTING_GUIDE.md` for detailed instructions.

### Manual Testing

```bash
# Test file upload
curl -X POST http://localhost:3000/api/analyze \
  -F "startupName=Test Startup" \
  -F "stage=seed" \
  -F "sector=saas" \
  -F "pitchDeck=@/path/to/deck.pdf"

# Test RAG query
curl -X POST http://localhost:3000/api/rag/query \
  -H "Content-Type: application/json" \
  -d '{"startupContext":{"startupName":"Test"},"userQuery":"What are the risks?"}'
```

---

## 🗺 Roadmap

### Phase 1: Core MVP ✅
- [x] Document upload and processing
- [x] RAG pipeline implementation
- [x] Groq AI integration
- [x] Basic dashboard UI
- [x] Claim extraction
- [x] Team/founder verification

### Phase 2: Enhanced Analysis
- [ ] Real embedding service (OpenAI/Cohere)
- [ ] Production vector database (Pinecone)
- [ ] Market benchmark comparisons
- [ ] Competitive analysis automation
- [ ] Audio summary generation

### Phase 3: User Management
- [ ] User authentication (JWT)
- [ ] User dashboard & portfolio
- [ ] Deal pipeline management
- [ ] Team collaboration features

### Phase 4: Enterprise Features
- [ ] Multi-tenant architecture
- [ ] Custom scoring models
- [ ] API access for integrations
- [ ] Audit logging
- [ ] SSO integration

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Write TypeScript with strict types
- Add JSDoc comments for public functions
- Follow existing code patterns
- Test your changes thoroughly
- Update documentation as needed

---

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Groq](https://groq.com) for fast LLM inference
- [shadcn/ui](https://ui.shadcn.com) for beautiful UI components
- [Recharts](https://recharts.org) for data visualization
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) for PDF extraction

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

<p align="center">
  Made with ❤️ for the VC community
</p>
