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
        OPENAI_API_KEY: "test-key",
        OPENAI_MODEL: "configured-model",
      }),
    ).toEqual({
      NODE_ENV: "development",
      OPENAI_API_KEY: "test-key",
      OPENAI_MODEL: "configured-model",
    });
  });

  it("treats blank provider values as disabled", () => {
    expect(
      parseServerEnvironment({
        OPENAI_API_KEY: "",
        OPENAI_MODEL: " ",
      }),
    ).toEqual({ NODE_ENV: "development" });
  });

  it("rejects unsupported environment modes", () => {
    expect(() =>
      parseServerEnvironment({ NODE_ENV: "preview" }),
    ).toThrowError();
  });
});
