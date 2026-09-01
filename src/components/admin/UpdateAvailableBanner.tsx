import { useState } from 'react';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCurrentRelease } from '@/hooks/useAppReleases';

declare const __APP_VERSION__: string;

/**
 * Mostra banner quando a versão publicada no Cloud (app_releases.is_current)
 * é diferente da versão embutida no bundle carregado no navegador.
 * 
 * CORREÇÃO CRÍTICA: O reload automático via useEffect foi removido para evitar
 * qualquer possibilidade de loop infinito de recarregamento. Agora o usuário
 * atualiza manualmente clicando no botão.
 */
export function UpdateAvailableBanner() {
  const current = useCurrentRelease();
  const [dismissed, setDismissed] = useState(false);
  const bundleVersion = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';

  // Se não houver versão nova ou o usuário fechou o banner, não exibe
  if (!current || dismissed) return null;
  if (current.version === bundleVersion) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md rounded-lg border border-primary/40 bg-card shadow-lg p-4 flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Nova versão disponível</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          v{current.version} — você está em v{bundleVersion}. Recarregue para atualizar.
        </p>
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={() => window.location.reload()}>
            <RefreshCw className="h-3.5 w-3.5" />
            Recarregar
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
            Depois
          </Button>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-muted-foreground hover:text-foreground"
        aria-label="Fechar"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
