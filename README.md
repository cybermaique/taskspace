# Taskboard

Organizador pessoal de tarefas, subtarefas e anotações, persistido no Supabase.

## Stack

- Next.js 16 (App Router, Server Components, `proxy.ts`)
- React 19 + TypeScript
- Tailwind CSS v4 com tokens de tema (claro, escuro e conforto)
- Base UI (primitivos acessíveis) e dnd-kit (arrastar e soltar com mouse, toque e teclado)
- Supabase (Auth, Postgres com RLS e Storage)

## Recursos

- **Quadro Kanban** com arrastar entre colunas (inclusive no celular), criação rápida inline por coluna e visualização alternativa em **lista**
- **Painel de detalhes** com edição inline de título, status, prioridade, categoria e tipo; descrição com links e blocos de código; subtarefas reordenáveis; anexos (colar print, arrastar ou escolher); comentários e histórico de status
- **Anotações** em grade, com #tags, fixadas reordenáveis, anexos e visualização/edição em uma única janela
- **Paleta de comandos** (`Ctrl K`) que busca tarefas, anotações e ações
- Indicadores do quadro com conclusões dos últimos 14 dias
- Lixeira com restauração e "Desfazer" logo após excluir
- Preferências: foto, nome, cor de destaque, tema e densidade (confortável/compacta)
- Atualizações otimistas: mover, concluir e excluir respondem na hora e são revertidos se a API falhar

### Atalhos

| Tecla | Ação |
| --- | --- |
| `Ctrl K` | Paleta de comandos |
| `C` | Nova tarefa / anotação |
| `/` | Focar a busca |
| `1` / `2` | Tarefas / Anotações |
| `?` | Lista de atalhos |
| `Ctrl Enter` | Salvar formulários |

## Arquitetura

```
app/
  page.tsx          # Server Component: autentica e carrega tarefas, anotações e perfil
  login/            # Tela de entrada (redireciona se já houver sessão)
  api/              # Route Handlers (todos via withAuth em lib/api/route.ts)
proxy.ts            # Renova a sessão do Supabase a cada requisição
components/
  workspace/        # Provider de estado, shell (sidebar/nav mobile), paleta, diálogos globais
  tasks/            # Quadro, lista, card, painel de detalhes, criação
  notes/            # Grade, card e editor de anotações
  ui/               # Primitivos (Base UI + Tailwind)
lib/
  tasks.ts, notes.ts  # Acesso a dados no servidor
  auth.ts             # Usuário e perfil da requisição (React cache)
  api-client.ts       # fetch tipado para o cliente
```

O estado do cliente vive em `WorkspaceProvider`, que expõe dados, ações (com atualização otimista) e estado de interface por contextos separados. A seção atual e a tarefa aberta ficam na URL (`?view=notes`, `?task=<id>`), então links e recarregamentos preservam o contexto.

## Configuração

1. Crie um projeto no Supabase.
2. No SQL Editor, execute [`supabase/schema.sql`](supabase/schema.sql).
3. Crie `.env.local` com:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
```

4. Instale e execute:

```bash
npm install
npm run dev
```

## Atualização de projeto existente

Não execute `schema.sql` novamente em um projeto que já possui dados: ele é o bootstrap de um projeto novo e também recria as políticas de acesso.

Para remover o recurso antigo de Pomodoro, execute apenas [`supabase/remove-pomodoro.sql`](supabase/remove-pomodoro.sql). O script remove campos e o histórico de sessões; essa exclusão é permanente.

Se `schema.sql` foi executado numa base existente e as tarefas/anotações desapareceram, execute [`supabase/restore-legacy-data-ownership.sql`](supabase/restore-legacy-data-ownership.sql). Ele reassocia dados sem `user_id` à única conta do projeto, sem apagar registros.

Para adicionar títulos às anotações de uma base já existente, execute [`supabase/add-note-titles.sql`](supabase/add-note-titles.sql). Ele cria títulos a partir do primeiro trecho útil de cada anotação, sem mudar as datas registradas.
