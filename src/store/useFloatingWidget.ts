import { create } from "zustand";
import type { WidgetSpec } from "@/lib/agent-blocks";

type Pos = { x: number; y: number };
type Size = { w: number; h: number };

type State = {
  widgets: Record<string, WidgetSpec>;
  activeId: string | null;
  submittedIds: Record<string, true>;
  pos: Pos;
  size: Size;
  minimized: boolean;
};

type Actions = {
  register: (spec: WidgetSpec) => void;
  open: (id: string) => void;
  close: () => void;
  markSubmitted: (id: string) => void;
  setPos: (p: Pos) => void;
  setSize: (s: Size) => void;
  toggleMinimize: () => void;
  reset: () => void;
};

const initialPos = (): Pos => {
  if (typeof window === "undefined") return { x: 120, y: 120 };
  const w = 460;
  const h = 560;
  return {
    x: Math.max(24, window.innerWidth - w - 480), // à esquerda do painel do chat
    y: Math.max(24, window.innerHeight - h - 40),
  };
};

export const useFloatingWidget = create<State & Actions>((set, get) => ({
  widgets: {},
  activeId: null,
  submittedIds: {},
  pos: initialPos(),
  size: { w: 460, h: 560 },
  minimized: false,

  register: (spec) => {
    const { widgets, submittedIds, activeId } = get();
    const exists = widgets[spec.id];
    const nextWidgets = exists ? widgets : { ...widgets, [spec.id]: spec };
    // Auto-open first-time widgets that ainda não foram enviados.
    const shouldAutoOpen = !exists && !submittedIds[spec.id];
    set({
      widgets: nextWidgets,
      activeId: shouldAutoOpen ? spec.id : activeId,
      minimized: shouldAutoOpen ? false : get().minimized,
    });
  },
  open: (id) => set({ activeId: id, minimized: false }),
  close: () => set({ activeId: null, minimized: false }),
  markSubmitted: (id) =>
    set((s) => ({
      submittedIds: { ...s.submittedIds, [id]: true },
      activeId: s.activeId === id ? null : s.activeId,
    })),
  setPos: (pos) => set({ pos }),
  setSize: (size) => set({ size }),
  toggleMinimize: () => set((s) => ({ minimized: !s.minimized })),
  reset: () => set({ widgets: {}, activeId: null, submittedIds: {}, minimized: false }),
}));
