import { NextRequest, NextResponse } from "next/server";
import { getGameService } from "@/server/game/factory";
import { sessionIdSchema } from "@/server/game/schemas";
import { requireOwner } from "@/server/http/owner";
import { assertSameOrigin } from "@/server/http/request";
import { safeErrorResponse } from "@/server/http/response";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ sessionId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    const owner = requireOwner(request);
    const { sessionId: input } = await context.params;
    const sessionId = sessionIdSchema.parse(input);
    const session = await getGameService().getSession(
      sessionId,
      owner.hash,
    );
    return NextResponse.json(session);
  } catch (error) {
    return safeErrorResponse(error);
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const owner = requireOwner(request);
    const { sessionId: input } = await context.params;
    const sessionId = sessionIdSchema.parse(input);
    await getGameService().abandonSession(sessionId, owner.hash);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return safeErrorResponse(error);
  }
}
