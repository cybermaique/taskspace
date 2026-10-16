# Banco de dados (Supabase)

| Caminho | Quando usar |
| --- | --- |
| [`schema.sql`](schema.sql) | **Projeto novo.** Cria tabelas, triggers, funções, buckets e políticas de RLS de uma vez. Não execute em um banco com dados: ele recria as políticas. |
| [`migrations/`](migrations) | **Projeto existente.** Aplique em ordem, pelo nome, as migrations ainda não executadas. |
| [`scripts/`](scripts) | Manutenção pontual de bases antigas. Leia o cabeçalho de cada script antes de executar. |

## Modelo

- `tasks` → `subtasks`, `task_attachments`, `task_comments`, `task_status_history`, `task_description_history`
- `notes` → `note_attachments`
- `profiles` (1:1 com `auth.users`)

Todas as tabelas usam **Row Level Security**: cada linha pertence ao `user_id` de quem a criou, e as tabelas filhas herdam o acesso pela tarefa ou anotação. O histórico de status e de descrição é gravado por **triggers**, não pela aplicação.

## Migrations recentes

- `20261015000000_historico_de_descricao_para_todos.sql`: o histórico de descrição passa a valer para todos os usuários (antes dependia de um e-mail fixo).
- `20261015010000_reordenacao_atomica.sql`: funções `reorder_tasks`, `reorder_subtasks` e `reorder_pinned_notes`, que reordenam com um único `UPDATE` (atômico) e respeitam o RLS (`security invoker`). Enquanto não forem aplicadas, a aplicação cai automaticamente no caminho antigo.

## Scripts

- `remove-pomodoro.sql`: remove campos e histórico do antigo recurso de Pomodoro (irreversível).
- `restore-legacy-data-ownership.sql`: reassocia dados sem `user_id` à única conta do projeto.
- `add-note-titles.sql`: gera títulos para anotações antigas a partir do conteúdo.
