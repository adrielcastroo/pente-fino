// ============================================================================
// Persistência local: templates, activeId, globalVars.
// ============================================================================
import type { Template, Vars } from '../types/etiqueta';

const TEMPLATES_KEY = 'exp_etq_templates_v1';
const ACTIVE_KEY = 'exp_etq_active_v1';
const GLOBAL_VARS_KEY = 'exp_etq_globalvars_v1';

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function loadTemplates(): Template[] {
  const arr = safeParse<Template[]>(localStorage.getItem(TEMPLATES_KEY), []);
  return Array.isArray(arr) ? arr : [];
}
export function saveTemplates(list: Template[]): void {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(list));
}
export function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}
export function saveActiveId(id: string | null): void {
  if (!id) localStorage.removeItem(ACTIVE_KEY);
  else localStorage.setItem(ACTIVE_KEY, id);
}
export function loadGlobalVars(): Vars {
  return safeParse<Vars>(localStorage.getItem(GLOBAL_VARS_KEY), {});
}
export function saveGlobalVars(v: Vars): void {
  localStorage.setItem(GLOBAL_VARS_KEY, JSON.stringify(v));
}

export function makeDefaultTemplate(name = 'Modelo Padrão'): Template {
  const now = Date.now();
  return {
    id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    createdAt: now,
    updatedAt: now,
    version: 1,
    widthMm: 100,
    heightMm: 150,
    titulo: 'EXPEDIÇÃO',
    subtitulo: '{{romaneio}}',
    codigo: '{{romaneio}}',
    destino: '{{cliente}}',
    observacoes: '',
    customFields: [],
    showQr: true,
    showBarcode: true,
    barcodeFmt: 'CODE128',
    payload: '{{romaneio}}',
    copies: 1,
    align: 'center',
    titleSize: 22,
    codeSize: 14,
    padding: 4,
    borderStyle: 'solid',
    templateVars: {},
  };
}
