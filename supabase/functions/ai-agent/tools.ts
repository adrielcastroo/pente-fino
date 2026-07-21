// Fio · Fase 2 — Ferramentas determinísticas (SQL-backed)
//
// Este módulo expõe funções puras que consultam o banco (Pente Fino/Auge) via
// service_role e devolvem estruturas prontas para consumo tanto por:
//   (a) tool-calling do AI SDK (streamText({ tools: buildTools(admin) }))
//   (b) atalhos determinísticos no roteador do index.ts (bypass do LLM)
//
// Regras:
// - NUNCA inventar dados. Se a consulta vier vazia, devolver `{ found: false, ... }`
//   com dica do que faltou.
// - Sempre devolver campos em snake_case, quantidades numéricas puras (o
//   formato BR é aplicado no consumidor / prompt).
// - Nenhuma função escreve — todas são read-only. Escritas ficam para a Fase 4
//   (com fluxo de confirmação).

import type { createClient } from "npm:@supabase/supabase-js@2";
import { tool } from "npm:ai";
import { z } from "npm:zod@3";

type Admin = ReturnType<typeof createClient>;

// ---------- Helpers ----------

/** Escapa vírgulas/parênteses que quebrariam um filtro PostgREST `or=` */
function safeIlike(v: string) {
  return v.replace(/[\%,()]/g, " ").trim();
}

/** Normaliza um código-Auge (remove espaços e uppercase). */
function normCode(v: string) {
  return v.trim().toUpperCase();
}

/** Variantes plausíveis de um código (com/sem pontos, zeros à esquerda). */
export function codeVariants(code: string): string[] {
  const c = normCode(code);
  if (!c) return [];
  const out = new Set<string>([c]);
  // sem pontos
  out.add(c.replace(/\./g, ""));
  // com zeros à esquerda em cada segmento numérico (3 dígitos)
  if (/^[A-Z]{1,3}\.\d/.test(c)) {
    const parts = c.split(".");
    out.add(parts.map((p, i) => (i === 0 ? p : p.padStart(3, "0"))).join("."));
  }
  return Array.from(out);
}

// ---------- Tool: buscar_item ----------
//
// Busca até N itens de `itens_cadastro` por código interno, código de
// fornecedor ou descrição. Devolve descrição, unidade e pacotes.
export async function buscarItem(
  admin: Admin,
  args: { query: string; limit?: number },
) {
  const q = safeIlike(args.query);
  const limit = Math.min(Math.max(args.limit ?? 20, 1), 100);
  if (!q) return { found: false, hint: "Informe código ou descrição para buscar.", items: [] };

  const or = [
    `descricao.ilike.%${q}%`,
    `codigo_interno.ilike.%${q}%`,
    `codigo_fornecedor.ilike.%${q}%`,
  ].join(",");

  const { data, error } = await admin
    .from("itens_cadastro")
    .select("codigo_interno,descricao,unidade,codigo_fornecedor,pacote_fornecedor,pacote_estocagem")
    .or(or)
    .limit(limit);

  if (error) return { found: false, error: error.message, items: [] };
  return {
    found: (data ?? []).length > 0,
    total: (data ?? []).length,
    items: data ?? [],
  };
}

// ---------- Tool: saldo_por_deposito ----------
//
// Agrupa saldo (m_linear) por depósito para um código de item.
export async function saldoPorDeposito(admin: Admin, args: { codigo: string }) {
  const codigos = codeVariants(args.codigo);
  if (codigos.length === 0) return { found: false, hint: "Informe o código do item." };

  const [byAuge, byItem] = await Promise.all([
    admin
      .from("estoque_posicoes")
      .select("auge_cd_item,item,deposito_atual,m_linear_atual,m_linear,m2_atual,m2,status")
      .in("auge_cd_item", codigos)
      .limit(1000),
    admin
      .from("estoque_posicoes")
      .select("auge_cd_item,item,deposito_atual,m_linear_atual,m_linear,m2_atual,m2,status")
      .in("item", codigos)
      .limit(1000),
  ]);
  const rows = [...(byAuge.data ?? []), ...(byItem.data ?? [])];
  if (rows.length === 0) return { found: false, codigo: args.codigo, depositos: [] };

  const byDep = new Map<string, { deposito: string; m_linear: number; m2: number; lotes: number }>();
  for (const r of rows) {
    const dep = String(r.deposito_atual ?? "-");
    if (r.status === "saida") continue;
    const acc = byDep.get(dep) ?? { deposito: dep, m_linear: 0, m2: 0, lotes: 0 };
    acc.m_linear += Number(r.m_linear_atual ?? r.m_linear ?? 0);
    acc.m2 += Number(r.m2_atual ?? r.m2 ?? 0);
    acc.lotes += 1;
    byDep.set(dep, acc);
  }
  return {
    found: true,
    codigo: args.codigo,
    total_lotes: rows.filter((r) => r.status !== "saida").length,
    depositos: Array.from(byDep.values()).sort((a, b) => b.m_linear - a.m_linear),
  };
}

// ---------- Tool: listar_transferencias ----------
//
// Filtros: código do item, depósito de origem/destino, período (ISO date).
export async function listarTransferencias(admin: Admin, args: {
  codigo?: string;
  deposito_origem?: string;
  deposito_destino?: string;
  from?: string;
  to?: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(args.limit ?? 20, 1), 200);
  let q = admin
    .from("auge_transferencias")
    .select(
      "documento,nr_efetivacao,data_movimento,codigo_produto,descricao_produto,quantidade,deposito_origem,deposito_destino,observacao,usuario_criacao,usuario_efetivacao,ds_efetivacao",
    )
    .order("data_movimento", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (args.codigo) q = q.eq("codigo_produto", normCode(args.codigo));
  if (args.deposito_origem) q = q.eq("deposito_origem", args.deposito_origem);
  if (args.deposito_destino) q = q.eq("deposito_destino", args.deposito_destino);
  if (args.from) q = q.gte("data_movimento", args.from);
  if (args.to) q = q.lte("data_movimento", args.to);

  const { data, error } = await q;
  if (error) return { found: false, error: error.message, rows: [] };
  return { found: (data ?? []).length > 0, total: (data ?? []).length, rows: data ?? [] };
}

// ---------- Tool: acabamentos_do_item ----------
//
// Devolve todos os acabamentos vinculados a um item (com chave, nome, classe,
// descrição do item dentro do acabamento e status).
export async function acabamentosDoItem(admin: Admin, args: { codigo: string }) {
  const codigos = codeVariants(args.codigo);
  if (codigos.length === 0) return { found: false, hint: "Informe o código do item." };

  const { data, error } = await admin
    .from("auge_acabamento_itens")
    .select(
      "cd_acabamento,cd_item_acabamento,ds_item_acabamento,ds_item_acabamento_reduzida,ds_item_acabamento_original,auge_acabamentos(cd_acabamento,chave_acabamento,nm_acabamento,nm_classe1,nm_combinacao1,id_cancelado)",
    )
    .in("cd_item_acabamento", codigos)
    .limit(200);

  if (error) return { found: false, error: error.message, rows: [] };
  const rows = (data ?? []).map((r: any) => ({
    codigo_auge: r.auge_acabamentos?.chave_acabamento ?? r.cd_acabamento,
    cd_acabamento: r.cd_acabamento,
    nm_acabamento: r.auge_acabamentos?.nm_acabamento ?? null,
    classe: r.auge_acabamentos?.nm_classe1 ?? null,
    combinacao: r.auge_acabamentos?.nm_combinacao1 ?? null,
    cancelado: r.auge_acabamentos?.id_cancelado === "S",
    descricao_item_no_acabamento:
      r.ds_item_acabamento ?? r.ds_item_acabamento_reduzida ?? r.ds_item_acabamento_original ?? null,
  }));
  return { found: rows.length > 0, codigo: args.codigo, total: rows.length, rows };
}

// ---------- Tool: item_no_acabamento ----------
//
// Devolve a linha específica (descrição, kits) do item DENTRO de um
// acabamento identificado por `chave_acabamento` (ex.: "198").
export async function itemNoAcabamento(admin: Admin, args: {
  codigo_item: string;
  chave_acabamento: string;
}) {
  const codigos = codeVariants(args.codigo_item);
  if (codigos.length === 0 || !args.chave_acabamento) {
    return { found: false, hint: "Informe código do item e chave do acabamento." };
  }

  const { data: acab, error: errAcab } = await admin
    .from("auge_acabamentos")
    .select("cd_acabamento,chave_acabamento,nm_acabamento,nm_classe1,nm_combinacao1,id_cancelado")
    .eq("chave_acabamento", args.chave_acabamento.trim())
    .maybeSingle();
  if (errAcab) return { found: false, error: errAcab.message };
  if (!acab) return { found: false, hint: `Acabamento ${args.chave_acabamento} não encontrado.` };

  const { data: row, error } = await admin
    .from("auge_acabamento_itens")
    .select(
      "cd_acabamento_item,cd_item_acabamento,ds_item_acabamento,ds_item_acabamento_reduzida,ds_item_acabamento_original,nm_kit_complementar_1,nm_kit_complementar_2,nm_kit_complementar_3,nm_kit_complementar_4,nm_kit_complementar_5",
    )
    .eq("cd_acabamento", (acab as any).cd_acabamento)
    .in("cd_item_acabamento", codigos)
    .maybeSingle();

  if (error) return { found: false, error: error.message };
  if (!row) return { found: false, hint: `Item ${args.codigo_item} não vinculado ao acabamento ${args.chave_acabamento}.` };

  return {
    found: true,
    acabamento: acab,
    item: {
      codigo: (row as any).cd_item_acabamento,
      descricao:
        (row as any).ds_item_acabamento ??
        (row as any).ds_item_acabamento_reduzida ??
        (row as any).ds_item_acabamento_original ??
        null,
      kits: [1, 2, 3, 4, 5]
        .map((n) => (row as any)[`nm_kit_complementar_${n}`])
        .filter(Boolean),
    },
  };
}

// ---------- Tool: movimentacoes_recentes ----------
//
// Kardex simplificado: últimas movimentações filtráveis por código/depósito/período.
export async function movimentacoesRecentes(admin: Admin, args: {
  codigo?: string;
  deposito?: string;
  from?: string;
  to?: string;
  limit?: number;
}) {
  const limit = Math.min(Math.max(args.limit ?? 20, 1), 200);
  let q = admin
    .from("auge_movimentacoes")
    .select("data_movimento,tipo,codigo_produto,quantidade,deposito,documento,observacao,situacao,ds_situacao")
    .order("data_movimento", { ascending: false, nullsFirst: false })
    .limit(limit);
  if (args.codigo) q = q.eq("codigo_produto", normCode(args.codigo));
  if (args.deposito) q = q.eq("deposito", args.deposito);
  if (args.from) q = q.gte("data_movimento", args.from);
  if (args.to) q = q.lte("data_movimento", args.to);

  const { data, error } = await q;
  if (error) return { found: false, error: error.message, rows: [] };
  return { found: (data ?? []).length > 0, total: (data ?? []).length, rows: data ?? [] };
}

// ---------- Tool: buscar_acabamento ----------
//
// Busca por nome, classe, combinação ou chave (ex.: "198", "screen fashion").
export async function buscarAcabamento(admin: Admin, args: { query: string; limit?: number }) {
  const q = safeIlike(args.query);
  const limit = Math.min(Math.max(args.limit ?? 30, 1), 100);
  if (!q) return { found: false, hint: "Informe nome, chave ou classe do acabamento.", rows: [] };
  const or = [
    `nm_acabamento.ilike.%${q}%`,
    `nm_classe1.ilike.%${q}%`,
    `nm_combinacao1.ilike.%${q}%`,
    `chave_acabamento.ilike.%${q}%`,
  ].join(",");
  const { data, error } = await admin
    .from("auge_acabamentos")
    .select("cd_acabamento,chave_acabamento,nm_acabamento,nm_classe1,nm_combinacao1,id_cancelado")
    .or(or)
    .order("chave_acabamento", { ascending: true })
    .limit(limit);
  if (error) return { found: false, error: error.message, rows: [] };
  return {
    found: (data ?? []).length > 0,
    total: (data ?? []).length,
    rows: (data ?? []).map((a: any) => ({
      codigo_auge: a.chave_acabamento ?? a.cd_acabamento,
      nm_acabamento: a.nm_acabamento,
      classe: a.nm_classe1,
      combinacao: a.nm_combinacao1,
      cancelado: a.id_cancelado === "S",
    })),
  };
}

// ---------- Builder: expõe todas as tools no formato do AI SDK ----------
//
// Uso previsto (próximo turno) em index.ts:
//
//   import { buildTools } from "./tools.ts";
//   const result = streamText({
//     model,
//     system,
//     messages: modelMessages,
//     tools: buildTools(admin),
//     stopWhen: stepCountIs(6),
//   });
//
// Nenhuma tool escreve — segurança por design nesta fase.
export function buildTools(admin: Admin) {
  return {
    buscar_item: tool({
      description: "Busca itens do cadastro por código interno, código de fornecedor ou descrição. Use quando o usuário citar nome/parte da descrição ou código do item.",
      inputSchema: z.object({
        query: z.string().describe("Texto ou código a buscar (ex.: 'TC.000.033', 'screen fashion')"),
        limit: z.number().int().min(1).max(100).nullable(),
      }),
      execute: (args) => buscarItem(admin, args as any),
    }),
    saldo_por_deposito: tool({
      description: "Retorna o saldo (m_linear, m², nº de lotes) agrupado por depósito para um código de item específico.",
      inputSchema: z.object({
        codigo: z.string().describe("Código interno do item (ex.: 'TC.000.033')"),
      }),
      execute: (args) => saldoPorDeposito(admin, args as any),
    }),
    listar_transferencias: tool({
      description: "Lista transferências do Auge, filtráveis por código de item, depósitos e período.",
      inputSchema: z.object({
        codigo: z.string().nullable(),
        deposito_origem: z.string().nullable(),
        deposito_destino: z.string().nullable(),
        from: z.string().nullable().describe("Data inicial ISO (YYYY-MM-DD)"),
        to: z.string().nullable().describe("Data final ISO (YYYY-MM-DD)"),
        limit: z.number().int().min(1).max(200).nullable(),
      }),
      execute: (args) => listarTransferencias(admin, args as any),
    }),
    acabamentos_do_item: tool({
      description: "Lista todos os acabamentos vinculados a um item, com descrição do item DENTRO de cada acabamento e status.",
      inputSchema: z.object({
        codigo: z.string().describe("Código interno do item (ex.: 'TC.000.033')"),
      }),
      execute: (args) => acabamentosDoItem(admin, args as any),
    }),
    item_no_acabamento: tool({
      description: "Retorna a descrição e kits de um item dentro de um acabamento específico (identificado pela chave, ex.: '198').",
      inputSchema: z.object({
        codigo_item: z.string(),
        chave_acabamento: z.string(),
      }),
      execute: (args) => itemNoAcabamento(admin, args as any),
    }),
    movimentacoes_recentes: tool({
      description: "Kardex simplificado: últimas movimentações (entradas/saídas) filtráveis por código, depósito e período.",
      inputSchema: z.object({
        codigo: z.string().nullable(),
        deposito: z.string().nullable(),
        from: z.string().nullable(),
        to: z.string().nullable(),
        limit: z.number().int().min(1).max(200).nullable(),
      }),
      execute: (args) => movimentacoesRecentes(admin, args as any),
    }),
    buscar_acabamento: tool({
      description: "Busca acabamentos por nome, classe, combinação ou chave (ex.: '198', 'screen fashion').",
      inputSchema: z.object({
        query: z.string(),
        limit: z.number().int().min(1).max(100).nullable(),
      }),
      execute: (args) => buscarAcabamento(admin, args as any),
    }),
  };
}
