import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("HomePage", () => {
  it("moves visitors from the product promise to character creation", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /the world is stable/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /start your adventure/i }),
    ).toHaveAttribute("href", "/create");
    expect(
      screen.getByRole("heading", { name: /chaos has a contract/i }),
    ).toBeInTheDocument();
  });

  it("exposes an interactive changing-rule preview", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("button", { name: "Shift again" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Incorrectly Correct")).toBeInTheDocument();
  });
});
