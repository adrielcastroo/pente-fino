// Fio · Widgets interativos de Transferência
//
// Fluxo determinístico (sem depender do LLM para montar JSON):
//   1. Usuário pede "transferir ..." -> devolvemos um [[WIDGET]] form pré-preenchido.
//   2. Submit do form (intent `transferencia_criar`) -> cria o rascunho no Auge
//      via `auge-sync` e devolve um [[WIDGET]] confirm para efetivar.
//   3. Submit do confirm (intent `transferencia_efetivar`) -> efetiva no Auge.
//
// Toda chamada ao Auge usa o Authorization do próprio usuário, para que o
// `auge-sync` resolva as credenciais pessoais (auge_user_credentials).

import type { createClient } from "npm:@supabase/supabase-js@2";

type Admin = ReturnType<typeof createClient>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const TRANSFER_RE =
  /\b(transferir|transfer[eê]ncia|mover\s+(?:estoque|lote|itens?)|movimentar\s+para\s+o?\s*dep[óo]sito)\b/i;

/** Detecta se a mensagem pede a criação de uma transferência. */
export function isTransferIntent(text: string): boolean {
  return TRANSFER_RE.test(text ?? "");
}

function widgetBlock(spec: unknown) {
  return `[[WIDGET]]${JSON.stringify(spec)}[[/WIDGET]]`;
}

function nf(v: number) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}

/** Extrai pistas simples do texto: código do item, quantidade e depósitos. */
export function parsePrefill(text: string) {
  const t = text ?? "";
  const codigo = t.match(/\b[A-Z]{2}[.\s-]?\d{3}[.\s-]?\d{3}\b/i)?.[0]?.toUpperCase().replace(/[\s-]/g, ".") ?? "";
  const qtdRaw = t.match(/(\d+(?:[.,]\d+)?)\s*(?:m|metros?|mts?|pc|pe[çc]as?|un)?\b/i)?.[1] ?? "";
  const qtd = qtdRaw ? qtdRaw.replace(",", ".") : "";
  const destino = t.match(/\bpara\s+(?:o\s+)?dep[óo]sito\s+(\d{1,3})\b/i)?.[1] ?? "";
  const origem = t.match(/\b(?:do|de|da)\s+dep[óo]sito\s+(\d{1,3})\b/i)?.[1] ?? "";
  return { codigo, qtd, origem, destino };
}

async function depositoOptions(admin: Admin) {
  const { data } = await admin.from("auge_depositos").select("codigo,nome").order("codigo");
  return (data ?? []).map((d: any) => ({
    value: String(d.codigo),
    label: `${d.codigo} — ${d.nome ?? "sem nome"}`,
  }));
}

/** Monta o widget de formulário de transferência (com depósitos reais). */
export async function buildTransferFormMessage(admin: Admin, userText: string) {
  const options = await depositoOptions(admin);
  const pre = parsePrefill(userText);

  const spec = {
    type: "form",
    id: `transf_${crypto.randomUUID().slice(0, 8)}`,
    title: "Nova transferência (Auge)",
    description: "Confira os dados abaixo. Ao enviar, crio o rascunho no Auge e pergunto se deve efetivar.",
    submitLabel: "Criar rascunho",
    onSubmitIntent: "transferencia_criar",
    fields: [
      { name: "cdItem", label: "Código do item", type: "text", required: true, placeholder: "TC.000.033", default: pre.codigo },
      {
        name: "cdDepositoOrigem",
        label: "Depósito de origem",
        type: "select",
        required: true,
        options,
        default: pre.origem || undefined,
      },
      {
        name: "cdDepositoDestino",
        label: "Depósito de destino",
        type: "select",
        required: true,
        options,
        default: pre.destino || undefined,
      },
      { name: "qtd", label: "Quantidade", type: "number", required: true, step: 0.01, min: 0, default: pre.qtd },
      { name: "nrLote", label: "Lote / série (opcional)", type: "text", placeholder: "deixe vazio para FIFO" },
      { name: "observacao", label: "Observação", type: "textarea", placeholder: "Motivo da transferência" },
    ],
  };

  return `Vamos montar a transferência. Preencha o formulário:\n\n${widgetBlock(spec)}`;
}

async function callAugeSync(action: string, body: unknown, authHeader: string) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/auge-sync?action=${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON_KEY,
      Authorization: authHeader || `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let data: any = {};
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  if (!res.ok || data?.ok === false) {
    throw new Error(data?.error || data?.raw || `Falha no Auge (${res.status})`);
  }
  return data;
}

/** Executa o submit do formulário: cria o rascunho e devolve widget de confirmação. */
export async function handleTransferCreate(values: Record<string, any>, authHeader: string): Promise<string> {
  const cdItem = String(values?.cdItem ?? "").trim().toUpperCase();
  const cdDepositoOrigem = String(values?.cdDepositoOrigem ?? "").trim();
  const cdDepositoDestino = String(values?.cdDepositoDestino ?? "").trim();
  const qtd = Number(String(values?.qtd ?? "").replace(",", "."));
  const nrLote = String(values?.nrLote ?? "").trim();
  const observacao = String(values?.observacao ?? "").trim();

  const faltando: string[] = [];
  if (!cdItem) faltando.push("código do item");
  if (!cdDepositoOrigem) faltando.push("depósito de origem");
  if (!cdDepositoDestino) faltando.push("depósito de destino");
  if (!Number.isFinite(qtd) || qtd <= 0) faltando.push("quantidade válida");
  if (faltando.length) return `⚠️ Não consegui criar: falta ${faltando.join(", ")}.`;
  if (cdDepositoOrigem === cdDepositoDestino) return "⚠️ Origem e destino não podem ser o mesmo depósito.";

  const item: Record<string, unknown> = { cdItem, cdDepositoOrigem, cdDepositoDestino, qtd };
  if (nrLote) item.nrLote = nrLote;

  try {
    const data = await callAugeSync("transferencia_criar", { itens: [item], observacao, efetivar: false }, authHeader);
    const cd = data?.cdMovimentacao;

    const confirm = {
      type: "confirm",
      id: `transf_conf_${cd}`,
      title: `Efetivar transferência ${cd}?`,
      description: "O rascunho já existe no Auge. Efetivar aplica a movimentação no estoque.",
      summary: `${cdItem} · ${nf(qtd)} · depósito ${cdDepositoOrigem} → ${cdDepositoDestino}${nrLote ? ` · lote ${nrLote}` : ""}`,
      confirmLabel: "Efetivar agora",
      cancelLabel: "Manter como rascunho",
      onSubmitIntent: "transferencia_efetivar",
    };

    return [
      `✅ Rascunho **${cd}** criado no Auge.`,
      "",
      `| Campo | Valor |`,
      `| --- | --- |`,
      `| Item | ${cdItem} |`,
      `| Quantidade | ${nf(qtd)} |`,
      `| Origem → Destino | ${cdDepositoOrigem} → ${cdDepositoDestino} |`,
      nrLote ? `| Lote | ${nrLote} |` : `| Lote | FIFO |`,
      "",
      widgetBlock({ ...confirm, values: { cdMovimentacao: cd } }),
    ].join("\n");
  } catch (err) {
    return `❌ Não consegui criar a transferência no Auge: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/** Executa a efetivação do rascunho. */
export async function handleTransferEfetivar(values: Record<string, any>, authHeader: string): Promise<string> {
  const cd = String(values?.cdMovimentacao ?? values?.cd ?? "").trim();
  const confirmado = values?.confirmed !== false && values?.value !== "cancel";
  if (!cd) return "⚠️ Não identifiquei o número do rascunho para efetivar.";
  if (!confirmado) return `Ok, mantive **${cd}** como rascunho no Auge.`;

  try {
    await callAugeSync("transferencia_efetivar", { cdMovimentacao: cd }, authHeader);
    return `✅ Transferência **${cd}** efetivada no Auge.`;
  } catch (err) {
    return `❌ Falha ao efetivar **${cd}**: ${err instanceof Error ? err.message : String(err)}`;
  }
}

/** Roteia um submit de widget de transferência. Retorna null se não for do domínio. */
export async function routeTransferSubmit(
  payload: { intent?: string; values?: Record<string, any> } | null,
  authHeader: string,
): Promise<string | null> {
  if (!payload?.intent) return null;
  if (payload.intent === "transferencia_criar") return handleTransferCreate(payload.values ?? {}, authHeader);
  if (payload.intent === "transferencia_efetivar") return handleTransferEfetivar(payload.values ?? {}, authHeader);
  return null;
}
