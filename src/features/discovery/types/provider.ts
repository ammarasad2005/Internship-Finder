export interface ProviderQuota {
  dailyLimit: number;
  usedToday: number;
  resetsAt: string; // ISO String
}

export interface ProviderHealth {
  status: 'healthy' | 'degraded' | 'dead';
  consecutiveFailures: number;
  lastErrorAt?: string;
  recoveryPingAt?: string; // Time to attempt circuit breaker half-open
}

export interface ProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  weight: number; // For load balancing (e.g. 1-100)
  costPerQuery: number; // Token cost or fiat cost representation
  capabilities: string[]; // Search intent categories (e.g. 'role_based', 'company_based')
  quota: ProviderQuota;
  health: ProviderHealth;
}
