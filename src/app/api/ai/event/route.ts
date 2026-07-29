import { NextResponse } from "next/server";
import { validateGameAction, validateGameState } from "@/domain/game/schemas";
import { AiDirector } from "@/server/ai/director";
import { selectAiProvider } from "@/server/ai/providers/config";
import { aiEventRequestSchema } from "@/server/ai/schemas";
import { serverEnvironment } from "@/server/env";

export const runtime = "nodejs";

const providerSelection = selectAiProvider(serverEnvironment);
const director = new AiDirector({ provider: providerSelection.provider });

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const parsedRequest = aiEventRequestSchema.parse(
      (await request.json()) as unknown,
    );
    const state = validateGameState(parsedRequest.state);
    const action = validateGameAction(parsedRequest.action);
    if (state.status !== "playing") {
      return NextResponse.json(
        { message: "This adventure has already reached its ending." },
        { status: 409 },
      );
    }
    const result = await director.generateEvent(state, action);
    return NextResponse.json({
      event: result.data,
      source: result.source,
      userMessage: result.userMessage,
    });
  } catch {
    return NextResponse.json(
      {
        message:
          "The Dungeon Master signal was unreadable. Deterministic reality remains available.",
      },
      { status: 400 },
    );
  }
}
