import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChatPanelMode = "floating" | "sidebar";

type State = {
  mode: ChatPanelMode;
  /** Largura em px no modo floating e sidebar. */
  width: number;
  /** Altura em px apenas no modo floating. */
  height: number;
};

type Actions = {
  setMode: (m: ChatPanelMode) => void;
  toggleMode: () => void;
  setWidth: (w: number) => void;
  setHeight: (h: number) => void;
};

export const useChatPanel = create<State & Actions>()(
  persist(
    (set) => ({
      mode: "floating",
      width: 440,
      height: 680,
      setMode: (mode) => set({ mode }),
      toggleMode: () => set((s) => ({ mode: s.mode === "floating" ? "sidebar" : "floating" })),
      setWidth: (width) => set({ width }),
      setHeight: (height) => set({ height }),
    }),
    { name: "fio-chat-panel" },
  ),
);
