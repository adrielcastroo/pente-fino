// Fio · Memória de Longo Prazo
//
// Persiste preferências/fatos do usuário na tabela `public.fio_memories`
// (uma linha por chave, escopo por user_id) e expõe tools de leitura/escrita
// para o AI SDK.
//
// Regras:
// - Toda operação é escopada por user_id (nunca cruzar usuários).
// - Chaves são normalizadas (snake_case, sem acento) para evitar duplicatas.
// - Memórias com `expires_at` no passado são ignoradas na leitura.

import type { createClient } from "npm:@supabase/supabase-js@2";
import { tool } from "npm:ai";
import { z } from "npm:zod@3";

type Admin = ReturnType<typeof createClient>;

export type MemoriaCategoria = "preferencia" | "fato" | "atalho" | "contexto";

const MAX_MEMORIES = 60;
const MAX_VALUE_LEN = 500;

/** Normaliza a chave: minúsculas, sem acentos, snake_case. */
export function normalizeKey(raw: string): string {
  return (raw ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
}

/** Lê todas as memórias válidas (não expiradas) do usuário. */
export async function listarMemorias(admin: Admin, userId: string | null) {
  if (!userId) return { found: false, hint: "Usuário não autenticado.", memorias: [] as any[] };
  const nowIso = new Date().toISOString();
  const { data, error } = await admin
    .from("fio_memories")
    .select("key,value,categoria,origem,confianca,updated_at,expires_at")
    .eq("user_id", userId)
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
    .order("updated_at", { ascending: false })
    .limit(MAX_MEMORIES);
  if (error) return { found: false, error: error.message, memorias: [] as any[] };
  return { found: (data ?? []).length > 0, total: (data ?? []).length, memorias: data ?? [] };
}

/** Cria ou atualiza uma memória do usuário. */
export async function salvarMemoria(
  admin: Admin,
  userId: string | null,
  args: { key: string; value: string; categoria?: MemoriaCategoria | null; expires_at?: string | null },
) {
  if (!userId) return { ok: false, error: "Usuário não autenticado." };
  const key = normalizeKey(args.key);
  const value = (args.value ?? "").toString().trim().slice(0, MAX_VALUE_LEN);
  if (!key) return { ok: false, error: "Chave inválida." };
  if (!value) return { ok: false, error: "Valor vazio." };

  const categoria: MemoriaCategoria =
    args.categoria && ["preferencia", "fato", "atalho", "contexto"].includes(args.categoria)
      ? args.categoria
      : "preferencia";

  const { error } = await admin.from("fio_memories").upsert(
    {
      user_id: userId,
      key,
      value,
      categoria,
      origem: "chat",
      expires_at: args.expires_at ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,key" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true, key, value, categoria };
}

/** Remove uma memória do usuário. */
export async function esquecerMemoria(admin: Admin, userId: string | null, args: { key: string }) {
  if (!userId) return { ok: false, error: "Usuário não autenticado." };
  const key = normalizeKey(args.key);
  if (!key) return { ok: false, error: "Chave inválida." };
  const { error } = await admin.from("fio_memories").delete().eq("user_id", userId).eq("key", key);
  if (error) return { ok: false, error: error.message };
  return { ok: true, key };
}

/** Bloco textual das memórias para injetar no system prompt. */
export function memoriesToPromptBlock(memorias: any[]): string {
  if (!memorias?.length) return "Memória de longo prazo: (vazia — ainda não há preferências salvas deste usuário).";
  const linhas = memorias
    .slice(0, MAX_MEMORIES)
    .map((m) => `- [${m.categoria}] ${m.key}: ${m.value}`)
    .join("\n");
  return `Memória de longo prazo do usuário (use-a naturalmente, sem repetir tudo):\n${linhas}`;
}

/** Tools de memória para o AI SDK. */
export function buildMemoryTools(admin: Admin, userId: string | null) {
  return {
    lembrar_preferencia: tool({
      description:
        "Salva de forma permanente uma preferência ou fato do usuário (ex.: depósito favorito, formato de relatório, apelidos de itens). Use quando o usuário disser 'lembre-se', 'meu padrão é', 'sempre use'.",
      inputSchema: z.object({
        key: z.string().describe("Identificador curto da preferência (ex.: 'deposito_favorito')"),
        value: z.string().describe("Valor a lembrar (ex.: 'Central Provisório')"),
        categoria: z.enum(["preferencia", "fato", "atalho", "contexto"]).nullable(),
        expires_at: z.string().nullable().describe("Data ISO de expiração, se for temporária"),
      }),
      execute: (args) => salvarMemoria(admin, userId, args as any),
    }),
    consultar_memoria: tool({
      description: "Lista todas as preferências e fatos lembrados sobre o usuário atual.",
      inputSchema: z.object({}),
      execute: () => listarMemorias(admin, userId),
    }),
    esquecer_preferencia: tool({
      description: "Apaga uma preferência salva do usuário. Use quando pedirem 'esqueça' ou 'não lembre mais'.",
      inputSchema: z.object({ key: z.string() }),
      execute: (args) => esquecerMemoria(admin, userId, args as any),
    }),
  };
}
