const legacyStrictModes = new Set(["prefer", "require", "verify-ca"]);

export function hardenPostgresSslMode(connectionString: string): string {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");
  if (sslMode && legacyStrictModes.has(sslMode)) {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}
