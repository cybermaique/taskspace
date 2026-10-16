-- Histórico de descrição passa a valer para todos os usuários, sem e-mail fixo.
-- Antes: o trigger e a política só atendiam uma conta específica.

drop trigger if exists tasks_master_description_history on public.tasks;
drop function if exists public.record_master_task_description_history();

create or replace function public.record_task_description_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.description is distinct from old.description then
    insert into public.task_description_history (task_id, description)
    values (old.id, old.description);
  end if;

  return new;
end;
$$;

drop trigger if exists tasks_description_history on public.tasks;
create trigger tasks_description_history
after update of description on public.tasks
for each row
execute function public.record_task_description_history();

drop policy if exists "master_accesses_task_description_history" on public.task_description_history;
drop policy if exists "task_description_history_owner_read" on public.task_description_history;
create policy "task_description_history_owner_read" on public.task_description_history
for select to authenticated
using (
  exists (
    select 1 from public.tasks
    where tasks.id = task_description_history.task_id
      and tasks.user_id = auth.uid()
  )
);

notify pgrst, 'reload schema';
