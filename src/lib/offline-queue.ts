import { openDB, type IDBPDatabase } from 'idb';
import type { Registro } from '@/types';

const DB_NAME = 'cft4-offline';
const DB_VERSION = 1;
const STORE = 'pending_archives';

export type PendingStatus = 'pending' | 'syncing' | 'failed';

export interface PendingArchive {
  id: string; // client_uuid
  processo: string;
  conferente: string;
  startedAt: string;
  currentMode: string;
  registros: Registro[];
  status: PendingStatus;
  retry_count: number;
  last_error: string | null;
  created_at: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' });
          store.createIndex('status', 'status');
          store.createIndex('created_at', 'created_at');
        }
      },
    });
  }
  return dbPromise;
}

function makeUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function enqueueArchive(
  data: Omit<PendingArchive, 'id' | 'status' | 'retry_count' | 'last_error' | 'created_at'>
): Promise<PendingArchive> {
  const item: PendingArchive = {
    ...data,
    id: makeUuid(),
    status: 'pending',
    retry_count: 0,
    last_error: null,
    created_at: Date.now(),
  };
  const db = await getDb();
  await db.put(STORE, item);
  notifyChange();
  return item;
}

export async function listPending(): Promise<PendingArchive[]> {
  const db = await getDb();
  return db.getAll(STORE);
}

export async function countPending(): Promise<number> {
  const db = await getDb();
  return db.count(STORE);
}

export async function updateItem(item: PendingArchive): Promise<void> {
  const db = await getDb();
  await db.put(STORE, item);
  notifyChange();
}

export async function removeItem(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, id);
  notifyChange();
}

export async function getReadyItems(): Promise<PendingArchive[]> {
  const all = await listPending();
  return all.filter(i => i.status === 'pending' && i.retry_count < 5);
}

// Pub/sub for UI badges
type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

function notifyChange() {
  listeners.forEach(l => {
    try { l(); } catch { /* noop */ }
  });
}
