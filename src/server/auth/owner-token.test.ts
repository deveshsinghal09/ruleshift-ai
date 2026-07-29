import { describe, expect, it } from "vitest";
import {
  createOwnerToken,
  hashOwnerToken,
  ownerHashesMatch,
} from "@/server/auth/owner-token";

describe("anonymous owner tokens", () => {
  it("creates high-entropy tokens and stores only stable hashes", () => {
    const first = createOwnerToken();
    const second = createOwnerToken();
    const hash = hashOwnerToken(first);

    expect(first).toHaveLength(43);
    expect(first).not.toBe(second);
    expect(hash).toMatch(/^[a-f0-9]{64}$/u);
    expect(hash).not.toContain(first);
    expect(ownerHashesMatch(hash, hashOwnerToken(first))).toBe(true);
    expect(ownerHashesMatch(hash, hashOwnerToken(second))).toBe(false);
  });
});
