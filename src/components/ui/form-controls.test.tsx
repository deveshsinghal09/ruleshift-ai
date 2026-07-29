import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

describe("form controls", () => {
  it("uses associated labels as accessible names", () => {
    render(
      <>
        <label htmlFor="character">Character name</label>
        <Input id="character" />
        <label htmlFor="action">Custom action</label>
        <Textarea id="action" />
      </>,
    );

    expect(
      screen.getByRole("textbox", { name: "Character name" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("textbox", { name: "Custom action" }),
    ).toBeInTheDocument();
  });

  it("exposes invalid state without relying on color", () => {
    render(
      <>
        <label htmlFor="action">Custom action</label>
        <Textarea
          aria-describedby="action-error"
          aria-invalid="true"
          id="action"
        />
        <p id="action-error">Describe a smaller action.</p>
      </>,
    );

    const textarea = screen.getByRole("textbox", { name: "Custom action" });

    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(textarea).toHaveAccessibleDescription("Describe a smaller action.");
  });

  it("requires an accessible progress label", () => {
    render(
      <Progress
        label="Player health"
        value={72}
        valueLabel="72 of 100 health"
      />,
    );

    expect(
      screen.getByRole("progressbar", { name: "Player health" }),
    ).toHaveAttribute("aria-valuetext", "72 of 100 health");
  });
});
