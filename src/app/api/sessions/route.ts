import { NextRequest, NextResponse } from "next/server";
import { getGameService } from "@/server/game/factory";
import { startSessionRequestSchema } from "@/server/game/schemas";
import { assertSameOrigin, parseJsonBody } from "@/server/http/request";
import {
  getOrCreateOwner,
  requireOwner,
  setOwnerCookie,
} from "@/server/http/owner";
import { safeErrorResponse } from "@/server/http/response";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const input = await parseJsonBody(
      request,
      startSessionRequestSchema,
    );
    const owner = getOrCreateOwner(request);
    const session = await getGameService().startSession(
      owner.hash,
      input.passport,
    );
    const response = NextResponse.json(session, { status: 201 });
    setOwnerCookie(response, owner);
    return response;
  } catch (error) {
    return safeErrorResponse(error);
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const owner = requireOwner(request);
    const sessions = await getGameService().listSessions(owner.hash);
    return NextResponse.json(sessions);
  } catch (error) {
    return safeErrorResponse(error);
  }
}
