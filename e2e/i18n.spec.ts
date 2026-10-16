import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const locales = [
  { locale: "pt-BR", tasks: "Tarefas", todo: "A fazer", notes: "Anotações", language: "Idioma", newTask: "Nova tarefa", title: "Título", create: "Criar tarefa", preferences: "Preferências", account: "Abrir menu da conta", close: "Fechar", priority: "Prioridade", medium: "Média", calendar: "Criadas em…", nextMonth: "Próximo mês", today: "Hoje" },
  { locale: "en", tasks: "Tasks", todo: "To do", notes: "Notes", language: "Language", newTask: "New task", title: "Title", create: "Create task", preferences: "Preferences", account: "Open account menu", close: "Close", priority: "Priority", medium: "Medium", calendar: "Created on…", nextMonth: "Next month", today: "Today" },
  { locale: "es", tasks: "Tareas", todo: "Por hacer", notes: "Notas", language: "Idioma", newTask: "Nueva tarea", title: "Título", create: "Crear tarea", preferences: "Preferencias", account: "Abrir menú de la cuenta", close: "Cerrar", priority: "Prioridad", medium: "Media", calendar: "Creadas el…", nextMonth: "Mes siguiente", today: "Hoy" },
] as const;

for (const copy of locales) {
  test(`renders, creates and navigates in ${copy.locale}`, async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "taskspace-locale", value: copy.locale, url: baseURL! }]);
    const response = await page.goto("/demo");
    expect(await response!.text()).toContain(`lang="${copy.locale}"`);
    await expect(page.getByRole("heading", { name: copy.tasks, level: 1 })).toBeVisible();
    await expect(page.getByRole("region", { name: copy.todo, exact: true })).toBeVisible();
    await expect(page.getByRole("combobox", { name: copy.language })).toHaveValue(copy.locale);

    await page.keyboard.press("c");
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("textbox", { name: copy.title, exact: true }).fill("Tarefas");
    await expect(dialog.getByRole("combobox", { name: copy.priority })).toContainText(copy.medium);
    await dialog.getByRole("button", { name: new RegExp(`^${copy.create}`) }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    // A user title which is also a translation key must be preserved verbatim.
    await expect(page.getByRole("region", { name: copy.todo, exact: true }).getByRole("button", { name: "Tarefas", exact: true })).toBeVisible();

    await page.getByRole("button", { name: new RegExp(`^${copy.notes}`) }).click();
    await expect(page.getByRole("heading", { name: copy.notes, level: 1 })).toBeVisible();
    const audit = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).exclude("nextjs-portal").analyze();
    expect(audit.violations.filter((v) => v.impact === "serious" || v.impact === "critical")).toEqual([]);
    await page.getByRole("button", { name: new RegExp(`^${copy.tasks}`) }).click();
    await page.getByRole("button", { name: copy.calendar }).click();
    await expect(page.getByRole("button", { name: copy.nextMonth })).toBeVisible();
    await expect(page.getByRole("button", { name: copy.today, exact: true })).toBeVisible();
    await page.getByRole("button", { name: copy.calendar }).click();
    await page.getByRole("button", { name: copy.account }).click();
    await page.getByRole("menuitem", { name: copy.preferences }).click();
    await expect(page.getByRole("dialog").getByRole("heading", { name: copy.preferences })).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("combobox", { name: copy.language })).toHaveValue(copy.locale);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test("language changes keep login drafts and persist across navigation and reload", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("textbox", { name: "E-mail" }).fill("draft@example.com");
  await page.getByRole("combobox", { name: "Idioma" }).selectOption("en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("textbox", { name: "Email", exact: true })).toHaveValue("draft@example.com");
  await expect(page).toHaveTitle("Sign in · Taskspace");
  await page.getByRole("button", { name: "Explore the demo" }).click();
  await expect(page.getByRole("heading", { name: "Tasks", level: 1 })).toBeVisible();
  await page.getByRole("combobox", { name: "Language" }).selectOption("es");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Tareas", level: 1 })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  await page.getByRole("combobox", { name: "Idioma" }).selectOption("pt-BR");
  await expect(page.getByRole("heading", { name: "Tarefas", level: 1 })).toBeVisible();
});

test("unsupported language cookies fall back to Portuguese on the server", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "taskspace-locale", value: "fr", url: baseURL! }]);
  const response = await page.goto("/demo");
  expect(await response!.text()).toContain('lang="pt-BR"');
  await expect(page.getByRole("heading", { name: "Tarefas", level: 1 })).toBeVisible();
});
