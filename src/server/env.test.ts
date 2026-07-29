import { describe, expect, it } from "vitest";
import { parseServerEnvironment } from "@/server/env";

describe("parseServerEnvironment", () => {
  it("uses a safe development default when NODE_ENV is absent", () => {
    expect(parseServerEnvironment({})).toEqual({
      NODE_ENV: "development",
    });
  });

  it("rejects unsupported environment modes", () => {
    expect(() =>
      parseServerEnvironment({ NODE_ENV: "preview" }),
    ).toThrowError();
  });
});
