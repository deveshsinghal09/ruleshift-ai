import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createMockAdventureTransport } from "@/features/adventure/mock-transport";
import type {
  CharacterPassport,
  MockAdventureTransport,
  MockGameState,
} from "@/features/adventure/types";
import { GameScreen } from "@/features/game/game-screen";

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

describe("GameScreen", () => {
  beforeEach(() => {
    window.localStorage.clear();
    pushMock.mockClear();
  });

  it(
    "plays multiple turns, handles a RuleShift, inventory, timeline, and result",
    async () => {
      const user = userEvent.setup();
      const onComplete = vi.fn();
      const transport = createMockAdventureTransport({
        delayMs: 0,
        idFactory: () => "playable-flow",
      });
      const session = await transport.createSession(passport);
      render(
        <GameScreen
          onComplete={onComplete}
          sessionId={session.sessionId}
          transport={transport}
        />,
      );

      expect(
        await screen.findByRole("heading", {
          name: "The attendance bell rings for you",
        }),
      ).toBeInTheDocument();

      await user.click(
        screen.getByRole("button", {
          name: /Follow the bell into the archive/i,
        }),
      );
      expect(
        await screen.findByRole("heading", {
          name: "A binary-search challenge blocks the quad",
        }),
      ).toHaveFocus();
      expect(
        screen.getAllByText("MOOD: FUNNY · SOURCE: SCRIPTED FALLBACK").length,
      ).toBeGreaterThan(0);
      expect(
        screen.getByText(/Funny lens: the danger is real/i),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Try a custom action")).toHaveAttribute(
        "maxlength",
        "300",
      );

      await user.click(
        screen.getByRole("button", {
          name: /Binary-search the examiner’s patience/i,
        }),
      );
      expect(
        await screen.findByRole("dialog", { name: "Incorrectly Correct" }),
      ).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", { name: "I understand the new rule" }),
      );

      const customAction = screen.getByLabelText("Try a custom action");
      await user.type(
        customAction,
        "Convince the rubric that semicolons are leadership.",
      );
      await user.click(
        screen.getByRole("button", { name: /Resolve custom action/i }),
      );

      expect(
        await screen.findByText("Résumé of Questionable Experience"),
      ).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Items" }));
      expect(
        screen.getByRole("dialog", { name: "Inventory" }),
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Close panel" }));

      await user.click(screen.getByRole("button", { name: "Timeline" }));
      expect(
        screen.getByRole("dialog", { name: "Adventure timeline" }),
      ).toBeInTheDocument();
      expect(screen.getByText("Item collected")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Close panel" }));

      await user.click(
        screen.getByRole("button", { name: /Open the Golden Offer Letter/i }),
      );
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith("playable-flow");
      });
    },
    15_000,
  );

  it("opens player status from mobile navigation", async () => {
    const user = userEvent.setup();
    const transport = createMockAdventureTransport({
      delayMs: 0,
      idFactory: () => "mobile-flow",
    });
    const session = await transport.createSession(passport);
    render(<GameScreen sessionId={session.sessionId} transport={transport} />);

    await screen.findByText("The attendance bell rings for you");
    await user.click(screen.getByRole("button", { name: "Player" }));

    expect(
      screen.getByRole("dialog", { name: "Player status" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Devesh").length).toBeGreaterThan(0);
  });

  it("prevents duplicate action submissions while a turn is pending", async () => {
    const baseTransport = createMockAdventureTransport({
      delayMs: 0,
      idFactory: () => "pending-flow",
    });
    const session = await baseTransport.createSession(passport);
    let resolveSubmission!: (state: MockGameState) => void;
    const pendingSubmission = new Promise<MockGameState>((resolve) => {
      resolveSubmission = resolve;
    });
    const submitAction = vi.fn(() => pendingSubmission);
    const transport: MockAdventureTransport = {
      ...baseTransport,
      submitAction,
    };
    const user = userEvent.setup();
    render(<GameScreen sessionId={session.sessionId} transport={transport} />);

    const action = await screen.findByRole("button", {
      name: /Follow the bell into the archive/i,
    });
    await user.click(action);
    await user.click(action);

    expect(submitAction).toHaveBeenCalledTimes(1);
    expect(action).toBeDisabled();

    await act(async () => {
      resolveSubmission(session);
      await pendingSubmission;
    });
  });
});
