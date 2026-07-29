import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createLocalAdventureTransport } from "@/features/adventure/engine-transport";
import { CharacterCreator } from "@/features/character/character-creator";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("CharacterCreator", () => {
  beforeEach(() => {
    window.localStorage.clear();
    pushMock.mockClear();
  });

  it("validates custom character fields", async () => {
    const user = userEvent.setup();
    render(<CharacterCreator />);

    await user.clear(screen.getByLabelText("Character name"));
    await user.clear(screen.getByLabelText("Character title"));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter at least two characters.",
    );
    expect(
      screen.getByRole("heading", { name: "Who enters the unstable world?" }),
    ).toBeInTheDocument();
  });

  it("preserves character and mood selections while moving backward", async () => {
    const user = userEvent.setup();
    render(<CharacterCreator />);
    await waitFor(() => {
      expect(screen.getByLabelText("Character name")).toHaveValue("Devesh");
    });

    const mira = screen.getByRole("button", {
      name: "Mira, the Bug Bard",
    });
    await user.click(mira);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: /Sci-Fi/i }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Back" }));

    expect(
      screen.getByRole("button", { name: /Sci-Fi/i }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(mira).toHaveAttribute("aria-pressed", "true");
  });

  it("creates a local session from the final passport", async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    const transport = createLocalAdventureTransport({
      delayMs: 0,
      idFactory: () => "character-flow",
    });
    render(
      <CharacterCreator onComplete={onComplete} transport={transport} />,
    );
    await waitFor(() => {
      expect(screen.getByLabelText("Character name")).toHaveValue("Devesh");
    });

    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(
      screen.getByRole("button", { name: /Enter the haunted campus/i }),
    );

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith("character-flow");
    });
  });
});
