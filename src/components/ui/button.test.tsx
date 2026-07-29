import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("exposes its accessible name and receives keyboard focus", async () => {
    const user = userEvent.setup();
    render(<Button>Enter the world</Button>);

    const button = screen.getByRole("button", { name: "Enter the world" });
    await user.tab();

    expect(button).toHaveFocus();
  });

  it("prevents disabled interaction", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(
      <Button disabled onClick={handleClick}>
        Locked action
      </Button>,
    );

    await user.click(screen.getByRole("button", { name: "Locked action" }));

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("keeps the label available while loading", () => {
    render(<Button loading>Rewriting reality</Button>);

    const button = screen.getByRole("button", {
      name: "Rewriting reality",
    });

    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
