import { NextRequest, NextResponse } from "next/server";
import { getGameService } from "@/server/game/factory";
import {
  processActionRequestSchema,
  sessionIdSchema,
} from "@/server/game/schemas";
import { requireOwner } from "@/server/http/owner";
import {
  assertSameOrigin,
  parseJsonBody,
} from "@/server/http/request";
import { safeErrorResponse } from "@/server/http/response";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ sessionId: string }>;
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse> {
  try {
    assertSameOrigin(request);
    const owner = requireOwner(request);
    const { sessionId: input } = await context.params;
    const sessionId = sessionIdSchema.parse(input);
    const action = await parseJsonBody(
      request,
      processActionRequestSchema,
    );
    const session = await getGameService().processAction(
      sessionId,
      owner.hash,
      action,
    );
    return NextResponse.json(session);
  } catch (error) {
    return safeErrorResponse(error);
  }
}
