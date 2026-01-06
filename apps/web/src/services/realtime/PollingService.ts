type PollCallback = () => Promise<void>;
type StatusHandler = (isActive: boolean) => void;

export class PollingService {
  private intervals = new Map<string, NodeJS.Timeout>();
  private statusHandlers = new Set<StatusHandler>();
  private isActive = false;

  /**
   * Start polling with specified interval
   */
  start(key: string, callback: PollCallback, intervalMs: number): void {
    this.stop(key);

    const interval = setInterval(async () => {
      try {
        await callback();
      } catch (error) {
        console.error(`Polling error for ${key}:`, error);
      }
    }, intervalMs);

    this.intervals.set(key, interval);
    this.updateActiveStatus();
  }

  /**
   * Stop polling for specific key
   */
  stop(key: string): void {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
      this.updateActiveStatus();
    }
  }

  /**
   * Stop all polling
   */
  stopAll(): void {
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
    this.updateActiveStatus();
  }

  /**
   * Check if polling is active for a key
   */
  isPolling(key: string): boolean {
    return this.intervals.has(key);
  }

  /**
   * Subscribe to status changes
   */
  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /**
   * Get active status
   */
  getActiveStatus(): boolean {
    return this.isActive;
  }

  private updateActiveStatus(): void {
    const wasActive = this.isActive;
    this.isActive = this.intervals.size > 0;

    if (wasActive !== this.isActive) {
      this.statusHandlers.forEach(handler => handler(this.isActive));
    }
  }
}

// Singleton instance
export const pollingService = new PollingService();

