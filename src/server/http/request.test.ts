import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  assertSameOrigin,
  parseJsonBody,
} from "@/server/http/request";

describe("server request controls", () => {
  it("rejects cross-origin mutation requests", () => {
    expect(() =>
      assertSameOrigin(
        new Request("https://ruleshift.example/api/sessions", {
          headers: { Origin: "https://attacker.example" },
        }),
      ),
    ).toThrow("did not originate");
  });

  it("enforces validated JSON and input size limits", async () => {
    const schema = z.object({ value: z.string().max(10) });
    await expect(
      parseJsonBody(
        new Request("https://ruleshift.example/api/sessions", {
          body: JSON.stringify({ value: "safe" }),
          method: "POST",
        }),
        schema,
      ),
    ).resolves.toEqual({ value: "safe" });
    await expect(
      parseJsonBody(
        new Request("https://ruleshift.example/api/sessions", {
          body: JSON.stringify({ value: "x".repeat(9_000) }),
          method: "POST",
        }),
        schema,
      ),
    ).rejects.toThrow("too large");
  });
});
