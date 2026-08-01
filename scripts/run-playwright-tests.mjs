import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadTestDatabaseUrl } from "./test-database-url.mjs";

let databaseUrl;
try {
  databaseUrl = loadTestDatabaseUrl();
} catch (error) {
  console.error(error instanceof Error ? error.message : "Invalid test database configuration.");
  process.exit(1);
}

const serverScript = fileURLToPath(
  new URL("./run-e2e-server.mjs", import.meta.url),
);
const playwrightCli = fileURLToPath(
  new URL("../node_modules/@playwright/test/cli.js", import.meta.url),
);
const sharedEnvironment = {
  ...process.env,
  DATABASE_URL: databaseUrl,
  PLAYWRIGHT_MANAGED_SERVERS: "1",
  TEST_DATABASE_URL: databaseUrl,
};
const servers = [
  spawn(process.execPath, [serverScript, "fallback", "3100"], {
    env: sharedEnvironment,
    stdio: "inherit",
  }),
  spawn(process.execPath, [serverScript, "mock", "3101"], {
    env: sharedEnvironment,
    stdio: "inherit",
  }),
];

async function waitForServer(url) {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`The browser-test server did not become ready: ${url}`);
}

function stopServers() {
  for (const server of servers) {
    if (server.exitCode === null) {
      server.kill();
    }
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    stopServers();
    process.exit(1);
  });
}

let exitCode = 1;
try {
  await Promise.all([
    waitForServer("http://127.0.0.1:3100"),
    waitForServer("http://127.0.0.1:3101"),
  ]);
  exitCode = await new Promise((resolve) => {
    const testProcess = spawn(
      process.execPath,
      [playwrightCli, "test", ...process.argv.slice(2)],
      { env: sharedEnvironment, stdio: "inherit" },
    );
    testProcess.once("error", () => resolve(1));
    testProcess.once("exit", (code) => resolve(code ?? 1));
  });
} catch (error) {
  console.error(error instanceof Error ? error.message : "Unable to run browser tests.");
} finally {
  stopServers();
}
process.exit(exitCode);
