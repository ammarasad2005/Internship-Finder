import { SearchQuery } from '@/features/brain/types';
import { ProviderRegistry } from './provider-registry.service';
import { ProviderConfig } from '../types/provider';

export class ProviderRouter {
  /**
   * Dynamically selects the optimal provider for a query.
   * Enforces capabilities, quota checks, and executes weighted load balancing.
   */
  static selectProvider(query: SearchQuery): ProviderConfig | null {
    const candidates = ProviderRegistry.getActiveProviders().filter(p => 
      p.capabilities.includes(query.category) && ProviderRegistry.hasQuota(p.id)
    );

    if (candidates.length === 0) return null;

    // Weighted Random Selection among candidates
    const totalWeight = candidates.reduce((sum, p) => sum + p.weight, 0);
    let random = Math.random() * totalWeight;

    for (const p of candidates) {
      if (random < p.weight) return p;
      random -= p.weight;
    }

    return candidates[0]; // Fallback
  }

  /**
   * Provides the next best alternative if the primary provider fails during execution.
   */
  static getFailover(failedProviderId: string, query: SearchQuery): ProviderConfig | null {
    // 1. Log the failure immediately to update circuit breaker state
    ProviderRegistry.reportFailure(failedProviderId);

    // 2. Find a new route, explicitly excluding the failed provider
    const candidates = ProviderRegistry.getActiveProviders().filter(p => 
      p.id !== failedProviderId && 
      p.capabilities.includes(query.category) && 
      ProviderRegistry.hasQuota(p.id)
    );

    if (candidates.length === 0) return null;

    // Highest weight wins for failover for maximum predictability during degraded state
    return candidates.sort((a, b) => b.weight - a.weight)[0];
  }
}
