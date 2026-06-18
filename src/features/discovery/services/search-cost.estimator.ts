export class SearchCostEstimator {
  /**
   * Estimates the token or financial cost of executing a search query.
   * Can be expanded to account for deeper pagination (depth).
   */
  static estimateCost(providerCost: number, depth: number): number {
    return providerCost * depth;
  }
}
