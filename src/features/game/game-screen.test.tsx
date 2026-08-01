import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalAdventureTransport } from "@/features/adventure/engine-transport";
import { saveGameSession } from "@/features/adventure/storage";
import { activateRule } from "@/domain/rules/lifecycle";
import type {
  AdventureTransport,
  CharacterPassport,
  GameState,
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
      const transport = createLocalAdventureTransport({
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
      expect(
        screen.getByRole("heading", { name: "Your mission, in 30 seconds" }),
      ).toBeInTheDocument();
      expect(screen.getByText(/Current objective:/i)).toHaveTextContent(
        "Claim the Golden Offer Letter",
      );
      await user.click(
        screen.getByRole("button", { name: "Show me the choices" }),
      );
      expect(screen.getByRole("heading", { name: "Choose an action" })).toHaveFocus();

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
        screen.getAllByText("MOOD: FUNNY · SOURCE: LOCAL ENGINE").length,
      ).toBeGreaterThan(0);
      expect(
        screen.getByRole("heading", { name: /how this turn was resolved/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("Deterministic fallback")).toBeInTheDocument();
      expect(screen.getByText(/calculated and validated/i)).toBeInTheDocument();
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
      expect(
        screen.getAllByText(
          /Clearly wrong answers deal an additional fixed amount/i,
        ).length,
      ).toBeGreaterThan(0);
      expect(
        screen.getByText("Wrong answers do not deal bonus enemy damage."),
      ).toBeInTheDocument();
      expect(screen.getByText("3 OF 3 TURNS REMAIN")).toBeInTheDocument();
      await user.click(
        screen.getByRole("button", {
          name: "Continue with deterministic rules",
        }),
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

      await user.click(screen.getByRole("button", { name: "Inventory" }));
      expect(
        screen.getByRole("dialog", { name: "Inventory" }),
      ).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Close panel" }));

      await user.click(screen.getByRole("button", { name: "History" }));
      expect(
        screen.getByRole("dialog", { name: "Adventure history" }),
      ).toBeInTheDocument();
      expect(
        screen.getByText("The examiner failed its own assessment"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Incorrectly Correct activated/i),
      ).toBeInTheDocument();
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
    const transport = createLocalAdventureTransport({
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
    const baseTransport = createLocalAdventureTransport({
      delayMs: 0,
      idFactory: () => "pending-flow",
    });
    const session = await baseTransport.createSession(passport);
    let resolveSubmission!: (state: GameState) => void;
    const pendingSubmission = new Promise<GameState>((resolve) => {
      resolveSubmission = resolve;
    });
    const submitAction = vi.fn(() => pendingSubmission);
    const transport: AdventureTransport = {
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

  it("shows authoritative rule expiration feedback after duration reaches zero", async () => {
    const user = userEvent.setup();
    const transport = createLocalAdventureTransport({
      delayMs: 0,
      idFactory: () => "expiration-flow",
    });
    const session = await transport.createSession(passport);
    const ruledSession = activateRule(session, {
      duration: 1,
      id: "one-turn-rule",
      key: "no_repeat_action",
      parameters: {},
    }).state;
    saveGameSession(ruledSession);
    render(<GameScreen sessionId={session.sessionId} transport={transport} />);

    await user.click(
      await screen.findByRole("button", {
        name: /Follow the bell into the archive/i,
      }),
    );

    expect(
      await screen.findByText(/RuleShift expired/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No Repeat Action expired/i),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Reality is currently stable").length,
    ).toBeGreaterThan(0);
  });
});
