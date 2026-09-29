import "fake-indexeddb/auto";
import { describe, it, expect, vi } from "vitest";

vi.mock("sonner", () => ({ toast: new Proxy({}, { get: () => vi.fn() }) }));

/**
 * Carga funcional do fluxo de salvamento automatico.
 *
 * Prova que uma conferencia com 500+ itens bipados nao perde nenhum registro:
 *   1. Snapshot no IndexedDB a cada bipagem (addRegistro -> autosaveSnapshot).
 *   2. Persistencia no localStorage via middleware persist (debounce de 1s).
 *   3. Recuperacao ao boot quando o localStorage e perdido/corrompido.
 *
 * O mock do idb-keyval e em-memoria: operações async resolvem normalmente
 * mesmo com fake timers ativos (o fake-indexeddb real depende de setTimeout).
 */

const REGISTRO_KEY = "cft4-registros";
const AUTOSAVE_KEY = "conferencia_autosave_v1";

interface RegistroShape {
  id: string;
  item: string;
  processo: string;
  nf?: string;
  endereco: string;
  m2: number;
  mLinear: number;
  largura: number;
  lote: string;
  loteSistema: string;
  posicao?: number;
  quantidade?: number;
  isNew?: boolean;
  conference_id?: string | null;
  tipoTecido?: string;
  modoOrigem?: string;
  wasEdited?: boolean;
  editedBy?: string;
  editedAt?: string | null;
  loteMestreId?: string | null;
  avariaTipo?: "riscado" | "manchado" | "quebrado" | "outro" | null;
  avariaDescricao?: string | null;
  avariaFotoUrl?: string | null;
  curva_abc?: string;
  ultima_contagem?: string | null;
}

function makeRegistro(id: string, i: number): RegistroShape {
  return {
    id,
    item: "ITEM-" + String(i).padStart(5, "0"),
    processo: "12345",
    endereco: "TEC01.A.N03",
    m2: 50,
    mLinear: 25,
    largura: 2,
    lote: "L" + i,
    loteSistema: "TEC01 PROC 12345 25M-" + i,
    quantidade: 1,
    isNew: false,
    conference_id: null,
    tipoTecido: "Tecido A",
    modoOrigem: "manual",
  } as any;
}

function buildRegistros(n: number): RegistroShape[] {
  const out: RegistroShape[] = [];
  for (let i = 0; i < n; i++) out.push(makeRegistro("id-" + i, i));
  return out;
}

async function nextFrame() {
  await new Promise((r) => setTimeout(r, 0));
}

async function loadDeps() {
  const { del } = await import("idb-keyval");
  const { loadSnapshot, waitForAutosaveIdle } = await import(
    "@/lib/conferencia-autosave"
  );
  const { useAppStore } = await import("@/store/useAppStore");
  return { del, loadSnapshot, waitForAutosaveIdle, useAppStore };
}

function resetState() {
  localStorage.clear();
  (window as any)._persisterTimer = null;
  (window as any)._persisterValue = null;
  vi.resetModules();
}

function flushPersister() {
  const global = window as any;
  if (global._persisterTimer) {
    clearTimeout(global._persisterTimer);
    try {
      localStorage.setItem(REGISTRO_KEY, JSON.stringify(global._persisterValue));
    } catch (e) {
      console.error("[persist] flush on unload falhou", e);
    }
    global._persisterTimer = null;
  }
}

describe("conferencia de 500+ itens - salvamento automatico", () => {

  it("500 itens: persiste em IndexedDB + localStorage e recupera do snapshot", async () => {
    resetState();
    const { del, loadSnapshot, waitForAutosaveIdle, useAppStore } = await loadDeps();

    try {
      await del(AUTOSAVE_KEY);

      const N = 500;
      for (const reg of buildRegistros(N)) {
        useAppStore.getState().addRegistro(reg as any);
      }

      await waitForAutosaveIdle();
      expect(useAppStore.getState().registros.length).toBe(N);

      const snap = await loadSnapshot();
      expect(snap).toBeTruthy();
      expect(snap!.registros.length).toBe(N);
      expect(new Set(snap!.registros.map((r: any) => r.id)).size).toBe(N);
      expect(snap!.registros[0].id).toBe("id-0");
      expect(snap!.registros[N - 1].id).toBe("id-" + (N - 1));
      expect(snap!.registros[123].item).toBe("ITEM-00123");
      expect(snap!.registros[499].item).toBe("ITEM-00499");

      flushPersister();
      const lsRaw = localStorage.getItem(REGISTRO_KEY);
      expect(lsRaw).toBeTruthy();
      const ls = JSON.parse(lsRaw as string);
      expect(ls.state.registros.length).toBe(N);
      expect(ls.state.registros[0].id).toBe("id-0");
      expect(ls.state.registros[N - 1].id).toBe("id-" + (N - 1));
      expect(ls.state.registros[123].id).toBe("id-123");
      expect(ls.state.registros[499].item).toBe("ITEM-00499");
      expect((lsRaw as string).length).toBeLessThan(10 * 1024 * 1024);

      localStorage.clear();
      useAppStore.setState({ registros: [] });
      await useAppStore.getState().checkAndRestoreSnapshot();
      expect(useAppStore.getState().registros.length).toBe(N);
      expect(useAppStore.getState().registros[0].id).toBe("id-0");
      expect(useAppStore.getState().registros[N - 1].id).toBe("id-" + (N - 1));
    } finally {
      await del(AUTOSAVE_KEY);
    }
  }, 30000);

  it("600 itens: persiste todos sem perda", async () => {
    resetState();
    const { del, loadSnapshot, waitForAutosaveIdle, useAppStore } = await loadDeps();

    try {
      await del(AUTOSAVE_KEY);
      const N = 600;
      for (const reg of buildRegistros(N)) {
        useAppStore.getState().addRegistro(reg as any);
      }

      await waitForAutosaveIdle();
      expect(useAppStore.getState().registros.length).toBe(N);

      const snap = await loadSnapshot();
      expect(snap!.registros.length).toBe(N);
      expect(new Set(snap!.registros.map((r: any) => r.id)).size).toBe(N);

      flushPersister();
      const ls = JSON.parse(localStorage.getItem(REGISTRO_KEY) as string);
      expect(ls.state.registros.length).toBe(N);
    } finally {
      await del(AUTOSAVE_KEY);
    }
  }, 30000);

  it("1000 itens: persiste todos sem perda", async () => {
    resetState();
    const { del, loadSnapshot, waitForAutosaveIdle, useAppStore } = await loadDeps();

    try {
      await del(AUTOSAVE_KEY);
      const N = 1000;
      for (const reg of buildRegistros(N)) {
        useAppStore.getState().addRegistro(reg as any);
      }

      await waitForAutosaveIdle();
      expect(useAppStore.getState().registros.length).toBe(N);

      const snap = await loadSnapshot();
      expect(snap!.registros.length).toBe(N);
      expect(new Set(snap!.registros.map((r: any) => r.id)).size).toBe(N);
      expect(snap!.registros[0].id).toBe("id-0");
      expect(snap!.registros[N - 1].id).toBe("id-" + (N - 1));

      flushPersister();
      const ls = JSON.parse(localStorage.getItem(REGISTRO_KEY) as string);
      expect(ls.state.registros.length).toBe(N);
      expect(ls.state.registros[0].id).toBe("id-0");
      expect(ls.state.registros[N - 1].id).toBe("id-" + (N - 1));
    } finally {
      await del(AUTOSAVE_KEY);
    }
  }, 60000);

  it("recuperacao do snapshot quando localStorage eh perdido", async () => {
    resetState();
    const { del, loadSnapshot, waitForAutosaveIdle, useAppStore } = await loadDeps();

    try {
      await del(AUTOSAVE_KEY);

      const N = 20;
      for (const reg of buildRegistros(N)) {
        useAppStore.getState().addRegistro(reg as any);
      }
      await waitForAutosaveIdle();
      flushPersister();

      expect(useAppStore.getState().registros.length).toBe(N);

      const snap = await loadSnapshot();
      expect(snap!.registros.length).toBe(N);
      expect(snap!.registros[0].id).toBe("id-0");
      expect(snap!.registros[N - 1].id).toBe("id-" + (N - 1));

      // Simula perda do localStorage
      localStorage.clear();
      useAppStore.setState({ registros: [] });
      await useAppStore.getState().checkAndRestoreSnapshot();
      expect(useAppStore.getState().registros.length).toBe(N);
      expect(useAppStore.getState().registros[0].id).toBe("id-0");
      expect(useAppStore.getState().registros[N - 1].id).toBe("id-" + (N - 1));
    } finally {
      await del(AUTOSAVE_KEY);
    }
  }, 30000);
});
