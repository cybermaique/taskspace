import { describe, expect, it } from "vitest";

import {
  formatDateTime,
  formatFileSize,
  formatPlainDate,
  formatRelative,
  pluralize,
} from "@/lib/format";
import { expandSlashCodeCommand } from "@/lib/text-shortcuts";

describe("dates", () => {
  it("formats plain dates without shifting the day across timezones", () => {
    expect(formatPlainDate("2026-03-01")).toBe("01/03/2026");
    expect(formatPlainDate(null)).toBe("-");
  });

  it("uses São Paulo time so server and client render the same string", () => {
    // 02:30 UTC is still the previous evening in São Paulo.
    expect(formatDateTime("2026-03-02T02:30:00.000Z")).toBe("01/03/2026, 23:30");
  });

  it("describes recent moments relatively", () => {
    const now = Date.parse("2026-03-10T12:00:00.000Z");
    expect(formatRelative("2026-03-10T11:59:50.000Z", now)).toBe("agora");
    expect(formatRelative("2026-03-10T11:30:00.000Z", now)).toBe("há 30 minutos");
    expect(formatRelative("2026-03-09T12:00:00.000Z", now)).toBe("ontem");
  });
});

describe("numbers and words", () => {
  it("formats file sizes", () => {
    expect(formatFileSize(null)).toBe("—");
    expect(formatFileSize(512)).toBe("512 B");
    expect(formatFileSize(2048)).toBe("2.0 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5.0 MB");
  });

  it("pluralizes", () => {
    expect(pluralize(1, "tarefa", "tarefas")).toBe("1 tarefa");
    expect(pluralize(3, "tarefa", "tarefas")).toBe("3 tarefas");
  });
});

describe("expandSlashCodeCommand", () => {
  it("expands /json at the start of a line and places the caret inside", () => {
    const value = "Payload:\n/json";
    const result = expandSlashCodeCommand(value, value.length, value.length);
    expect(result?.value).toBe("Payload:\n```json\n\n```");
    expect(result?.caretPosition).toBe("Payload:\n```json\n".length);
  });

  it("ignores commands in the middle of a sentence", () => {
    const value = "use /code";
    expect(expandSlashCodeCommand(value, value.length, value.length)).toBeNull();
  });
});
