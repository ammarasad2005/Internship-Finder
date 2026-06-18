import { SearchQuery } from '@/features/brain/types';
import { ProviderCapability } from '../types';

export class ProviderSelectionEngine {
  /**
   * Defines the capabilities of mocked (or future real) providers.
   */
  static getAvailableProviders(): ProviderCapability[] {
    return [
      { 
        id: 'google_mock', 
        name: 'Google Custom Search (Mock)', 
        costPerQuery: 5, 
        bestForCategories: ['company_based', 'location_based', 'skill_based'] 
      },
      { 
        id: 'linkedin_mock', 
        name: 'LinkedIn Scraper (Mock)', 
        costPerQuery: 10, 
        bestForCategories: ['role_based'] 
      },
      { 
        id: 'jobboard_mock', 
        name: 'Generic Job Board (Mock)', 
        costPerQuery: 2, 
        bestForCategories: ['technology_based'] 
      }
    ];
  }

  /**
   * Dynamically assigns the optimal search provider for a specific query category.
   */
  static selectProvider(query: SearchQuery): ProviderCapability {
    const providers = this.getAvailableProviders();
    const match = providers.find(p => p.bestForCategories.includes(query.category));
    
    // Fallback to the cheapest general purpose provider if no specific match
    return match || providers[0];
  }
}
