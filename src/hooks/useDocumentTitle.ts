import { useEffect } from "react";

const SUFFIX = "Pente Fino";

/**
 * Atualiza document.title de forma simples.
 * Restaura o título anterior ao desmontar.
 */
export function useDocumentTitle(label: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = label ? `${label} · ${SUFFIX}` : SUFFIX;
    return () => {
      document.title = previous;
    };
  }, [label]);
}
