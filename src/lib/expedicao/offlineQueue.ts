import { get, set } from 'idb-keyval';

const KEY = 'expedicao_bip_queue_v1';

export type BipQueueItem = {
  id: string;
  pickingId: string;
  codigoPeca: string;
  createdAt: number;
  tries: number;
};

export async function getQueue(): Promise<BipQueueItem[]> {
  return (await get<BipQueueItem[]>(KEY)) ?? [];
}

async function saveQueue(q: BipQueueItem[]) {
  await set(KEY, q);
}

export async function enqueueBip(pickingId: string, codigoPeca: string) {
  const q = await getQueue();
  q.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    pickingId,
    codigoPeca,
    createdAt: Date.now(),
    tries: 0,
  });
  await saveQueue(q);
}

export async function removeFromQueue(id: string) {
  const q = await getQueue();
  await saveQueue(q.filter((i) => i.id !== id));
}

export async function bumpTries(id: string) {
  const q = await getQueue();
  const i = q.find((x) => x.id === id);
  if (i) {
    i.tries += 1;
    await saveQueue(q);
  }
}
