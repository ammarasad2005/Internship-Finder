import { SearchQuery } from '@/features/brain/types';

export interface BudgetConfig {
  maxQueriesPerWave: number;
  maxCostPerWave: number;
}

export interface ProviderCapability {
  id: string;
  name: string;
  costPerQuery: number;
  bestForCategories: string[];
}

export interface ExecutableTask {
  query: SearchQuery;
  providerId: string;
  estimatedCost: number;
}

export interface SearchWave {
  waveNumber: number;
  tasks: ExecutableTask[];
  totalEstimatedCost: number;
  coverageMetrics: Record<string, number>;
}
