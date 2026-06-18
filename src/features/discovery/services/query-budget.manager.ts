import { ExecutableTask, BudgetConfig } from '../types';

export class QueryBudgetManager {
  /**
   * Truncates a list of potential execution tasks based on financial/token limits
   * and strict maximum query counts per wave.
   */
  static applyBudgetConstraints(tasks: ExecutableTask[], budget: BudgetConfig): ExecutableTask[] {
    const budgetedTasks: ExecutableTask[] = [];
    let currentCost = 0;

    for (const task of tasks) {
      if (budgetedTasks.length >= budget.maxQueriesPerWave) break;
      if (currentCost + task.estimatedCost > budget.maxCostPerWave) continue;

      budgetedTasks.push(task);
      currentCost += task.estimatedCost;
    }

    return budgetedTasks;
  }
}
