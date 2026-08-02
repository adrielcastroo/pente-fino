// Contrato Fio 2.0 — blocos textuais emitidos pelo `ai-agent` e extraídos
// no cliente. Emissão é textual (compatível com o stream SSE atual) e a
// extração é defensiva: JSON inválido cai como texto normal.

export type WidgetFieldType =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "multiselect"
  | "switch"
  | "radio";

export type WidgetField = {
  name: string;
  label: string;
  type?: WidgetFieldType;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string; hint?: string }>;
  default?: string | number | boolean | string[];
  min?: number;
  max?: number;
  step?: number;
};

export type WidgetChoiceOption = {
  value: string;
  label: string;
  description?: string;
};

export type WidgetLoteOption = {
  /** Identificação do lote/série no Auge (ex.: "TEC02.B.N04 PROC29863/26 27M-1"). */
  lote: string;
  /** Saldo disponível no depósito de origem. */
  quantidade?: number;
  /** Quantidade já reservada/selecionada no Auge. */
  selecionado?: number;
  hint?: string;
};

export type WidgetSpec =
  | {
      type: "form";
      id: string;
      title: string;
      description?: string;
      fields: WidgetField[];
      submitLabel?: string;
      onSubmitIntent?: string;
    }
  | {
      type: "choice";
      id: string;
      title: string;
      description?: string;
      options: WidgetChoiceOption[];
      onSubmitIntent?: string;
    }
  | {
      type: "confirm";
      id: string;
      title: string;
      description?: string;
      summary?: string;
      confirmLabel?: string;
      cancelLabel?: string;
      editLabel?: string;
      onSubmitIntent?: string;
      /** Contexto enviado junto do submit (ex.: cdMovimentacao). */
      values?: Record<string, unknown>;
    }
  | {
      /** Lista dinâmica de itens (ex.: múltiplos itens/lotes numa transferência). */
      type: "itemlist";
      id: string;
      title: string;
      description?: string;
      /** Campos repetidos por linha. */
      itemFields: WidgetField[];
      /** Campos únicos aplicados ao envio inteiro (ex.: observação). */
      sharedFields?: WidgetField[];
      /** Linhas iniciais (pré-preenchimento). */
      rows?: Array<Record<string, unknown>>;
      minRows?: number;
      maxRows?: number;
      addLabel?: string;
      submitLabel?: string;
      onSubmitIntent?: string;
      values?: Record<string, unknown>;
    }
  | {
      /** Seleção de lote/série: FIFO automático ou escolha manual. */
      type: "lotpick";
      id: string;
      title: string;
      description?: string;
      cdItem?: string;
      cdDeposito?: string;
      /** Quantidade a atender (usada para validar a soma manual). */
      qtd?: number;
      lotes: WidgetLoteOption[];
      allowMultiple?: boolean;
      defaultMode?: "fifo" | "manual";
      submitLabel?: string;
      onSubmitIntent?: string;
      /** Contexto devolvido junto do submit (payload pendente). */
      values?: Record<string, unknown>;
    };

export type ArtifactColumn = {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  numeric?: boolean;
  width?: string;
};

export type DashboardKpi = {
  label: string;
  value: string | number;
  hint?: string;
  delta?: number; // ex.: +12.5 => "+12.5%"
  tone?: "default" | "positive" | "negative" | "warning";
};

export type DashboardChart = {
  type: "bar" | "line" | "area" | "pie";
  title?: string;
  data: Array<Record<string, unknown>>;
  xKey?: string; // eixo categórico (bar/line/area)
  series: Array<{ key: string; label?: string; color?: string }>;
  height?: number;
};

export type ArtifactSpec =
  | {
      type: "table";
      id: string;
      title: string;
      subtitle?: string;
      columns: ArtifactColumn[];
      rows: Array<Record<string, unknown>>;
      searchable?: boolean;
      pageSize?: number;
    }
  | {
      type: "markdown";
      id: string;
      title: string;
      subtitle?: string;
      content: string;
    }
  | {
      type: "json";
      id: string;
      title: string;
      subtitle?: string;
      data: unknown;
    }
  | {
      type: "dashboard";
      id: string;
      title: string;
      subtitle?: string;
      kpis?: DashboardKpi[];
      charts?: DashboardChart[];
    };

const WIDGET_OPEN = "[[WIDGET]]";
const WIDGET_CLOSE = "[[/WIDGET]]";
const ARTIFACT_OPEN = "[[ARTIFACT]]";
const ARTIFACT_CLOSE = "[[/ARTIFACT]]";

function extractBlocks(text: string, open: string, close: string): { blocks: string[]; cleaned: string } {
  const blocks: string[] = [];
  let out = "";
  let idx = 0;
  while (idx < text.length) {
    const i = text.indexOf(open, idx);
    if (i === -1) {
      out += text.slice(idx);
      break;
    }
    const j = text.indexOf(close, i + open.length);
    if (j === -1) {
      out += text.slice(idx);
      break;
    }
    out += text.slice(idx, i);
    blocks.push(text.slice(i + open.length, j).trim());
    idx = j + close.length;
  }
  return { blocks, cleaned: out.trim() };
}

function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn("[agent-blocks] JSON inválido", err, raw.slice(0, 120));
    return null;
  }
}

export function extractWidgets(text: string): { widgets: WidgetSpec[]; cleaned: string } {
  const { blocks, cleaned } = extractBlocks(text, WIDGET_OPEN, WIDGET_CLOSE);
  const widgets: WidgetSpec[] = [];
  for (const raw of blocks) {
    const spec = safeParse<WidgetSpec>(raw);
    if (spec && typeof spec.id === "string" && typeof spec.title === "string" && typeof spec.type === "string") {
      widgets.push(spec);
    }
  }
  return { widgets, cleaned };
}

export function extractArtifacts(text: string): { artifacts: ArtifactSpec[]; cleaned: string } {
  const { blocks, cleaned } = extractBlocks(text, ARTIFACT_OPEN, ARTIFACT_CLOSE);
  const artifacts: ArtifactSpec[] = [];
  for (const raw of blocks) {
    const spec = safeParse<ArtifactSpec>(raw);
    if (spec && typeof spec.id === "string" && typeof spec.title === "string" && typeof spec.type === "string") {
      artifacts.push(spec);
    }
  }
  return { artifacts, cleaned };
}

// Prefixo enviado como próxima mensagem do usuário depois de submeter um widget.
// O Edge Function reconhece esse prefixo e desempacota o JSON antes de chamar o LLM.
export const WIDGET_SUBMIT_PREFIX = "__widget_submit__:";

export function encodeWidgetSubmit(payload: {
  widget_id: string;
  intent?: string;
  values: Record<string, unknown>;
}): string {
  return `${WIDGET_SUBMIT_PREFIX}${JSON.stringify(payload)}`;
}

export function decodeWidgetSubmit(
  text: string,
): { widget_id: string; intent?: string; values: Record<string, unknown> } | null {
  if (!text.startsWith(WIDGET_SUBMIT_PREFIX)) return null;
  return safeParse(text.slice(WIDGET_SUBMIT_PREFIX.length));
}
