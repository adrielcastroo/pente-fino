/**
 * Normaliza uma string de configuração/descrição para uso como TAG (formato C):
 * - trim
 * - colapsa múltiplos espaços/underscores em espaço único
 * - remove caracteres de controle
 * - preserva capitalização original (não força upper/lower)
 * - normaliza separadores comuns (_ → espaço)
 */
export function normalizeTagFormatC(input: string | null | undefined): string {
  if (!input) return '';
  return String(input)
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifica se um acabamento está sem tag.
 */
export function isMissingTag(a: { ds_tag_calculada?: string | null }): boolean {
  const t = (a?.ds_tag_calculada ?? '').trim();
  return t.length === 0;
}
