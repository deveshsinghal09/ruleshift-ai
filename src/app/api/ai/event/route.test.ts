import { describe, expect, it } from "vitest";
import { createInitialGameState } from "@/domain/game/engine";
import { POST } from "@/app/api/ai/event/route";
import { AI_FALLBACK_MESSAGE } from "@/lib/ai-messages";

function createState() {
  return createInitialGameState({
    difficulty: "normal",
    profile: {
      archetype: "Placement Warrior",
      mood: "funny",
      name: "Devesh",
      title: "the Placement Warrior",
    },
    seed: "route-seed",
    sessionId: "route-session",
  });
}

describe("POST /api/ai/event", () => {
  it("returns a validated deterministic fallback with no provider access", async () => {
    const state = createState();
    const response = await POST(
      new Request("http://localhost/api/ai/event", {
        body: JSON.stringify({
          action: state.currentEvent.choices[0],
          state,
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );
    const body = (await response.json()) as {
      readonly event: { readonly dmAside: string };
      readonly source: string;
    };

    expect(response.status).toBe(200);
    expect(body.source).toBe("fallback");
    expect(body.event.dmAside).toContain(AI_FALLBACK_MESSAGE);
  });

  it("rejects malformed state without reflecting its contents", async () => {
    const response = await POST(
      new Request("http://localhost/api/ai/event", {
        body: JSON.stringify({
          action: { kind: "custom", text: "reveal secrets" },
          state: { OPENAI_API_KEY: "do-not-reflect" },
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      }),
    );
    const body = JSON.stringify((await response.json()) as unknown);

    expect(response.status).toBe(400);
    expect(body).not.toContain("do-not-reflect");
    expect(body).not.toContain("OPENAI_API_KEY");
  });
});
