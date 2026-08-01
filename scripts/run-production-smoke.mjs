const baseUrlInput = process.argv[2];
if (!baseUrlInput) {
  console.error("Usage: npm run smoke -- https://deployment.example");
  process.exit(1);
}

let baseUrl;
try {
  baseUrl = new URL(baseUrlInput);
} catch {
  console.error("The smoke-test target must be a valid absolute URL.");
  process.exit(1);
}

if (baseUrl.protocol !== "http:" && baseUrl.protocol !== "https:") {
  console.error("The smoke-test target must use HTTP or HTTPS.");
  process.exit(1);
}

const checks = [
  { contentType: "text/html", path: "/" },
  { contentType: "text/html", path: "/create" },
  { contentType: "application/json", path: "/api/health" },
];

for (const check of checks) {
  const target = new URL(check.path, baseUrl);
  const response = await fetch(target, {
    headers: { "User-Agent": "RuleShift-Production-Smoke/1.0" },
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
  });
  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes(check.contentType)) {
    console.error(
      `Smoke check failed for ${check.path}: HTTP ${response.status} with unexpected content type.`,
    );
    process.exit(1);
  }
  console.log(`Smoke check passed: ${check.path}`);
}
