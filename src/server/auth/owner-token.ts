import {
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const OWNER_COOKIE_NAME = "ruleshift_owner";
export const OWNER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function createOwnerToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashOwnerToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function ownerHashesMatch(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}
