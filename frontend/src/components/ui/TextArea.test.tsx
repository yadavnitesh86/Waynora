import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import TextArea from "./TextArea";
import * as barrel from "./index";

describe("TextArea", () => {
  it("is exported from the ui barrel", () => {
    expect(barrel.TextArea).toBe(TextArea);
  });

  it("renders a visible label bound to the textarea via useId", () => {
    render(<TextArea label="Your trip request" />);
    const textarea = screen.getByLabelText("Your trip request");
    expect(textarea.tagName).toBe("TEXTAREA");
  });

  it("applies min-h-88px and max-h-192px sizing classes", () => {
    const { container } = render(<TextArea label="Test" defaultValue="Hello world" />);
    const textarea = container.querySelector("textarea");
    expect(textarea).toHaveClass("min-h-[88px]");
    expect(textarea).toHaveClass("max-h-[192px]");
  });

  it("wires hint and error into aria-describedby with aria-invalid on error", () => {
    render(<TextArea label="Trip" hint="Press Enter to send." error="Something went wrong" />);
    const textarea = screen.getByLabelText("Trip");
    const describedBy = textarea.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();
    const ids = (describedBy ?? "").split(" ");
    expect(ids.length).toBeGreaterThanOrEqual(2);
    for (const id of ids) {
      const el = document.getElementById(id);
      expect(el).not.toBeNull();
    }
    expect(textarea).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
  });

  it("has a 44px+ touch target via min-h-88px plus padding", () => {
    const { container } = render(<TextArea label="Test" />);
    const textarea = container.querySelector("textarea");
    expect(textarea).toHaveClass("min-h-[88px]");
    expect(textarea).toHaveClass("px-md");
  });
});
