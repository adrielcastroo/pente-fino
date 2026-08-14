create table public.expedicao_pecas_auge_sync (
    id uuid primary key default gen_random_uuid(),
    auge_peca_id text not null,
    auge_evento_id text,
    codigo_peca text,
    codigo_etiqueta text not null,
    auge_pedido_id text,
    auge_pedido_codigo text not null,
    auge_cliente_id text,
    auge_cliente_codigo text,
    auge_cliente_nome text,
    auge_item_id text,
    auge_item_codigo text,
    descricao_item text,
    quantidade numeric,
    status_auge text not null,
    status_local text not null default 'PRONTO_RECEBIDO_AUGE',
    operador_producao_id text,
    operador_producao_nome text,
    data_pronto_auge timestamptz,
    recebido_em timestamptz not null default now(),
    processado_em timestamptz,
    ultima_tentativa_em timestamptz,
    quantidade_tentativas integer not null default 0,
    picking_id uuid references public.expedicao_pickings(id),
    codigo_picking text,
    conferido_por uuid references auth.users(id),
    conferido_em timestamptz,
    alocacao_id uuid,
    transportadora_id text,
    carrinho_id uuid references public.expedicao_carrinhos(id),
    romaneio_id uuid,
    payload_original jsonb not null default '{}'::jsonb,
    erro_sincronizacao text,
    erro_operacional text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint expedicao_pecas_auge_sync_peca_unique
        unique (auge_peca_id)
);

grant select on public.expedicao_pecas_auge_sync to authenticated;
grant all on public.expedicao_pecas_auge_sync to service_role;

alter table public.expedicao_pecas_auge_sync enable row level security;

create policy "Authenticated users can select pecas sync"
on public.expedicao_pecas_auge_sync
for select
to authenticated
using (true);

create index idx_expedicao_pecas_auge_sync_etiqueta on public.expedicao_pecas_auge_sync(codigo_etiqueta);
create index idx_expedicao_pecas_auge_sync_pedido on public.expedicao_pecas_auge_sync(auge_pedido_codigo);
create index idx_expedicao_pecas_auge_sync_status on public.expedicao_pecas_auge_sync(status_local);