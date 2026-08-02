// Fio · Widgets interativos de Transferência
//
// Fluxo determinístico (sem depender do LLM para montar JSON):
//   1. Usuário pede "transferir ..." -> devolvemos um [[WIDGET]] itemlist (multi-item)
//      pré-preenchido, com escolha de lote FIFO ou manual por item.
//   2. Se algum item pedir lote manual sem informar o lote -> devolvemos um
//      [[WIDGET]] lotpick com os lotes/séries reais do depósito de origem.
//   3. Com todos os lotes resolvidos -> criamos o rascunho no Auge via `auge-sync`
//      e devolvemos um [[WIDGET]] confirm para efetivar.
//
// Toda chamada ao Auge usa o Authorization do próprio usuário, para que o
// `auge-sync` resolva as credenciais pessoais (auge_user_credentials).

import type { createClient } from "npm:@supabase/supabase-js@2";

type Admin = ReturnType<typeof createClient>;

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const TRANSFER_RE =
  /\b(transferir|transfer[eê]ncia|mover\s+(?:estoque|lote|itens?)|movimentar\s+para\s+o?\s*dep[óo]sito)\b/i;

/** Item normalizado de transferência. */
export type TransferItem = {
  cdItem: string;
  cdDepositoOrigem: string;
  cdDepositoDestino: string;
  qtd: number;
  nrLote?: string;
  loteModo?: "fifo" | "manual";
};

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

function num(v: unknown): number {
  return Number(String(v ?? "").replace(",", "."));
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

/** Monta o widget multi-item de transferência (com depósitos reais). */
export async function buildTransferFormMessage(admin: Admin, userText: string) {
  const options = await depositoOptions(admin);
  const pre = parsePrefill(userText);

  const spec = {
    type: "itemlist",
    id: `transf_${crypto.randomUUID().slice(0, 8)}`,
    title: "Nova transferência (Auge)",
    description:
      "Adicione quantos itens/lotes precisar. Ao enviar, crio o rascunho no Auge e pergunto se deve efetivar.",
    submitLabel: "Criar rascunho",
    addLabel: "Adicionar item",
    onSubmitIntent: "transferencia_criar",
    minRows: 1,
    maxRows: 20,
    rows: [
      {
        cdItem: pre.codigo,
        cdDepositoOrigem: pre.origem || "",
        cdDepositoDestino: pre.destino || "",
        qtd: pre.qtd,
        loteModo: "fifo",
        nrLote: "",
      },
    ],
    itemFields: [
      { name: "cdItem", label: "Código do item", type: "text", required: true, placeholder: "TC.000.033" },
      { name: "qtd", label: "Quantidade", type: "number", required: true, step: 0.01, min: 0 },
      { name: "cdDepositoOrigem", label: "Origem", type: "select", required: true, options },
      { name: "cdDepositoDestino", label: "Destino", type: "select", required: true, options },
      {
        name: "loteModo",
        label: "Lote / série",
        type: "select",
        default: "fifo",
        options: [
          { value: "fifo", label: "FIFO (automático)" },
          { value: "manual", label: "Escolher lote" },
        ],
      },
      { name: "nrLote", label: "Lote informado (opcional)", type: "text", placeholder: "deixe vazio para escolher" },
    ],
    sharedFields: [
      { name: "observacao", label: "Observação", type: "textarea", placeholder: "Motivo da transferência" },
    ],
  };

  return `Vamos montar a transferência. Preencha os itens:\n\n${widgetBlock(spec)}`;
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

/** Normaliza os itens vindos do widget (aceita formato antigo de item único). */
export function normalizeItens(values: Record<string, any>): TransferItem[] {
  const raw: any[] = Array.isArray(values?.itens) && values.itens.length ? values.itens : [values];
  return raw.map((r) => ({
    cdItem: String(r?.cdItem ?? "").trim().toUpperCase(),
    cdDepositoOrigem: String(r?.cdDepositoOrigem ?? "").trim(),
    cdDepositoDestino: String(r?.cdDepositoDestino ?? "").trim(),
    qtd: num(r?.qtd),
    nrLote: String(r?.nrLote ?? "").trim() || undefined,
    loteModo: r?.loteModo === "manual" ? "manual" : "fifo",
  }));
}

function validar(itens: TransferItem[]): string | null {
  if (!itens.length) return "⚠️ Nenhum item informado.";
  for (const [i, it] of itens.entries()) {
    const faltando: string[] = [];
    if (!it.cdItem) faltando.push("código do item");
    if (!it.cdDepositoOrigem) faltando.push("depósito de origem");
    if (!it.cdDepositoDestino) faltando.push("depósito de destino");
    if (!Number.isFinite(it.qtd) || it.qtd <= 0) faltando.push("quantidade válida");
    if (faltando.length) return `⚠️ Item ${i + 1}: falta ${faltando.join(", ")}.`;
    if (it.cdDepositoOrigem === it.cdDepositoDestino) {
      return `⚠️ Item ${i + 1}: origem e destino não podem ser o mesmo depósito.`;
    }
  }
  return null;
}

/** Busca lotes e séries reais do item no depósito de origem. */
async function buscarLotes(item: TransferItem, authHeader: string) {
  const payload = { cdItem: item.cdItem, cdDeposito: item.cdDepositoOrigem };
  const out: Array<{ lote: string; quantidade: number; selecionado?: number }> = [];
  for (const action of ["lotes_live", "series_live"]) {
    try {
      const data = await callAugeSync(action, payload, authHeader);
      for (const r of data?.data ?? []) {
        if (r?.lote) out.push({ lote: r.lote, quantidade: Number(r.quantidade ?? 0), selecionado: Number(r.selecionado ?? 0) });
      }
    } catch (err) {
      console.warn(`[transfer-widget] ${action} falhou`, err);
    }
  }
  return out;
}

/** Monta o widget de escolha de lote (FIFO x manual) para um item pendente. */
async function buildLotPick(itens: TransferItem[], index: number, observacao: string, authHeader: string) {
  const item = itens[index];
  const lotes = await buscarLotes(item, authHeader);

  const spec = {
    type: "lotpick",
    id: `lote_${crypto.randomUUID().slice(0, 8)}`,
    title: `Lote para ${item.cdItem}`,
    description: `Depósito ${item.cdDepositoOrigem} → ${item.cdDepositoDestino} · ${nf(item.qtd)}. Escolha FIFO ou selecione os lotes manualmente.`,
    cdItem: item.cdItem,
    cdDeposito: item.cdDepositoOrigem,
    qtd: item.qtd,
    allowMultiple: true,
    defaultMode: lotes.length ? "manual" : "fifo",
    submitLabel: "Confirmar lotes",
    onSubmitIntent: "transferencia_lote_selecionar",
    lotes,
    values: { pending: { itens, observacao }, index },
  };

  return `Preciso saber quais lotes usar no item ${index + 1}.\n\n${widgetBlock(spec)}`;
}

/** Executa o submit do formulário: resolve lotes e cria o rascunho. */
export async function handleTransferCreate(values: Record<string, any>, authHeader: string): Promise<string> {
  const itens = normalizeItens(values);
  const observacao = String(values?.observacao ?? "").trim();

  const erro = validar(itens);
  if (erro) return erro;

  // Algum item pede escolha manual e ainda não tem lote definido?
  const pendente = itens.findIndex((i) => i.loteModo === "manual" && !i.nrLote);
  if (pendente >= 0) return buildLotPick(itens, pendente, observacao, authHeader);

  return criarRascunho(itens, observacao, authHeader);
}

/** Submit do widget de lote: aplica a escolha e retoma o fluxo. */
export async function handleLoteSelecionar(values: Record<string, any>, authHeader: string): Promise<string> {
  const pending = values?.pending ?? {};
  const itens: TransferItem[] = normalizeItens({ itens: pending?.itens ?? [] });
  const observacao = String(pending?.observacao ?? "").trim();
  const index = Number(values?.index ?? 0);
  if (!itens[index]) return "⚠️ Perdi o contexto da transferência. Peça novamente, por favor.";

  const modo = values?.modo === "manual" ? "manual" : "fifo";
  const escolhidos: Array<{ lote: string; qtd: number }> = Array.isArray(values?.lotes)
    ? values.lotes.map((l: any) => ({ lote: String(l?.lote ?? "").trim(), qtd: num(l?.qtd) }))
        .filter((l: any) => l.lote && Number.isFinite(l.qtd) && l.qtd > 0)
    : [];

  const base = itens[index];
  if (modo === "fifo" || !escolhidos.length) {
    // FIFO: o Auge consome os lotes mais antigos automaticamente.
    itens[index] = { ...base, loteModo: "fifo", nrLote: undefined };
  } else {
    // Manual: uma linha por lote escolhido, preservando a ordem informada.
    const linhas: TransferItem[] = escolhidos.map((l) => ({
      ...base,
      qtd: l.qtd,
      nrLote: l.lote,
      loteModo: "manual",
    }));
    itens.splice(index, 1, ...linhas);
  }

  const erro = validar(itens);
  if (erro) return erro;

  const proximo = itens.findIndex((i) => i.loteModo === "manual" && !i.nrLote);
  if (proximo >= 0) return buildLotPick(itens, proximo, observacao, authHeader);

  return criarRascunho(itens, observacao, authHeader);
}

async function criarRascunho(itens: TransferItem[], observacao: string, authHeader: string): Promise<string> {
  const payloadItens = itens.map((it) => {
    const item: Record<string, unknown> = {
      cdItem: it.cdItem,
      cdDepositoOrigem: it.cdDepositoOrigem,
      cdDepositoDestino: it.cdDepositoDestino,
      qtd: it.qtd,
    };
    if (it.nrLote) item.nrLote = it.nrLote;
    return item;
  });

  try {
    const data = await callAugeSync("transferencia_criar", { itens: payloadItens, observacao, efetivar: false }, authHeader);
    const cd = data?.cdMovimentacao;
    const totalQtd = itens.reduce((s, i) => s + i.qtd, 0);

    const confirm = {
      type: "confirm",
      id: `transf_conf_${cd}`,
      title: `Efetivar transferência ${cd}?`,
      description: "O rascunho já existe no Auge. Efetivar aplica a movimentação no estoque.",
      summary: `${itens.length} item(ns) · total ${nf(totalQtd)}`,
      confirmLabel: "Efetivar agora",
      cancelLabel: "Manter como rascunho",
      onSubmitIntent: "transferencia_efetivar",
      values: { cdMovimentacao: cd },
    };

    const linhas = itens.map(
      (it) =>
        `| ${it.cdItem} | ${nf(it.qtd)} | ${it.cdDepositoOrigem} → ${it.cdDepositoDestino} | ${it.nrLote ?? "FIFO"} |`,
    );

    return [
      `✅ Rascunho **${cd}** criado no Auge.`,
      "",
      `| Item | Quantidade | Origem → Destino | Lote |`,
      `| --- | ---: | --- | --- |`,
      ...linhas,
      "",
      widgetBlock(confirm),
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
  if (payload.intent === "transferencia_lote_selecionar") return handleLoteSelecionar(payload.values ?? {}, authHeader);
  if (payload.intent === "transferencia_efetivar") return handleTransferEfetivar(payload.values ?? {}, authHeader);
  return null;
}
