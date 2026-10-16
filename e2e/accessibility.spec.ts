import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/** Fails on serious or critical WCAG 2.2 AA violations, listing each one. */
async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .exclude("nextjs-portal")
    .analyze();
  const blocking = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) => `${violation.id}: ${violation.help} (${violation.nodes.length}x) → ${violation.nodes[0]?.target.join(" ")}`);
  expect(blocking, blocking.join("\n")).toEqual([]);
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`tema ${scheme}`, () => {
    test.use({ colorScheme: scheme });

    test("quadro de tarefas", async ({ page }) => {
      await page.goto("/demo");
      await expect(page.getByRole("heading", { name: "Tarefas", level: 1 })).toBeVisible();
      await expectAccessible(page);
    });

    test("painel de detalhes", async ({ page }) => {
      await page.goto("/demo");
      await page.getByRole("button", { name: "Redesenhar o fluxo de onboarding do app", exact: true }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await expectAccessible(page);
    });

    test("anotações", async ({ page }) => {
      await page.goto("/demo");
      await page.getByRole("button", { name: /^Anotações/ }).click();
      await expect(page.getByRole("heading", { name: "Anotações", level: 1 })).toBeVisible();
      await expectAccessible(page);
    });

    test("login", async ({ page }) => {
      await page.goto("/login");
      await expect(page.getByRole("button", { name: "Entrar" })).toBeVisible();
      await expectAccessible(page);
    });
  });
}
