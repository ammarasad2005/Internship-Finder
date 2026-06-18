export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  sourceType: 'official_career_page' | 'job_board' | 'linkedin' | 'other';
  extractedDate?: string;
}

export interface WorkerMetrics {
  queriesExecuted: number;
  resultsFound: number;
  internshipsExtracted: number;
  totalTokensUsed: number;
  executionTimeMs: number;
  errorsEncountered: number;
}

export interface WorkerConfig {
  maxRetries: number;
  heartbeatIntervalMs: number;
  maxExecutionTimeMs: number;
}
