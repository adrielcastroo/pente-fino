/**
 * Salvamento automático (pré-save) das conferências operacionais
 * (tecido, madeira, motor/controle/coulisse).
 *
 * A cada bipagem a store grava um snapshot da conferência em andamento no
 * IndexedDB. Ele é independente do localStorage usado pelo `persist` do
 * zustand, que tem cota pequena (~5MB) e debounce de 1s. Se o localStorage
 * perder dados (aba fechada antes do debounce, cota estourada, JSON
 * corrompido), a store recupera os itens a partir deste snapshot.
 *
 * Todas as operações (gravar/limpar) passam por uma fila única para manter a
 * ordem. Gravações seguidas são coalescidas: só o snapshot mais recente é
 * escrito.
 */
import { get, set, del } from 'idb-keyval';
import type { Registro, AppMode } from '@/types';

export const AUTOSAVE_KEY = 'conferencia_autosave_v1';

export interface ConferenciaSnapshot {
  registros: Registro[];
  processo: string;
  conferente: string;
  currentMode: AppMode;
  sessionStartedAt: string | null;
  resumeMode: { conferenceId: string; folderName: string; lockedIds: string[] } | null;
  updatedAt: string;
}

export interface AutoSaveEvent {
  /** Quantidade de itens no snapshot gravado. */
  count: number;
  /** ISO timestamp do snapshot. */
  at: string;
}

type Listener = (e: AutoSaveEvent) => void;

const listeners = new Set<Listener>();

/** Assina o evento "salvamento automático realizado". Retorna o unsubscribe. */
export function onAutoSaved(fn: Listener): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function emit(e: AutoSaveEvent) {
  listeners.forEach(l => {
    try { l(e); } catch (err) { console.error('[autosave] listener falhou', err); }
  });
}

let chain: Promise<void> = Promise.resolve();
let pending: { snap: ConferenciaSnapshot; notify: boolean } | null = null;
let scheduled = false;
/** Incrementado a cada clear; gravações agendadas antes dele são descartadas. */
let generation = 0;
let warned = false;

function enqueue(op: () => Promise<void>): Promise<void> {
  chain = chain.then(op, op);
  return chain;
}

function warnOnce(msg: string, err: unknown) {
  if (warned) return;
  warned = true;
  console.warn(msg, err);
}

async function writePending(gen: number): Promise<void> {
  if (gen !== generation) return;
  scheduled = false;
  const job = pending;
  pending = null;
  if (!job) return;
  try {
    await set(AUTOSAVE_KEY, job.snap);
    if (job.notify) emit({ count: job.snap.registros.length, at: job.snap.updatedAt });
  } catch (err) {
    warnOnce('[autosave] não foi possível gravar no IndexedDB', err);
  }
}

/**
 * Agenda a gravação do snapshot. `notify` dispara o evento de UI depois que a
 * gravação é confirmada (usado quando houve bipagem).
 */
export function saveSnapshot(snap: ConferenciaSnapshot, opts: { notify?: boolean } = {}): Promise<void> {
  // Se um snapshot com notify ainda não foi gravado, mantém a notificação.
  const notify = !!opts.notify || !!pending?.notify;
  pending = { snap, notify };
  if (!scheduled) {
    scheduled = true;
    const gen = generation;
    enqueue(() => writePending(gen));
  }
  return chain;
}

/** Lê o snapshot salvo. Retorna null se não houver ou se estiver inválido. */
export async function loadSnapshot(): Promise<ConferenciaSnapshot | null> {
  try {
    const snap = await get<ConferenciaSnapshot>(AUTOSAVE_KEY);
    if (!snap || !Array.isArray(snap.registros)) return null;
    return snap;
  } catch (err) {
    warnOnce('[autosave] não foi possível ler o IndexedDB', err);
    return null;
  }
}

/** Remove o snapshot (conferência finalizada, arquivada ou limpa). */
export function clearSnapshot(): Promise<void> {
  generation++;
  pending = null;
  scheduled = false;
  return enqueue(async () => {
    try {
      await del(AUTOSAVE_KEY);
    } catch (err) {
      warnOnce('[autosave] não foi possível limpar o IndexedDB', err);
    }
  });
}

/** Aguarda todas as operações da fila (uso em testes). */
export async function waitForAutosaveIdle(): Promise<void> {
  for (;;) {
    const current = chain;
    await current;
    if (current === chain) return;
  }
}
