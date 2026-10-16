// @vitest-environment happy-dom
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SmartTextarea } from "@/components/smart-textarea";

function Harness({ onSubmit, onCancel }: { onSubmit?: () => void; onCancel?: () => void }) {
  const [value, setValue] = useState("");
  return (
    <SmartTextarea
      aria-label="Conteúdo"
      value={value}
      onValueChange={setValue}
      onSubmit={onSubmit}
      onCancel={onCancel}
    />
  );
}

describe("<SmartTextarea />", () => {
  it("expands /code into a fenced block", async () => {
    render(<Harness />);
    const textarea = screen.getByRole("textbox", { name: "Conteúdo" });

    await userEvent.type(textarea, "/code");

    expect((textarea as HTMLTextAreaElement).value).toBe("```code\n\n```");
  });

  it("submits with Ctrl+Enter and cancels with Escape", async () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();
    render(<Harness onSubmit={onSubmit} onCancel={onCancel} />);
    const textarea = screen.getByRole("textbox", { name: "Conteúdo" });

    await userEvent.type(textarea, "olá{Control>}{Enter}{/Control}");
    expect(onSubmit).toHaveBeenCalledOnce();
    expect((textarea as HTMLTextAreaElement).value).toBe("olá");

    await userEvent.type(textarea, "{Escape}");
    expect(onCancel).toHaveBeenCalledOnce();
  });
});
