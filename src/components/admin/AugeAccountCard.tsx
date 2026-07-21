import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Loader2, Save, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Creds {
  base_url: string | null;
  username: string | null;
  password: string | null;
  updated_at?: string | null;
}

export default function AugeAccountCard() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await (supabase as any)
        .from('auge_credentials')
        .select('base_url,username,password,updated_at')
        .eq('id', true)
        .maybeSingle();
      if (error) {
        toast.error('Falha ao carregar credenciais: ' + error.message);
      } else if (data) {
        const d = data as Creds;
        setBaseUrl(d.base_url ?? '');
        setUsername(d.username ?? '');
        setHasPassword(!!d.password);
        setUpdatedAt(d.updated_at ?? null);
      }
      setLoading(false);
    })();
  }, []);

  const salvar = async () => {
    if (!username.trim()) { toast.error('Informe o usuário.'); return; }
    setSaving(true);
    const { data: sess } = await supabase.auth.getUser();
    const payload: any = {
      id: true,
      base_url: baseUrl.trim() || null,
      username: username.trim(),
      updated_at: new Date().toISOString(),
      updated_by: sess.user?.id ?? null,
    };
    if (password.length) payload.password = password;

    const { error } = await (supabase as any)
      .from('auge_credentials')
      .upsert(payload, { onConflict: 'id' });
    setSaving(false);
    if (error) { toast.error('Erro ao salvar: ' + error.message); return; }
    toast.success('Credenciais salvas. Próximas execuções já usam a nova conta.');
    setPassword('');
    setHasPassword(true);
    setUpdatedAt(new Date().toISOString());
  };

  const testar = async () => {
    setTesting(true);
    const t = toast.loading('Testando login no Auge…');
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;
      const anon = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string;
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auge-sync?action=ping`;
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anon,
          Authorization: `Bearer ${token ?? anon}`,
        },
        body: '{}',
      });
      const j = await r.json();
      if (j?.ok && j?.connected) {
        toast.success(`Conectado ao Auge (${j.latency_ms}ms).`, { id: t });
      } else {
        toast.error(j?.error ?? 'Falha ao conectar.', { id: t });
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro na chamada.', { id: t });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="h-4 w-4 text-primary" /> Conta do Auge usada pelo Pente Fino
            </CardTitle>
            <CardDescription className="mt-1">
              Todas as automações (Necessidade, Transferências, Abreviações, Sincronização) usam esta
              conta. Edite abaixo — as próximas execuções já usam a nova conta, sem redeploy.
            </CardDescription>
          </div>
          {hasPassword && (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" /> Configurada
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-1.5 sm:col-span-2">
                <Label htmlFor="auge-url" className="text-xs">Base URL</Label>
                <Input
                  id="auge-url"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://unilux.auge.app"
                  className="h-10 font-mono text-sm"
                />
                <p className="text-[11px] text-muted-foreground">Deixe em branco para usar o padrão configurado no backend.</p>
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="auge-user" className="text-xs">Usuário (e-mail) *</Label>
                <Input
                  id="auge-user"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="h-10"
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="auge-pwd" className="text-xs">
                  Senha {hasPassword && <span className="text-muted-foreground font-normal">(deixe em branco para manter)</span>}
                </Label>
                <div className="relative">
                  <Input
                    id="auge-pwd"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={hasPassword ? '••••••••' : 'Nova senha'}
                    className="h-10 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showPwd ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <Button onClick={salvar} disabled={saving} className="h-10 gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar credenciais
              </Button>
              <Button variant="outline" onClick={testar} disabled={testing} className="h-10 gap-2">
                {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Testar conexão
              </Button>
              {updatedAt && (
                <span className="text-[11px] text-muted-foreground ml-auto">
                  Atualizado em {new Date(updatedAt).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
