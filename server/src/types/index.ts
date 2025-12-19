export interface DocumentChunk {
  id: string;
  text: string;
  metadata: Record<string, unknown>;
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