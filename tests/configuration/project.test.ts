import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface ProjectPackage {
  private?: boolean;
  scripts?: Record<string, string>;
}

interface TypeScriptConfiguration {
  compilerOptions?: {
    strict?: boolean;
  };
}

function readJsonFile<T>(relativePath: string): T {
  const filePath = path.join(process.cwd(), relativePath);
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

describe("project configuration", () => {
  it("provides the required lifecycle scripts", () => {
    const projectPackage = readJsonFile<ProjectPackage>("package.json");

    expect(projectPackage.private).toBe(true);
    expect(projectPackage.scripts).toMatchObject({
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "eslint . --max-warnings=0",
      typecheck: "tsc --noEmit",
      test: "vitest run",
    });
  });

  it("keeps strict TypeScript enabled", () => {
    const TypeScriptConfig =
      readJsonFile<TypeScriptConfiguration>("tsconfig.json");

    expect(TypeScriptConfig.compilerOptions?.strict).toBe(true);
  });
});
