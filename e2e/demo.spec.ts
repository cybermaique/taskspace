import { expect, test, type Page } from "@playwright/test";

async function openDemo(page: Page) {
  await page.goto("/demo");
  await expect(page.getByRole("heading", { name: "Tarefas", level: 1 })).toBeVisible();
}

const column = (page: Page, name: string) => page.getByRole("region", { name, exact: true });
const card = (page: Page, title: string) => page.getByRole("button", { name: title, exact: true });

test.beforeEach(async ({ page }) => {
  await openDemo(page);
});

test("mostra o quadro de demonstração com as quatro colunas", async ({ page }) => {
  await expect(page.getByText("Modo demonstração.")).toBeVisible();
  for (const name of ["A fazer", "Em andamento", "Aguardando", "Concluída"]) {
    await expect(column(page, name)).toBeVisible();
  }
});

test("cria uma tarefa pela coluna e adiciona uma subtarefa", async ({ page }) => {
  const todo = column(page, "A fazer");
  await todo.getByRole("button", { name: "Adicionar tarefa" }).click();
  await page.getByLabel("Título da nova tarefa").fill("Revisar contrato");
  await page.keyboard.press("Enter");

  await expect(todo.getByRole("button", { name: "Revisar contrato", exact: true })).toBeVisible();

  await todo.getByRole("button", { name: "Revisar contrato", exact: true }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByLabel("Título da tarefa")).toHaveValue("Revisar contrato");

  await sheet.getByLabel("Nova subtarefa").fill("Ler cláusulas");
  await sheet.getByLabel("Nova subtarefa").press("Enter");
  await expect(sheet.getByRole("checkbox", { name: "Ler cláusulas" })).toBeVisible();
  await expect(sheet.getByText("0/1")).toBeVisible();
});

test("move uma tarefa de coluna pelo menu de ações", async ({ page }) => {
  const title = "Planejar viagem para Lisboa";
  await page.getByRole("button", { name: `Ações de ${title}` }).click();
  await page.getByRole("menuitem", { name: "Mover para" }).click();
  await page.getByRole("menuitemradio", { name: "Concluída" }).click();

  await expect(column(page, "Concluída").getByRole("button", { name: title, exact: true })).toBeVisible();
});

test("arrasta um card para outra coluna", async ({ page, isMobile }) => {
  test.skip(isMobile, "No celular o arraste usa toque longo; coberto pelo teste do menu.");
  const title = "Corrigir upload de PDF acima de 20 MB no Safari";
  const source = card(page, title);
  const target = column(page, "Aguardando");
  await source.scrollIntoViewIfNeeded();

  const from = await source.boundingBox();
  const to = await target.boundingBox();
  await page.mouse.move(from!.x + from!.width / 2, from!.y + 20);
  await page.mouse.down();
  await page.mouse.move(to!.x + to!.width / 2, to!.y + 80, { steps: 20 });
  await page.mouse.up();

  await expect(target.getByRole("button", { name: title, exact: true })).toBeVisible();
  await expect(column(page, "A fazer").getByRole("button", { name: title, exact: true })).toBeHidden();
});

test("move um card pelo teclado", async ({ page, isMobile }) => {
  test.skip(isMobile, "Arraste por teclado é um recurso de desktop.");
  const title = "Planejar viagem para Lisboa";
  await card(page, title).focus();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Space");

  await expect(column(page, "Em andamento").getByRole("button", { name: title, exact: true })).toBeVisible();
  // Space only drags: it must not also open the task.
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("exclui e desfaz pela notificação", async ({ page }) => {
  const title = "Corrigir upload de PDF acima de 20 MB no Safari";
  await page.getByRole("button", { name: `Ações de ${title}` }).click();
  await page.getByRole("menuitem", { name: "Excluir" }).click();
  await expect(card(page, title)).toBeHidden();

  await page.getByRole("button", { name: "Desfazer" }).click();
  await expect(card(page, title)).toBeVisible();
});

test("a paleta de comandos encontra e abre uma tarefa", async ({ page, isMobile }) => {
  if (isMobile) await page.getByRole("button", { name: "Buscar" }).click();
  else await page.keyboard.press("Control+k");

  await page.getByRole("combobox", { name: "Buscar" }).fill("lisboa");
  await page.keyboard.press("Enter");

  await expect(page.getByRole("dialog").getByLabel("Título da tarefa")).toHaveValue(
    "Planejar viagem para Lisboa",
  );
});

test("cria e fixa uma anotação", async ({ page }) => {
  await page.getByRole("button", { name: /^Anotações/ }).click();
  await expect(page.getByRole("heading", { name: "Anotações", level: 1 })).toBeVisible();

  await page.getByRole("button", { name: "Nova anotação" }).first().click();
  await page.getByLabel("Título").fill("Ideias de produto");
  await page.getByPlaceholder(/Escreva livremente/).fill("Exportar para PDF #roadmap");
  await page.keyboard.press("Control+Enter");

  const viewer = page.getByRole("dialog");
  await expect(viewer.getByRole("heading", { name: "Ideias de produto" })).toBeVisible();
  await viewer.getByRole("button", { name: "Fixar" }).click();
  await page.keyboard.press("Escape");

  await expect(page.getByRole("button", { name: "#roadmap" }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Ideias de produto", exact: true })).toBeVisible();
});

test("mantém as alterações após recarregar", async ({ page }) => {
  const todo = column(page, "A fazer");
  await todo.getByRole("button", { name: "Adicionar tarefa" }).click();
  await page.getByLabel("Título da nova tarefa").fill("Persistir no navegador");
  await page.keyboard.press("Enter");
  await expect(card(page, "Persistir no navegador")).toBeVisible();

  await page.reload();
  await expect(card(page, "Persistir no navegador")).toBeVisible();
});
