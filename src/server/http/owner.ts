import type { NextRequest, NextResponse } from "next/server";
import {
  createOwnerToken,
  hashOwnerToken,
  OWNER_COOKIE_MAX_AGE_SECONDS,
  OWNER_COOKIE_NAME,
} from "@/server/auth/owner-token";
import { GameServiceError } from "@/server/game/errors";

const ownerTokenPattern = /^[A-Za-z0-9_-]{43}$/u;

export interface OwnerIdentity {
  readonly hash: string;
  readonly isNew: boolean;
  readonly token: string;
}

export function getOrCreateOwner(request: NextRequest): OwnerIdentity {
  const existing = request.cookies.get(OWNER_COOKIE_NAME)?.value;
  const token =
    existing && ownerTokenPattern.test(existing)
      ? existing
      : createOwnerToken();
  return {
    hash: hashOwnerToken(token),
    isNew: token !== existing,
    token,
  };
}

export function requireOwner(request: NextRequest): OwnerIdentity {
  const token = request.cookies.get(OWNER_COOKIE_NAME)?.value;
  if (!token || !ownerTokenPattern.test(token)) {
    throw new GameServiceError(
      "NOT_FOUND",
      "This adventure could not be found.",
    );
  }
  return { hash: hashOwnerToken(token), isNew: false, token };
}

export function setOwnerCookie(
  response: NextResponse,
  owner: OwnerIdentity,
): void {
  if (!owner.isNew) {
    return;
  }
  response.cookies.set({
    httpOnly: true,
    maxAge: OWNER_COOKIE_MAX_AGE_SECONDS,
    name: OWNER_COOKIE_NAME,
    path: "/",
    sameSite: "lax",
    secure: true,
    value: owner.token,
  });
}
