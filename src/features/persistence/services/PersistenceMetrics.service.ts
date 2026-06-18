export class PersistenceMetrics {
  public totalProcessed = 0;
  public totalCreated = 0;
  public totalUpdated = 0;
  public totalSourcesAdded = 0;
  public totalFailed = 0;

  recordCreated(): void {
    this.totalProcessed++;
    this.totalCreated++;
  }

  recordUpdated(): void {
    this.totalProcessed++;
    this.totalUpdated++;
  }

  recordSourcesAdded(count: number): void {
    this.totalSourcesAdded += count;
  }

  recordFailed(): void {
    this.totalProcessed++;
    this.totalFailed++;
  }

  getSummary(): Record<string, number> {
    return {
      processed: this.totalProcessed,
      created: this.totalCreated,
      updated: this.totalUpdated,
      sourcesAdded: this.totalSourcesAdded,
      failed: this.totalFailed
    };
  }
}
