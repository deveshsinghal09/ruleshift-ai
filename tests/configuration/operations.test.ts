import { execFile } from "node:child_process";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

describe("production operations", () => {
  it("refuses a deployment migration without exact database confirmation", async () => {
    const script = path.join(
      process.cwd(),
      "scripts/run-deploy-migration.mjs",
    );
    await expect(
      execFileAsync(
        process.execPath,
        [script, "--confirm-database=wrong_target"],
        {
          env: {
            ...process.env,
            DATABASE_URL:
              "postgresql://operator:local-only@127.0.0.1:5432/ruleshift_stage",
          },
        },
      ),
    ).rejects.toMatchObject({
      code: 1,
      stderr: expect.stringContaining("Migration refused."),
    });
  });

  it("smoke-checks HTML routes and database readiness without response output", async () => {
    const server = createServer((request, response) => {
      if (request.url === "/api/health") {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end('{"status":"ok"}');
        return;
      }
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end("<!doctype html><title>RuleShift AI</title>");
    });
    await new Promise<void>((resolve) => {
      server.listen(0, "127.0.0.1", resolve);
    });

    try {
      const address = server.address() as AddressInfo;
      const script = path.join(
        process.cwd(),
        "scripts/run-production-smoke.mjs",
      );
      const result = await execFileAsync(process.execPath, [
        script,
        `http://127.0.0.1:${address.port}`,
      ]);

      expect(result.stdout).toContain("Smoke check passed: /");
      expect(result.stdout).toContain("Smoke check passed: /create");
      expect(result.stdout).toContain("Smoke check passed: /api/health");
      expect(result.stdout).not.toContain('{"status":"ok"}');
    } finally {
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });
    }
  });
});
