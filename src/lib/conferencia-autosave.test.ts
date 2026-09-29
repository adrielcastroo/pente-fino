import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = new Map<string, unknown>();

vi.mock('idb-keyval', () => ({
  get: vi.fn(async (key: string) => storage.get(key)),
  set: vi.fn(async (key: string, value: unknown) => { storage.set(key, value); }),
  del: vi.fn(async (key: string) => { storage.delete(key); }),
}));

import {
  AUTOSAVE_KEY,
  loadSnapshot,
  saveSnapshot,
  waitForAutosaveIdle,
} from './conferencia-autosave';

const snapshot = (count: number) => ({
  registros: Array.from({ length: count }, (_, i) => ({
    id: String(i),
    lote: `SERIE-${i}`,
  })) as any,
  processo: '',
  conferente: 'teste',
  currentMode: 'motor' as any,
  sessionStartedAt: null,
  resumeMode: null,
  updatedAt: new Date().toISOString(),
});

describe('conferencia autosave', () => {
  beforeEach(() => storage.clear());

  it('keeps the newest snapshot after hundreds of rapid saves', async () => {
    for (let count = 1; count <= 501; count++) {
      saveSnapshot(snapshot(count), { notify: true });
    }

    await waitForAutosaveIdle();
    const saved = await loadSnapshot();

    expect(saved?.registros).toHaveLength(501);
    expect(saved?.registros.at(-1)?.lote).toBe('SERIE-500');
    expect(storage.has(AUTOSAVE_KEY)).toBe(true);
  });
});
