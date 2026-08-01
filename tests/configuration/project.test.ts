import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

interface ProjectPackage {
  license?: string;
  private?: boolean;
  scripts?: Record<string, string>;
}

interface TypeScriptConfiguration {
  compilerOptions?: {
    strict?: boolean;
  };
}

const documentationFiles = [
  "ARCHITECTURE.md",
  "BUILT_WITH_CODEX.md",
  "DEPLOYMENT.md",
  "DESIGN.md",
  "PRODUCT.md",
  "README.md",
  "TESTING.md",
  "USER_TESTING.md",
] as const;

function readJsonFile<T>(relativePath: string): T {
  const filePath = path.join(process.cwd(), relativePath);
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}

describe("project configuration", () => {
  it("provides the required lifecycle scripts", () => {
    const projectPackage = readJsonFile<ProjectPackage>("package.json");

    expect(projectPackage.license).toBe("MIT");
    expect(projectPackage.private).toBe(true);
    expect(projectPackage.scripts).toMatchObject({
      build: "next build",
      "db:migrate:deploy": "node scripts/run-deploy-migration.mjs",
      dev: "next dev",
      lint: "eslint . --max-warnings=0",
      smoke: "node scripts/run-production-smoke.mjs",
      start: "next start",
      test: "vitest run",
      typecheck: "tsc --noEmit",
    });
  });

  it("keeps CI read-only, isolated, and explicit", () => {
    const workflow = readFileSync(
      path.join(process.cwd(), ".github/workflows/quality.yml"),
      "utf8",
    );

    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("image: postgres:17-alpine");
    expect(workflow).toContain("AI_PROVIDER_MODE: fallback");
    expect(workflow).toContain("run: npm ci");
    expect(workflow).toContain("run: npm run typecheck");
    expect(workflow).toContain("run: npm run lint");
    expect(workflow).toContain("run: npm run test:unit");
    expect(workflow).toContain("run: npm run test:components");
    expect(workflow).toContain("run: npm run test:contracts");
    expect(workflow).toContain("run: npm run test:integration");
    expect(workflow).toContain("run: npm run build");
    expect(workflow).toContain("run: npm run test:e2e");
    expect(workflow).not.toMatch(/vercel|deploy-production|GEMINI_API_KEY/u);
  });

  it("keeps strict TypeScript enabled", () => {
    const TypeScriptConfig =
      readJsonFile<TypeScriptConfiguration>("tsconfig.json");

    expect(TypeScriptConfig.compilerOptions?.strict).toBe(true);
  });

  it("keeps project documentation free of encoding corruption", () => {
    for (const relativePath of documentationFiles) {
      const content = readFileSync(
        path.join(process.cwd(), relativePath),
        "utf8",
      );

      expect(content, relativePath).not.toMatch(
        /[\u00c2\u00c3\u00e2\ufffd]/u,
      );
    }
  });
});
