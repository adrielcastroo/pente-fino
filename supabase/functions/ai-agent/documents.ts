// Fio · Parser de documentos (PDF / XLS / XLSX / ODS / CSV / TXT)
//
// Converte anexos enviados no chat (data URLs base64 ou URLs http) em texto
// estruturado para injeção no contexto do modelo. Nenhum dado é persistido.

import { extractText, getDocumentProxy } from "npm:unpdf@0.12.1";
import * as XLSX from "npm:xlsx@0.18.5";

export type ParsedDocument = {
  name: string;
  mediaType: string;
  kind: "pdf" | "planilha" | "texto" | "desconhecido";
  pages?: number;
  sheets?: string[];
  text: string;
  truncated: boolean;
  error?: string;
};

export type IncomingAttachment = {
  name?: string;
  mediaType?: string;
  url?: string; // data:...;base64,xxx  ou https://...
  data?: string; // base64 puro
};

const MAX_CHARS_PER_DOC = 12_000;
const MAX_DOCS = 5;
const MAX_BYTES = 8 * 1024 * 1024; // 8MB

const PDF_RE = /pdf/i;
const SHEET_RE = /(sheet|excel|spreadsheet|csv|ods|xls)/i;
const TEXT_RE = /^(text\/|application\/json)/i;

function kindOf(mediaType: string, name: string): ParsedDocument["kind"] {
  const n = name.toLowerCase();
  if (PDF_RE.test(mediaType) || n.endsWith(".pdf")) return "pdf";
  if (SHEET_RE.test(mediaType) || /\.(xlsx?|ods|csv)$/.test(n)) return "planilha";
  if (TEXT_RE.test(mediaType) || /\.(txt|md|json|xml)$/.test(n)) return "texto";
  return "desconhecido";
}

function truncate(text: string): { text: string; truncated: boolean } {
  if (text.length <= MAX_CHARS_PER_DOC) return { text, truncated: false };
  return { text: text.slice(0, MAX_CHARS_PER_DOC) + "\n…[conteúdo truncado]", truncated: true };
}

function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.includes(",") ? b64.slice(b64.indexOf(",") + 1) : b64;
  const bin = atob(clean.replace(/\s/g, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function toBytes(att: IncomingAttachment): Promise<Uint8Array> {
  if (att.data) return base64ToBytes(att.data);
  const url = att.url ?? "";
  if (url.startsWith("data:")) return base64ToBytes(url);
  if (/^https?:\/\//.test(url)) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Falha ao baixar anexo (${res.status})`);
    return new Uint8Array(await res.arrayBuffer());
  }
  throw new Error("Anexo sem conteúdo legível.");
}

async function parsePdf(bytes: Uint8Array) {
  const doc = await getDocumentProxy(bytes);
  const { totalPages, text } = await extractText(doc, { mergePages: true });
  return { pages: totalPages, text: String(text ?? "").replace(/\n{3,}/g, "\n\n").trim() };
}

function parseSheet(bytes: Uint8Array) {
  const wb = XLSX.read(bytes, { type: "array" });
  const sheets: string[] = wb.SheetNames ?? [];
  const partes: string[] = [];
  for (const nome of sheets.slice(0, 5)) {
    const ws = wb.Sheets[nome];
    if (!ws) continue;
    const csv = XLSX.utils.sheet_to_csv(ws, { blankrows: false, FS: ";" });
    partes.push(`### Planilha: ${nome}\n${csv.trim()}`);
  }
  return { sheets, text: partes.join("\n\n").trim() };
}

/** Faz o parse de um anexo isolado, nunca lançando exceção. */
export async function parseAttachment(att: IncomingAttachment): Promise<ParsedDocument> {
  const name = att.name || "documento";
  const mediaType = att.mediaType || "";
  const kind = kindOf(mediaType, name);
  const base: ParsedDocument = { name, mediaType, kind, text: "", truncated: false };

  try {
    const bytes = await toBytes(att);
    if (bytes.byteLength > MAX_BYTES) {
      return { ...base, error: "Arquivo maior que 8MB — envie um recorte menor." };
    }

    if (kind === "pdf") {
      const { pages, text } = await parsePdf(bytes);
      const t = truncate(text);
      return { ...base, pages, text: t.text, truncated: t.truncated };
    }
    if (kind === "planilha") {
      const { sheets, text } = parseSheet(bytes);
      const t = truncate(text);
      return { ...base, sheets, text: t.text, truncated: t.truncated };
    }
    if (kind === "texto") {
      const t = truncate(new TextDecoder().decode(bytes));
      return { ...base, text: t.text, truncated: t.truncated };
    }
    return { ...base, error: `Tipo não suportado (${mediaType || name}). Envie PDF, XLSX, XLS, ODS ou CSV.` };
  } catch (err) {
    return { ...base, error: err instanceof Error ? err.message : "Erro ao ler o documento." };
  }
}

/** Extrai anexos de mensagens no formato UIMessage (parts type: 'file'). */
export function collectAttachments(body: any): IncomingAttachment[] {
  const out: IncomingAttachment[] = [];
  const push = (a: IncomingAttachment) => {
    if (out.length < MAX_DOCS) out.push(a);
  };

  for (const doc of body?.documents ?? []) push(doc);

  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const last = messages[messages.length - 1];
  const parts = Array.isArray(last?.parts) ? last.parts : [];
  for (const p of parts) {
    if (p?.type !== "file") continue;
    const mediaType = p.mediaType || p.mimeType || "";
    if (/^image\//i.test(mediaType)) continue; // imagens seguem pelo caminho de visão
    push({ name: p.filename || p.name, mediaType, url: p.url || p.data });
  }
  return out;
}

/** Faz o parse de todos os anexos e devolve um bloco pronto para o system prompt. */
export async function parseDocuments(body: any): Promise<{ docs: ParsedDocument[]; promptBlock: string }> {
  const attachments = collectAttachments(body);
  if (!attachments.length) return { docs: [], promptBlock: "" };

  const docs = await Promise.all(attachments.map(parseAttachment));
  const blocos = docs.map((d) => {
    if (d.error) return `#### ${d.name}\n(não foi possível ler: ${d.error})`;
    const meta = d.kind === "pdf"
      ? `PDF, ${d.pages ?? "?"} página(s)`
      : d.kind === "planilha"
      ? `Planilha, abas: ${(d.sheets ?? []).join(", ") || "—"}`
      : "Texto";
    return `#### ${d.name} (${meta}${d.truncated ? ", truncado" : ""})\n${d.text || "(vazio)"}`;
  });

  return {
    docs,
    promptBlock:
      `Documentos anexados pelo usuário nesta mensagem — use-os como fonte primária e cite o nome do arquivo ao referenciar dados:\n\n${blocos.join("\n\n")}`,
  };
}
