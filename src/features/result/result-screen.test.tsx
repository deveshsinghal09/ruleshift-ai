import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalAdventureTransport } from "@/features/adventure/engine-transport";
import type { CharacterPassport } from "@/features/adventure/types";
import { ResultScreen } from "@/features/result/result-screen";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const passport: CharacterPassport = {
  archetype: "Placement Warrior",
  difficulty: "normal",
  mood: "funny",
  name: "Devesh",
  title: "the Placement Warrior",
};

describe("ResultScreen", () => {
  beforeEach(() => {
    window.localStorage.clear();
    pushMock.mockClear();
  });

  it("shows the completed result, timeline, and private result image", async () => {
    const user = userEvent.setup();
    const transport = createLocalAdventureTransport({
      delayMs: 0,
      idFactory: () => "result-flow",
    });
    const session = await transport.createSession(passport);

    await transport.submitAction(session.sessionId, {
      actionId: "follow-bell",
      requestId: "result-1",
    });
    await transport.submitAction(session.sessionId, {
      actionId: "binary-search",
      requestId: "result-2",
    });
    await transport.submitAction(session.sessionId, {
      customAction: "Submit a résumé written entirely in valid JSON.",
      requestId: "result-3",
    });
    await transport.submitAction(session.sessionId, {
      actionId: "open-letter",
      requestId: "result-4",
    });

    render(
      <ResultScreen sessionId={session.sessionId} transport={transport} />,
    );

    expect(
      await screen.findByRole("heading", {
        name: "The Golden Offer Letter is yours.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Golden Offer Letter claimed")).toBeInTheDocument();
    expect(
      screen.getAllByText("Résumé of Questionable Experience", { exact: true })
        .length,
    ).toBeGreaterThan(0);

    await user.click(screen.getByRole("button", { name: "Share result" }));
    expect(
      screen.getByRole("dialog", {
        name: "Your shareable adventure image",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: "RuleShift AI victory result card for Devesh",
      }),
    ).toHaveAttribute(
      "src",
      expect.stringContaining("/api/sessions/result-flow/result/image"),
    );
    expect(screen.getByRole("link", { name: "Open image" })).toHaveAttribute(
      "href",
      "/api/sessions/result-flow/result/image",
    );
  });
});
