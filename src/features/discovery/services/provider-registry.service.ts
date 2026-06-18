import { ProviderConfig } from '../types/provider';

export class ProviderRegistry {
  // In a real application, this state might be synchronized with a Redis cache or Database table
  // to allow distributed workers to share quota and health states.
  private static providers: Map<string, ProviderConfig> = new Map();

  static register(config: ProviderConfig) {
    this.providers.set(config.id, config);
  }

  static getProvider(id: string): ProviderConfig | undefined {
    return this.providers.get(id);
  }

  static getActiveProviders(): ProviderConfig[] {
    const now = new Date().toISOString();
    return Array.from(this.providers.values()).filter(p => {
      if (!p.enabled) return false;
      
      // Circuit Breaker: If dead, check if it's time for a recovery ping
      if (p.health.status === 'dead') {
        if (p.health.recoveryPingAt && now >= p.health.recoveryPingAt) {
          // Half-open state: allow it to be tried once
          return true; 
        }
        return false;
      }
      return true;
    });
  }

  static reportSuccess(id: string, cost: number) {
    const p = this.providers.get(id);
    if (!p) return;
    
    // Update Quota
    p.quota.usedToday += cost;
    
    // Heal provider (Circuit Breaker: Close)
    if (p.health.status !== 'healthy') {
      p.health.status = 'healthy';
      p.health.consecutiveFailures = 0;
      p.health.recoveryPingAt = undefined;
    }
  }

  static reportFailure(id: string) {
    const p = this.providers.get(id);
    if (!p) return;

    p.health.consecutiveFailures += 1;
    p.health.lastErrorAt = new Date().toISOString();

    // Circuit Breaker: Open after 3 consecutive failures
    if (p.health.consecutiveFailures >= 3) {
      p.health.status = 'dead';
      // Attempt recovery ping after 5 minutes
      p.health.recoveryPingAt = new Date(Date.now() + 5 * 60000).toISOString(); 
    } else {
      p.health.status = 'degraded';
    }
  }

  static hasQuota(id: string): boolean {
    const p = this.providers.get(id);
    if (!p) return false;
    
    const now = new Date();
    // Daily Reset check
    if (now > new Date(p.quota.resetsAt)) {
      p.quota.usedToday = 0;
      // Set reset to next midnight
      p.quota.resetsAt = new Date(new Date().setHours(24,0,0,0)).toISOString();
    }

    return p.quota.usedToday < p.quota.dailyLimit;
  }
}

// Bootstrap mock providers for testing
ProviderRegistry.register({
  id: 'google_mock',
  name: 'Google Custom Search (Mock)',
  enabled: true,
  weight: 50,
  costPerQuery: 5,
  capabilities: ['company_based', 'location_based', 'skill_based'],
  quota: { dailyLimit: 100, usedToday: 0, resetsAt: new Date(new Date().setHours(24,0,0,0)).toISOString() },
  health: { status: 'healthy', consecutiveFailures: 0 }
});

ProviderRegistry.register({
  id: 'linkedin_mock',
  name: 'LinkedIn Scraper (Mock)',
  enabled: true,
  weight: 80,
  costPerQuery: 10,
  capabilities: ['role_based'],
  quota: { dailyLimit: 50, usedToday: 0, resetsAt: new Date(new Date().setHours(24,0,0,0)).toISOString() },
  health: { status: 'healthy', consecutiveFailures: 0 }
});

ProviderRegistry.register({
  id: 'google_cse',
  name: 'Google Custom Search (Real API)',
  enabled: process.env.GOOGLE_CSE_API_KEY ? true : false,
  weight: 100,
  costPerQuery: 1, 
  capabilities: ['company_based', 'location_based', 'skill_based', 'role_based'],
  quota: { dailyLimit: 100, usedToday: 0, resetsAt: new Date(new Date().setHours(24,0,0,0)).toISOString() },
  health: { status: 'healthy', consecutiveFailures: 0 }
});
