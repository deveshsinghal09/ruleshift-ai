import { describe, expect, it } from "vitest";
import { hardenPostgresSslMode } from "@/server/db/connection";

describe("hardenPostgresSslMode", () => {
  it("makes strict certificate verification explicit", () => {
    const hardened = hardenPostgresSslMode(
      "postgresql://user:password@example.com/database?sslmode=require",
    );
    expect(new URL(hardened).searchParams.get("sslmode")).toBe(
      "verify-full",
    );
  });

  it("preserves absent and already explicit SSL configuration", () => {
    const local =
      "postgresql://user:password@localhost:5432/ruleshift_test";
    expect(hardenPostgresSslMode(local)).toBe(local);
    const strict = `${local}?sslmode=verify-full`;
    expect(hardenPostgresSslMode(strict)).toBe(strict);
  });
});
