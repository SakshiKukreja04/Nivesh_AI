// ProductTechSignals: deterministic product extraction and Groq polishing
export interface ProductTechSignals {
  sector: "healthtech" | "saas" | "fintech" | "unknown";
  productSummary: string; // raw extracted text
  polishedSummary: string; // Groq output
  keyMetrics: Record<string, string | number>; // dynamic key-value metrics
  defensibility: {
    pros: string[];
    cons: string[];
  };
  rawEvidence: Array<{
    section: string;
    snippet: string;
  }>;
}
// Structured claim extracted from startup documents
export interface StartupClaims {
  claim: string;
  value?: string | number;
  confidence?: number;
  sourceChunk?: string;
  [key: string]: unknown;
}
export interface DocumentChunk {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
  claims?: StartupClaims[];
}

export interface EmbeddingVector {
  id: string;
  values: number[];
  metadata?: Record<string, unknown>;
}

export interface GroqResponse {
  summary: string;
  topRisks: string[];
  teamAssessment: string;
  marketOutlook: string;
  valuationNotes?: string;
}

export interface ProcessedFile {
  text: string;
  savedFile: string | null;
  fileType: "pdf" | "txt" | "pptx" | "audio" | "unknown";
}

export interface StartupMetadata {
  startupName?: string;
  location?: string;
  stage?: string;
  sector?: string;
  businessModel?: string;
  website?: string;
  fundingRaised?: string;
  teamSize?: string;
  additionalNotes?: string;
  [key: string]: unknown;
}

export interface FounderSignals {
  experienceYears: number;
  pastCompanies: string[];
  roles: string[];
  education: string[];
  domainAlignment: string[];
}

export interface FounderVerificationResult {
  startupId: string;
  role: string;
  founderStrengthScore: number;
  signals: FounderSignals;
  redFlags: string[];
}

export interface TeamMember {
  name: string;
  role: string;
  background?: string;
  experience?: string | { value: string; source: string };
  education?: string | { value: string; source: string };
}

export interface TeamInfo {
  members: TeamMember[];
  totalMembers: number;
}