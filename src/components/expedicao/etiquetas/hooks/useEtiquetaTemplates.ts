// ============================================================================
// Hook: gestão de templates (CRUD + activeId + persistência local).
// ============================================================================
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { Template } from '../types/etiqueta';
import {
  loadTemplates, saveTemplates, loadActiveId, saveActiveId, makeDefaultTemplate,
} from '../utils/etiquetaStorage';

export interface UseTemplatesReturn {
  templates: Template[];
  activeId: string | null;
  active: Template | null;
  setActiveId: (id: string) => void;
  create: (name?: string) => string;
  duplicate: (id: string) => string | null;
  remove: (id: string) => void;
  update: (id: string, patch: Partial<Template>) => void;
  patchActive: (patch: Partial<Template>) => void;
  rename: (id: string, name: string) => void;
  exportJson: () => void;
  importJson: (file: File) => Promise<void>;
}

export function useEtiquetaTemplates(): UseTemplatesReturn {
  const [templates, setTemplates] = useState<Template[]>(() => {
    const existing = loadTemplates();
    return existing.length ? existing : [makeDefaultTemplate()];
  });
  const [activeId, _setActiveId] = useState<string | null>(() => loadActiveId());

  // Garante um activeId válido
  useEffect(() => {
    if (!templates.length) return;
    if (!activeId || !templates.some((t) => t.id === activeId)) {
      _setActiveId(templates[0].id);
      saveActiveId(templates[0].id);
    }
  }, [templates, activeId]);

  // Persistência (debounce 200ms)
  useEffect(() => {
    const id = setTimeout(() => saveTemplates(templates), 200);
    return () => clearTimeout(id);
  }, [templates]);

  const setActiveId = useCallback((id: string) => {
    _setActiveId(id);
    saveActiveId(id);
  }, []);

  const create = useCallback((name?: string) => {
    const t = makeDefaultTemplate(name || `Modelo ${new Date().toLocaleDateString('pt-BR')}`);
    setTemplates((list) => [t, ...list]);
    setActiveId(t.id);
    return t.id;
  }, [setActiveId]);

  const duplicate = useCallback((id: string) => {
    let newId: string | null = null;
    setTemplates((list) => {
      const src = list.find((t) => t.id === id);
      if (!src) return list;
      const now = Date.now();
      const clone: Template = {
        ...src,
        id: `${now.toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        name: `${src.name} (cópia)`,
        createdAt: now,
        updatedAt: now,
      };
      newId = clone.id;
      return [clone, ...list];
    });
    if (newId) setActiveId(newId);
    return newId;
  }, [setActiveId]);

  const remove = useCallback((id: string) => {
    setTemplates((list) => list.filter((t) => t.id !== id));
  }, []);

  const update = useCallback((id: string, patch: Partial<Template>) => {
    setTemplates((list) => list.map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)));
  }, []);

  const rename = useCallback((id: string, name: string) => {
    update(id, { name: name.trim() || 'Sem nome' });
  }, [update]);

  const patchActive = useCallback((patch: Partial<Template>) => {
    if (!activeId) return;
    update(activeId, patch);
  }, [activeId, update]);

  const active = useMemo(() => templates.find((t) => t.id === activeId) ?? null, [templates, activeId]);

  const exportJson = useCallback(() => {
    if (!active) return;
    const blob = new Blob([JSON.stringify(active, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${active.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template exportado.');
  }, [active]);

  const importJson = useCallback(async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Partial<Template>;
      const t: Template = { ...makeDefaultTemplate(parsed.name || 'Importado'), ...parsed, id: makeDefaultTemplate().id };
      setTemplates((list) => [t, ...list]);
      setActiveId(t.id);
      toast.success('Template importado.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao importar template.');
    }
  }, [setActiveId]);

  return { templates, activeId, active, setActiveId, create, duplicate, remove, update, patchActive, rename, exportJson, importJson };
}
