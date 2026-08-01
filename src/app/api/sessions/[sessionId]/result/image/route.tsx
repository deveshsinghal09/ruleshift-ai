import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getGameService } from "@/server/game/factory";
import { sessionIdSchema } from "@/server/game/schemas";
import { requireOwner } from "@/server/http/owner";
import { safeErrorResponse } from "@/server/http/response";

export const runtime = "nodejs";

interface RouteContext {
  readonly params: Promise<{ sessionId: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const owner = requireOwner(request);
    const { sessionId: input } = await context.params;
    const sessionId = sessionIdSchema.parse(input);
    const { state } = await getGameService().getResult(sessionId, owner.hash);
    const victory = state.status === "victory";
    const accent = victory ? "#34d399" : "#fb7185";

    return new ImageResponse(
      <div
        style={{
          alignItems: "stretch",
          background: "#08090d",
          color: "#f4f7fb",
          display: "flex",
          fontFamily: "Arial, sans-serif",
          height: "100%",
          padding: 64,
          width: "100%",
        }}
      >
        <div
          style={{
            border: "2px solid #2b3242",
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 52,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div
              style={{
                color: "#a78bfa",
                display: "flex",
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: "-0.03em",
              }}
            >
              RULESHIFT AI
            </div>
            <div
              style={{
                border: `2px solid ${accent}`,
                color: accent,
                display: "flex",
                fontSize: 20,
                fontWeight: 700,
                padding: "10px 18px",
                textTransform: "uppercase",
              }}
            >
              {victory ? "Adventure complete" : "Timeline collapsed"}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                color: "#8b96a9",
                display: "flex",
                fontSize: 22,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              {state.world.title}
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 58,
                fontWeight: 800,
                letterSpacing: "-0.045em",
                lineHeight: 1.08,
                marginTop: 18,
                maxWidth: 900,
              }}
            >
              {state.player.profile.name} {victory ? "rewrote the rules." : "will rewrite the next run."}
            </div>
          </div>

          <div
            style={{
              alignItems: "flex-end",
              borderTop: "2px solid #2b3242",
              display: "flex",
              justifyContent: "space-between",
              paddingTop: 28,
            }}
          >
            <div style={{ color: "#b9c1ce", display: "flex", fontSize: 22 }}>
              {state.statistics.turnsTaken} turns · {state.statistics.rulesSurvived} rules survived
            </div>
            <div
              style={{
                color: accent,
                display: "flex",
                fontSize: 52,
                fontWeight: 800,
              }}
            >
              {state.score}
            </div>
          </div>
        </div>
      </div>,
      {
        headers: {
          "Cache-Control": "private, no-store",
          "Content-Security-Policy": "default-src 'none'; sandbox",
          "X-Content-Type-Options": "nosniff",
        },
        height: 630,
        width: 1200,
      },
    );
  } catch (error) {
    return safeErrorResponse(error);
  }
}
