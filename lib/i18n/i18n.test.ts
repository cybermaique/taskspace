import { describe, expect, it } from "vitest";

import { createTaskSchema, describeIssue, validationErrorMap } from "@/lib/api/schemas";
import { createDemoServer, DemoHttpError } from "@/lib/demo/demo-server";
import { createDemoState } from "@/lib/demo/seed";
import { formatDateTime, formatPlainDate, formatRelative } from "@/lib/format";
import { LOCALES, resolveLocale, translate, type Locale } from "@/lib/i18n";
import { messages } from "@/lib/i18n/messages";
import { getTaskCategoryLabel } from "@/types/task";

describe("language selection and translations", () => {
  it("accepts only supported cookies and falls back to Portuguese", () => {
    for (const locale of LOCALES) expect(resolveLocale(locale)).toBe(locale);
    for (const value of [undefined, "fr", "en-US", "__proto__", "<script>"]) {
      expect(resolveLocale(value)).toBe("pt-BR");
    }
  });

  it("keeps interpolation tokens in both translations", () => {
    const tokens = (text: string) => [...text.matchAll(/\{\w+\}/g)].map(([token]) => token).sort();
    for (const [source, translations] of Object.entries(messages)) {
      for (const translated of translations) {
        expect(translated.trim(), source).not.toBe("");
        expect(tokens(translated), source).toEqual(tokens(source));
      }
    }
  });

  it("interpolates names as text and never treats them as translation keys", () => {
    expect(translate("en", "Ações de {name}", { name: "Tarefas {title} $&" }))
      .toBe("Actions for Tarefas {title} $&");
    expect(translate("es", "Mostrar mais {count}", { count: 3 })).toBe("Mostrar 3 más");
    expect(translate("pt-BR", "Nova tarefa")).toBe("Nova tarefa");
    expect(translate("en", "__proto__")).toBe("__proto__");
  });

  it("translates built-in categories and preserves custom categories", () => {
    expect(getTaskCategoryLabel("trabalho", "en")).toBe("Work");
    expect(getTaskCategoryLabel("pessoal", "es")).toBe("Personal");
    expect(getTaskCategoryLabel("Tarefas", "en")).toBe("Tarefas");
    expect(getTaskCategoryLabel(null, "es")).toBeNull();
  });
});

describe("localized dates and validation", () => {
  it("changes date order without moving a plain date to another day", () => {
    expect(formatPlainDate("2026-03-01", "en")).toBe("03/01/2026");
    expect(formatPlainDate("2026-03-01", "es")).toBe("01/03/2026");
    expect(formatDateTime("2026-03-02T02:30:00Z", "en")).toMatch(/3\/1\/26.*11:30/);
    const now = Date.parse("2026-03-10T12:00:00Z");
    expect(formatRelative("2026-03-09T12:00:00Z", now, "en")).toBe("yesterday");
    expect(formatRelative("2026-03-09T12:00:00Z", now, "es")).toBe("ayer");
  });

  it("localizes explicit schema errors without changing shared global state", () => {
    const error = createTaskSchema.safeParse({ title: "" }).error!;
    expect(describeIssue(error, "en")).toBe("Enter a task title.");
    expect(describeIssue(error, "es")).toBe("Introduce un título para la tarea.");
    expect(describeIssue(error, "pt-BR")).toBe("Informe um título para a tarefa.");
    const input = { title: "x".repeat(201) };
    const english = createTaskSchema.safeParse(input, { error: validationErrorMap("en") }).error!;
    const spanish = createTaskSchema.safeParse(input, { error: validationErrorMap("es") }).error!;
    expect(english.issues[0].message).not.toBe(spanish.issues[0].message);
    expect(createTaskSchema.safeParse(input, { error: validationErrorMap("en") }).error?.issues[0].message)
      .toBe(english.issues[0].message);
  });

  it("uses the current language for demo requests without recreating or changing data", () => {
    const state = createDemoState();
    let locale: Locale = "en";
    const server = createDemoServer(state, () => locale);
    const invalid = () => server.handle("POST", "/api/tasks", { title: "" });
    expect(invalid).toThrow("Enter a task title.");
    locale = "es";
    expect(invalid).toThrow("Introduce un título para la tarea.");
    expect(invalid).toThrow(DemoHttpError);
    expect(state.tasks[0].title).toBe("Redesenhar o fluxo de onboarding do app");
  });
});
