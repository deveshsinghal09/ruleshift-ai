import { describe, expect, it } from "vitest";
import { parseServerEnvironment } from "@/server/env";

describe("parseServerEnvironment", () => {
  it("uses a safe development default when NODE_ENV is absent", () => {
    expect(parseServerEnvironment({})).toEqual({
      NODE_ENV: "development",
    });
  });

  it("accepts server-only provider configuration without applying defaults", () => {
    expect(
      parseServerEnvironment({
        GEMINI_API_KEY: "test-key",
        GEMINI_MODEL: "configured-model",
      }),
    ).toEqual({
      NODE_ENV: "development",
      GEMINI_API_KEY: "test-key",
      GEMINI_MODEL: "configured-model",
    });
  });

  it("treats blank provider values as disabled", () => {
    expect(
      parseServerEnvironment({
        GEMINI_API_KEY: "",
        GEMINI_MODEL: " ",
      }),
    ).toEqual({ NODE_ENV: "development" });
  });

  it("accepts PostgreSQL URLs and rejects unrelated protocols", () => {
    expect(
      parseServerEnvironment({
        DATABASE_URL:
          "postgresql://ruleshift:secret@localhost:5432/ruleshift_dev",
      }).DATABASE_URL,
    ).toContain("postgresql://");
    expect(() =>
      parseServerEnvironment({
        DATABASE_URL: "https://database.example.com",
      }),
    ).toThrowError();
  });

  it("rejects unsupported environment modes", () => {
    expect(() =>
      parseServerEnvironment({ NODE_ENV: "preview" }),
    ).toThrowError();
  });
});
