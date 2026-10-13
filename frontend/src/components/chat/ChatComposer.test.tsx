import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ChatComposer from "./ChatComposer";

describe("ChatComposer", () => {
  it("renders the exact copy C-05 label, C-06 placeholder, C-07 hint, and C-09 button", () => {
    render(<ChatComposer onSubmit={vi.fn()} />);
    expect(screen.getByLabelText("Your trip request")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "Example: 10 days in Japan in April, two people, mid-range budget.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Press Enter to send. Shift+Enter starts a new line."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Send request" }),
    ).toBeInTheDocument();
  });

  it("Enter submits and Shift+Enter inserts a newline without submitting", () => {
    const onSubmit = vi.fn();
    render(<ChatComposer onSubmit={onSubmit} />);

    const textarea = screen.getByLabelText("Your trip request");
    fireEvent.change(textarea, { target: { value: "10 days in Japan" } });

    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: false });
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("10 days in Japan");

    onSubmit.mockClear();

    fireEvent.change(textarea, { target: { value: "Second line" } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: true });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("Enter while busy is a no-op", () => {
    const onSubmit = vi.fn();
    render(<ChatComposer onSubmit={onSubmit} busy />);

    const textarea = screen.getByLabelText("Your trip request");
    fireEvent.change(textarea, { target: { value: "Should not submit" } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: false });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables the submit button for an empty or whitespace-only draft", () => {
    render(<ChatComposer onSubmit={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Send request" });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Your trip request"), {
      target: { value: "   " },
    });
    expect(button).toBeDisabled();
  });

  it("enables the submit button when the draft has non-whitespace text", () => {
    render(<ChatComposer onSubmit={vi.fn()} />);
    const textarea = screen.getByLabelText("Your trip request");
    const button = screen.getByRole("button", { name: "Send request" });

    expect(button).toBeDisabled();
    fireEvent.change(textarea, { target: { value: "Hello" } });
    expect(button).not.toBeDisabled();
  });

  it("renders C-08 as role=status only while busy", () => {
    const { unmount } = render(<ChatComposer onSubmit={vi.fn()} />);
    expect(screen.queryByText(/A request is already running/)).not.toBeInTheDocument();
    unmount();

    render(<ChatComposer onSubmit={vi.fn()} busy />);
    const status = screen.getByText("A request is already running. Your text stays here until it finishes.");
    expect(status).toHaveAttribute("role", "status");
  });

  it("keeps the textarea enabled and editable while busy", () => {
    render(<ChatComposer onSubmit={vi.fn()} busy />);
    const textarea = screen.getByLabelText("Your trip request");
    expect(textarea).not.toBeDisabled();
    fireEvent.change(textarea, { target: { value: "Still typing" } });
    expect(textarea).toHaveValue("Still typing");
  });

  it("marks the form aria-busy while busy", () => {
    const { container } = render(<ChatComposer onSubmit={vi.fn()} busy />);
    const form = container.querySelector("form");
    expect(form).toHaveAttribute("aria-busy", "true");
  });

  it("calls onSubmit exactly once per submission", () => {
    const onSubmit = vi.fn();
    render(<ChatComposer onSubmit={onSubmit} />);

    const textarea = screen.getByLabelText("Your trip request");
    fireEvent.change(textarea, { target: { value: "Submit me" } });
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: false });
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
