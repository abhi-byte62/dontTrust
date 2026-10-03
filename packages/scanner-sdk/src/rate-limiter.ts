/**
 * Leaky Bucket / Token Bucket rate limiter for workers to respect host constraints.
 */
export class RateLimiter {
  private tokens: number;
  private lastRefillTimestamp: number;
  private readonly maxTokens: number;
  private readonly refillRatePerSecond: number;
  private readonly maxConcurrency: number;
  private currentActiveRequests = 0;

  constructor(options: { requestsPerSecond?: number; maxConcurrency?: number }) {
    this.refillRatePerSecond = options.requestsPerSecond ?? 10;
    this.maxTokens = this.refillRatePerSecond * 2; // Burst allowance
    this.tokens = this.maxTokens;
    this.maxConcurrency = options.maxConcurrency ?? 5;
    this.lastRefillTimestamp = Date.now();
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTimestamp) / 1000;
    if (elapsedSeconds > 0) {
      const addedTokens = elapsedSeconds * this.refillRatePerSecond;
      this.tokens = Math.min(this.maxTokens, this.tokens + addedTokens);
      this.lastRefillTimestamp = now;
    }
  }

  /**
   * Acquire execution token before dispatching HTTP/network requests.
   */
  public async acquire(): Promise<() => void> {
    while (true) {
      this.refillTokens();
      if (this.tokens >= 1 && this.currentActiveRequests < this.maxConcurrency) {
        this.tokens -= 1;
        this.currentActiveRequests += 1;
        let released = false;
        return () => {
          if (!released) {
            released = true;
            this.currentActiveRequests = Math.max(0, this.currentActiveRequests - 1);
          }
        };
      }
      // Wait a short backoff slice
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}
