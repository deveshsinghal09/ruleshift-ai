export type DependencyStatus = "available" | "unavailable";

export interface ApplicationHealth {
  readonly dependencies: {
    readonly database: DependencyStatus;
    readonly deterministicFallback: "ready";
  };
  readonly status: "ok" | "degraded";
}

export async function checkApplicationHealth(
  probeDatabase: () => Promise<void>,
  timeoutMs = 2_000,
): Promise<ApplicationHealth> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      probeDatabase(),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("Database health probe timed out.")),
          timeoutMs,
        );
      }),
    ]);
    return {
      dependencies: {
        database: "available",
        deterministicFallback: "ready",
      },
      status: "ok",
    };
  } catch {
    return {
      dependencies: {
        database: "unavailable",
        deterministicFallback: "ready",
      },
      status: "degraded",
    };
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
