import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAppStore } from '@/store/useAppStore';

/**
 * Configurações globais do app (tabela `public.app_global_settings`).
 *
 * Tudo que é alterado no Painel Admin vale para TODOS os usuários: os valores
 * ficam no banco, são lidos por qualquer sessão e propagados em tempo real.
 * O localStorage passa a ser apenas cache local dos valores globais.
 */
export const GLOBAL_LABEL_SETTINGS_KEY = 'label_settings';
export const GLOBAL_PRINT_CONFIG_KEY = 'print_config';

const WEBHOOK_LS_KEY = 'n8n_webhook_url';
const SILENT_PRINT_LS_KEY = 'pref_silent_browser_print';

export interface GlobalPrintConfig {
  webhookUrl?: string | null;
  silentPrint?: boolean;
}

/** Último valor conhecido vindo do banco, por chave — evita eco de escrita. */
const lastRemote: Record<string, string> = {};

/** Persiste uma configuração global. Só admins passam pela RLS. */
export async function saveGlobalSetting(key: string, value: unknown): Promise<void> {
  const serialized = JSON.stringify(value ?? null);
  if (lastRemote[key] === serialized) return;
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await (supabase as any)
    .from('app_global_settings')
    .upsert(
      { key, value: value ?? null, updated_by: auth.user?.id ?? null, updated_at: new Date().toISOString() },
      { onConflict: 'key' },
    );
  if (error) throw error;
  lastRemote[key] = serialized;
}

/** Aplica um valor global recebido do banco no estado local do app. */
function applyGlobalSetting(key: string, value: any) {
  lastRemote[key] = JSON.stringify(value ?? null);
  if (!value) return;

  if (key === GLOBAL_LABEL_SETTINGS_KEY && typeof value === 'object') {
    useAppStore.getState().setLabelSettings(value);
    return;
  }

  if (key === GLOBAL_PRINT_CONFIG_KEY && typeof value === 'object') {
    const cfg = value as GlobalPrintConfig;
    try {
      if (cfg.webhookUrl) localStorage.setItem(WEBHOOK_LS_KEY, cfg.webhookUrl);
      else localStorage.removeItem(WEBHOOK_LS_KEY);
      if (cfg.silentPrint) localStorage.setItem(SILENT_PRINT_LS_KEY, 'true');
      else localStorage.removeItem(SILENT_PRINT_LS_KEY);
    } catch { /* storage indisponível */ }
  }
}

/** Snapshot local (sem rede) do último valor global conhecido. */
export function getLastRemote<T = unknown>(key: string): T | null {
  const raw = lastRemote[key];
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}

/**
 * Carrega e mantém sincronizadas as configurações globais.
 * Deve ser montado uma única vez, no layout principal.
 */
export function useGlobalSettingsSync() {
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data, error } = await (supabase as any)
        .from('app_global_settings')
        .select('key, value');
      if (cancelled || error || !data) return;
      (data as { key: string; value: unknown }[]).forEach((row) => applyGlobalSetting(row.key, row.value));
    })();

    const channel = supabase
      .channel('rt-app-global-settings')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_global_settings' },
        (payload: any) => {
          const row = payload.new ?? payload.old;
          if (row?.key) applyGlobalSetting(row.key, payload.eventType === 'DELETE' ? null : row.value);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);
}

/**
 * Publica automaticamente (debounce) as configurações de etiqueta do admin
 * como configuração global do app.
 */
export function usePublishLabelSettings(enabled: boolean) {
  const labelSettings = useAppStore((s) => s.labelSettings);

  useEffect(() => {
    if (!enabled) return;
    const serialized = JSON.stringify(labelSettings ?? null);
    if (lastRemote[GLOBAL_LABEL_SETTINGS_KEY] === serialized) return;
    const t = setTimeout(() => {
      saveGlobalSetting(GLOBAL_LABEL_SETTINGS_KEY, labelSettings).catch((e) =>
        console.warn('[global-settings] falha ao publicar etiquetas', e),
      );
    }, 700);
    return () => clearTimeout(t);
  }, [labelSettings, enabled]);
}
