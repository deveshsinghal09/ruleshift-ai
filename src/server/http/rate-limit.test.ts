import { describe, expect, it, vi } from "vitest";
import { InMemoryRateLimiter } from "@/server/http/rate-limit";

describe("InMemoryRateLimiter", () => {
  it("limits repeated mutations and resets after its window", () => {
    vi.useFakeTimers();
    const limiter = new InMemoryRateLimiter(2, 1_000);

    expect(limiter.consume("owner")).toBe(true);
    expect(limiter.consume("owner")).toBe(true);
    expect(limiter.consume("owner")).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(limiter.consume("owner")).toBe(true);
    vi.useRealTimers();
  });
});
