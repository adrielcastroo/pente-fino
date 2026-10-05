create table if not exists public.fio_conversations (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create table if not exists public.fio_messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid references public.fio_conversations(id) on delete cascade not null,
    role text not null check (role in ('user', 'assistant', 'system')),
    content jsonb not null,
    created_at timestamptz default now() not null
);

grant select, insert, update, delete on public.fio_conversations to authenticated;
grant select, insert, update, delete on public.fio_messages to authenticated;
grant all on public.fio_conversations to service_role;
grant all on public.fio_messages to service_role;

alter table public.fio_conversations enable row level security;
alter table public.fio_messages enable row level security;

create policy "Users can view their own conversations"
on public.fio_conversations for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own conversations"
on public.fio_conversations for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own conversations"
on public.fio_conversations for update
to authenticated
using (auth.uid() = user_id);

create policy "Users can view messages in their conversations"
on public.fio_messages for select
to authenticated
using (exists (
    select 1 from public.fio_conversations
    where id = conversation_id and user_id = auth.uid()
));

create policy "Users can insert messages in their conversations"
on public.fio_messages for insert
to authenticated
with check (exists (
    select 1 from public.fio_conversations
    where id = conversation_id and user_id = auth.uid()
));
