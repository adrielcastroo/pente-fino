import { apiService } from '@/services/api';
import {
  getReadyItems,
  removeItem,
  updateItem,
  countPending,
  type PendingArchive,
} from './offline-queue';

const MAX_RETRIES = 5;
const POLL_MS = 30_000;

let running = false;
let started = false;
let pollHandle: ReturnType<typeof setInterval> | null = null;

async function drainOnce(): Promise<void> {
  if (running) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  running = true;
  try {
    const items = await getReadyItems();
    for (const item of items) {
      await processItem(item);
    }
  } finally {
    running = false;
  }
}

async function processItem(item: PendingArchive): Promise<void> {
  await updateItem({ ...item, status: 'syncing' });
  try {
    await apiService.archiveConference(
      item.processo,
      item.conferente,
      item.startedAt,
      item.registros,
      item.currentMode
    );
    await removeItem(item.id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    const retry_count = item.retry_count + 1;
    await updateItem({
      ...item,
      status: retry_count >= MAX_RETRIES ? 'failed' : 'pending',
      retry_count,
      last_error: message,
    });
  }
}

export function startOfflineSync(): void {
  if (started || typeof window === 'undefined') return;
  started = true;

  const trigger = () => { void drainOnce(); };

  window.addEventListener('online', trigger);
  window.addEventListener('focus', trigger);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') trigger();
  });

  pollHandle = setInterval(async () => {
    const n = await countPending();
    if (n > 0) trigger();
  }, POLL_MS);

  // Initial drain
  trigger();
}

export function stopOfflineSync(): void {
  if (pollHandle) {
    clearInterval(pollHandle);
    pollHandle = null;
  }
  started = false;
}

export async function retryNow(): Promise<void> {
  await drainOnce();
}
