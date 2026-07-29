import { NextRequest, NextResponse } from "next/server";
import { getGameService } from "@/server/game/factory";
import { sessionIdSchema } from "@/server/game/schemas";
import { requireOwner } from "@/server/http/owner";
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
    const session = await getGameService().getResult(
      sessionId,
      owner.hash,
    );
    return NextResponse.json(session);
  } catch (error) {
    return safeErrorResponse(error);
  }
}
