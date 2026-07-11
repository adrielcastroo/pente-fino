import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

/**
 * Rota /auth/callback — recebe o `code` do OAuth do Melhor Envio,
 * envia para a Edge Function `melhor-envio` (action=callback),
 * que troca por access_token + refresh_token e persiste server-side.
 * Zero credenciais no frontend.
 */
export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<string>('Processando autorização…');

  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  useEffect(() => {
    const run = async () => {
      if (error) {
        setState('error');
        setMessage(`${error}: ${errorDescription || 'sem descrição'}`);
        return;
      }
      if (!code) {
        setState('error');
        setMessage('Nenhum código de autorização recebido.');
        return;
      }
      try {
        const redirectUri = `${window.location.origin}/auth/callback`;
        const { data, error: fnError } = await supabase.functions.invoke('melhor-envio', {
          body: { action: 'callback', code, redirect_uri: redirectUri },
        });
        if (fnError) throw new Error(fnError.message);
        if (data?.error) throw new Error(data.error);
        setState('success');
        setMessage('Melhor Envio conectado com sucesso! Redirecionando…');
        setTimeout(() => navigate('/estoque/rastreamento', { replace: true }), 1500);
      } catch (e) {
        setState('error');
        setMessage((e as Error).message || 'Falha ao trocar código por tokens.');
      }
    };
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-screen items-center justify-center bg-background p-6">
      <div className="max-w-md w-full text-center space-y-4 rounded-lg border border-border bg-card p-8 shadow-sm">
        {state === 'processing' && (
          <>
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <h1 className="text-lg font-semibold">Conectando ao Melhor Envio</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
          </>
        )}
        {state === 'success' && (
          <>
            <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-600" />
            <h1 className="text-lg font-semibold">Conectado!</h1>
            <p className="text-sm text-muted-foreground">{message}</p>
          </>
        )}
        {state === 'error' && (
          <>
            <XCircle className="h-10 w-10 mx-auto text-red-600" />
            <h1 className="text-lg font-semibold">Falha na autorização</h1>
            <p className="text-sm text-muted-foreground break-words">{message}</p>
            <Button onClick={() => navigate('/estoque/rastreamento', { replace: true })}>
              Voltar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
