export interface RateLimiter {
  consume(key: string): boolean;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();

  constructor(
    private readonly limit = 30,
    private readonly windowMs = 60_000,
  ) {}

  consume(key: string): boolean {
    const now = Date.now();
    const current = this.entries.get(key);
    if (!current || current.resetAt <= now) {
      this.entries.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    if (current.count >= this.limit) {
      return false;
    }
    current.count += 1;
    return true;
  }
}
