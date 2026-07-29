import { NextRequest, NextResponse } from "next/server";
import { describe, expect, it } from "vitest";
import {
  getOrCreateOwner,
  requireOwner,
  setOwnerCookie,
} from "@/server/http/owner";
import { OWNER_COOKIE_NAME } from "@/server/auth/owner-token";

describe("owner cookie handling", () => {
  it("sets a random HTTP-only SameSite cookie and returns only its hash", () => {
    const request = new NextRequest("https://ruleshift.example/api/sessions");
    const owner = getOrCreateOwner(request);
    const response = NextResponse.json({ ok: true });
    setOwnerCookie(response, owner);
    const cookie = response.headers.get("set-cookie") ?? "";

    expect(owner.hash).toMatch(/^[a-f0-9]{64}$/u);
    expect(owner.hash).not.toContain(owner.token);
    expect(cookie).toContain(`${OWNER_COOKIE_NAME}=`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("SameSite=lax");
    expect(cookie).not.toContain(owner.hash);
  });

  it("reuses a valid owner token without emitting a replacement", () => {
    const firstRequest = new NextRequest(
      "https://ruleshift.example/api/sessions",
    );
    const first = getOrCreateOwner(firstRequest);
    const ownedRequest = new NextRequest(
      "https://ruleshift.example/api/sessions",
      {
        headers: {
          Cookie: `${OWNER_COOKIE_NAME}=${first.token}`,
        },
      },
    );
    const restored = requireOwner(ownedRequest);

    expect(restored.hash).toBe(first.hash);
    expect(restored.isNew).toBe(false);
  });
});
