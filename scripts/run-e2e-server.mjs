import { createServer } from "node:http";
import { loadTestDatabaseUrl } from "./test-database-url.mjs";

const mode = process.argv[2];
const port = process.argv[3];
if ((mode !== "fallback" && mode !== "mock") || !/^\d{4,5}$/u.test(port ?? "")) {
  console.error("Usage: run-e2e-server.mjs <fallback|mock> <port>");
  process.exit(1);
}

let databaseUrl;
try {
  databaseUrl = loadTestDatabaseUrl();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Invalid test database configuration.");
  process.exit(1);
}

process.env.AI_PROVIDER_MODE = mode;
process.env.DATABASE_URL = databaseUrl;
process.env.GEMINI_API_KEY = "";
process.env.GEMINI_MODEL = "";
process.env.NODE_ENV = "production";

const { default: next } = await import("next");
const numericPort = Number(port);
const app = next({ dev: false, hostname: "127.0.0.1", port: numericPort });
await app.prepare();
const handler = app.getRequestHandler();
const server = createServer((request, response) => {
  void handler(request, response);
});
await new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(numericPort, "127.0.0.1", resolve);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(() => {
      void app.close().finally(() => process.exit(0));
    });
  });
}
