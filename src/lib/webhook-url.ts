/**
 * Validação centralizada de URLs de webhook (n8n, etc).
 * Regra: apenas http(s), com host, sem espaços.
 */
export interface WebhookUrlValidation {
  ok: boolean;
  /** Mensagem pronta para exibição (pt-BR). Vazia quando `ok=true`. */
  error: string;
}

/**
 * Valida uma URL de webhook.
 * - `allowEmpty=true` (default): string vazia é considerada válida (campo opcional).
 * - Só aceita `http:` e `https:`.
 */
export function validateWebhookUrl(
  raw: string | null | undefined,
  opts: { allowEmpty?: boolean } = {},
): WebhookUrlValidation {
  const { allowEmpty = true } = opts;
  const value = (raw ?? '').trim();

  if (!value) {
    return allowEmpty
      ? { ok: true, error: '' }
      : { ok: false, error: 'URL do webhook é obrigatória.' };
  }

  if (/\s/.test(value)) {
    return { ok: false, error: 'A URL não pode conter espaços.' };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: 'URL inválida (formato esperado: http://host/caminho).' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, error: `Protocolo "${url.protocol}" não permitido. Use http:// ou https://.` };
  }

  if (!url.hostname) {
    return { ok: false, error: 'URL sem host válido.' };
  }

  return { ok: true, error: '' };
}

/** Atalho booleano. */
export function isValidWebhookUrl(
  raw: string | null | undefined,
  opts: { allowEmpty?: boolean } = {},
): boolean {
  return validateWebhookUrl(raw, opts).ok;
}
