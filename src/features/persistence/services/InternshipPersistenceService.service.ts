import { SupabaseClient } from '@supabase/supabase-js';
import { CanonicalInternship } from '@/features/canonicalization/types';
import { InternshipRepository } from './InternshipRepository.service';
import { InternshipSourcePersistenceService } from './InternshipSourcePersistenceService.service';
import { DatabaseMappingLayer } from './DatabaseMappingLayer.service';
import { PersistenceMetrics } from './PersistenceMetrics.service';

export class InternshipPersistenceService {
  private internshipRepo: InternshipRepository;
  private sourceRepo: InternshipSourcePersistenceService;
  private metrics: PersistenceMetrics;

  constructor(supabase: SupabaseClient) {
    this.internshipRepo = new InternshipRepository(supabase);
    this.sourceRepo = new InternshipSourcePersistenceService(supabase);
    this.metrics = new PersistenceMetrics();
  }

  /**
   * Persists an array of CanonicalInternships into the database.
   * Maintains metrics for telemetry reporting.
   */
  async persistBatch(canonicals: CanonicalInternship[]): Promise<PersistenceMetrics> {
    for (const canonical of canonicals) {
      try {
        // 1. Map to DB Row
        const internshipRow = DatabaseMappingLayer.toInternshipRow(canonical);

        // 2. Upsert the Core Record
        const { id, isNew } = await this.internshipRepo.saveInternship(internshipRow);

        if (isNew) {
          this.metrics.recordCreated();
        } else {
          this.metrics.recordUpdated();
        }

        // 3. Map and Persist Sources
        const sourceRows = DatabaseMappingLayer.toSourceRows(id, canonical);
        const sourcesAdded = await this.sourceRepo.saveSources(sourceRows);
        
        this.metrics.recordSourcesAdded(sourcesAdded);
      } catch (error) {
        console.error(`[InternshipPersistenceService] Failed to persist canonical ${canonical.canonicalKey}:`, error);
        this.metrics.recordFailed();
      }
    }

    return this.metrics;
  }
}
