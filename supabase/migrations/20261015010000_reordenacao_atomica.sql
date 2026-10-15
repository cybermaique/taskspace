-- Reordenação atômica: um único UPDATE por operação, em vez de N requisições.
-- SECURITY INVOKER mantém as políticas de RLS do usuário que chama a função.

create or replace function public.reorder_tasks(task_ids uuid[])
returns void
language sql
security invoker
set search_path = public
as $$
  update public.tasks as t
  set position = o.ordinality - 1
  from unnest(task_ids) with ordinality as o(id, ordinality)
  where t.id = o.id
    and t.deleted_at is null
    and t.position is distinct from o.ordinality - 1;
$$;

create or replace function public.reorder_subtasks(p_task_id uuid, subtask_ids uuid[])
returns void
language sql
security invoker
set search_path = public
as $$
  update public.subtasks as s
  set position = o.ordinality - 1
  from unnest(subtask_ids) with ordinality as o(id, ordinality)
  where s.id = o.id
    and s.task_id = p_task_id
    and s.position is distinct from o.ordinality - 1;
$$;

create or replace function public.reorder_pinned_notes(note_ids uuid[])
returns void
language sql
security invoker
set search_path = public
as $$
  update public.notes as n
  set pinned_position = o.ordinality - 1
  from unnest(note_ids) with ordinality as o(id, ordinality)
  where n.id = o.id
    and n.is_pinned
    and n.deleted_at is null;
$$;

grant execute on function public.reorder_tasks(uuid[]) to authenticated;
grant execute on function public.reorder_subtasks(uuid, uuid[]) to authenticated;
grant execute on function public.reorder_pinned_notes(uuid[]) to authenticated;

notify pgrst, 'reload schema';
