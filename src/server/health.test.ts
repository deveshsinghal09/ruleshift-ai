import { afterEach, describe, expect, it, vi } from "vitest";
import { checkApplicationHealth } from "@/server/health";

describe("checkApplicationHealth", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports readiness when the database probe succeeds", async () => {
    await expect(
      checkApplicationHealth(() => Promise.resolve()),
    ).resolves.toEqual({
      dependencies: {
        database: "available",
        deterministicFallback: "ready",
      },
      status: "ok",
    });
  });

  it("reports a safe degraded response without error details", async () => {
    await expect(
      checkApplicationHealth(() =>
        Promise.reject(new Error("postgresql://secret@private-host/db")),
      ),
    ).resolves.toEqual({
      dependencies: {
        database: "unavailable",
        deterministicFallback: "ready",
      },
      status: "degraded",
    });
  });

  it("bounds a stalled database probe", async () => {
    vi.useFakeTimers();
    const result = checkApplicationHealth(
      () => new Promise<void>(() => undefined),
      50,
    );
    await vi.advanceTimersByTimeAsync(50);
    await expect(result).resolves.toMatchObject({
      dependencies: { database: "unavailable" },
      status: "degraded",
    });
  });
});
