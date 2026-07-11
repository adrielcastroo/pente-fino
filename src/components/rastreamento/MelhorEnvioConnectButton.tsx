import { useEffect, useState, useCallback } from 'react';
import { Plug, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface MEStatus {
  connected: boolean;
  environment: string;
  expiresAt: string | null;
}

const PUBLISHED_CALLBACK_ORIGIN = 'https://pente-fino.lovable.app';

function isEmbeddedPreview() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

function getRedirectUri() {
  const origin = window.location.origin;
  const isLovablePreview = origin.includes('-preview--') || origin.includes('id-preview--');
  const callbackOrigin = isLovablePreview ? PUBLISHED_CALLBACK_ORIGIN : origin;
  return `${callbackOrigin}/auth/callback`;
}

/**
 * Botão / status da integração com o Melhor Envio.
 * - Verifica se há refresh_token no backend (action=status)
 * - Se não conectado: chama action=authorize_url e redireciona para o consentimento OAuth
 * - Após consentimento, o usuário volta em /auth/callback (OAuthCallbackPage)
 */
export function MelhorEnvioConnectButton() {
  const [status, setStatus] = useState<MEStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('melhor-envio', {
        body: { action: 'status' },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setStatus(data as MEStatus);
    } catch (e) {
      // silencioso — a página funciona mesmo sem status
      console.error('ME status:', (e as Error).message);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connect = async () => {
    setLoading(true);
    const embedded = isEmbeddedPreview();
    const authWindow = embedded ? window.open('about:blank', '_blank') : null;
    try {
      const redirectUri = getRedirectUri();
      const { data, error } = await supabase.functions.invoke('melhor-envio', {
        body: { action: 'authorize_url', redirect_uri: redirectUri },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error('URL de autorização não recebida');

      if (authWindow) {
        authWindow.opener = null;
        authWindow.location.href = data.url as string;
        setLoading(false);
        return;
      }

      window.location.assign(data.url as string);
    } catch (e) {
      authWindow?.close();
      toast.error((e as Error).message || 'Falha ao iniciar OAuth');
      setLoading(false);
    }
  };

  if (status?.connected) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="gap-1 text-emerald-700 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          Melhor Envio conectado ({status.environment})
        </Badge>
        <Button size="sm" variant="ghost" onClick={connect} disabled={loading}>
          Reconectar
        </Button>
      </div>
    );
  }

  return (
    <Button size="sm" variant="outline" onClick={connect} disabled={loading} className="gap-2">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plug className="h-4 w-4" />}
      Conectar Melhor Envio
    </Button>
  );
}
