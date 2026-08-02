import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { UIMessage } from "ai";

export type AgentThread = {
  id: string;
  title: string;
  messages: UIMessage[];
  createdAt: number;
};

type State = {
  threads: AgentThread[];
  activeId: string | null;
  open: boolean;
};

type Actions = {
  toggleOpen: (v?: boolean) => void;
  newThread: () => string;
  selectThread: (id: string) => void;
  deleteThread: (id: string) => void;
  renameThread: (id: string, title: string) => void;
  setMessages: (id: string, messages: UIMessage[]) => void;
  setTitleFromFirstMessage: (id: string, text: string) => void;
};

const genId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `t_${Date.now()}_${Math.random()}`;

export const useAgentThreads = create<State & Actions>()(
  persist(
    (set, get) => ({
      threads: [],
      activeId: null,
      open: false,

      toggleOpen: (v) => set((s) => ({ open: v ?? !s.open })),

      newThread: () => {
        const id = genId();
        const thread: AgentThread = { id, title: "Nova conversa", messages: [], createdAt: Date.now() };
        set((s) => ({ threads: [thread, ...s.threads], activeId: id }));
        return id;
      },

      selectThread: (id) => set({ activeId: id }),

      deleteThread: (id) =>
        set((s) => {
          const threads = s.threads.filter((t) => t.id !== id);
          const activeId = s.activeId === id ? threads[0]?.id ?? null : s.activeId;
          return { threads, activeId };
        }),

      renameThread: (id, title) =>
        set((s) => ({
          threads: s.threads.map((t) => (t.id === id ? { ...t, title } : t)),
        })),

      setMessages: (id, messages) =>
        set((s) => ({
          threads: s.threads.map((t) => (t.id === id ? { ...t, messages } : t)),
        })),

      setTitleFromFirstMessage: (id, text) => {
        const t = get().threads.find((x) => x.id === id);
        if (!t || (t.title !== "Nova conversa" && t.title !== "")) return;
        const title = text.slice(0, 50).trim() + (text.length > 50 ? "…" : "");
        set((s) => ({ threads: s.threads.map((x) => (x.id === id ? { ...x, title } : x)) }));
      },
    }),
    {
      name: "fio-threads",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        threads: state.threads,
        activeId: state.activeId,
      }),
    }
  )
);

