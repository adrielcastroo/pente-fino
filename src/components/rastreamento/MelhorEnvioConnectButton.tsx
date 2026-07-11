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

function isPreviewOrigin() {
  const o = window.location.origin;
  return (
    o.includes('-preview--') ||
    o.includes('id-preview--') ||
    o.includes('.lovableproject.com') ||
    o.includes('.lovable.dev')
  );
}

function getRedirectUri() {
  const callbackOrigin = isPreviewOrigin() ? PUBLISHED_CALLBACK_ORIGIN : window.location.origin;
  return `${callbackOrigin}/auth/callback`;
}

/**
 * Botão / status da integração com o Melhor Envio.
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
      console.error('ME status:', (e as Error).message);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connect = async () => {
    setLoading(true);
    try {
      const redirectUri = getRedirectUri();
      const { data, error } = await supabase.functions.invoke('melhor-envio', {
        body: { action: 'authorize_url', redirect_uri: redirectUri },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      if (!data?.url) throw new Error('URL de autorização não recebida');

      const url = data.url as string;
      const embedded = isEmbeddedPreview();

      if (embedded) {
        // Abre em nova aba de nível superior para escapar do iframe do preview
        const win = window.open(url, '_blank', 'noopener,noreferrer');
        if (!win) {
          toast.error('Popup bloqueado. Permita popups ou abra o app publicado: ' + PUBLISHED_CALLBACK_ORIGIN);
        } else {
          toast.info('Abrimos o consentimento em uma nova aba. Finalize por lá.');
        }
        setLoading(false);
        return;
      }

      window.location.assign(url);
    } catch (e) {
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
