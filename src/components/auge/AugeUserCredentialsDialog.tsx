import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { KeyRound, Loader2, Save, Eye, EyeOff, ShieldCheck, Info } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se true, oculta o botão "Depois" — força o usuário a configurar. */
  required?: boolean;
  onSaved?: () => void;
}

/**
 * Diálogo centralizado com fundo desfocado para o usuário informar suas
 * próprias credenciais do Auge. Cada usuário só grava as suas.
 */
export default function AugeUserCredentialsDialog({ open, onOpenChange, required, onSaved }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [baseUrl, setBaseUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [hasPassword, setHasPassword] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await (supabase as any)
        .from('auge_user_credentials')
        .select('base_url,username,password')
        .eq('user_id', user.id)
        .maybeSingle();
      if (cancelled) return;
      if (error) {
        toast.error('Falha ao carregar credenciais: ' + error.message);
      } else if (data) {
        setBaseUrl(data.base_url ?? '');
        setUsername(data.username ?? '');
        setHasPassword(!!data.password);
      } else {
        setBaseUrl('');
        setUsername(user.email ?? '');
        setHasPassword(false);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, user]);

  const salvar = async () => {
    if (!user) return;
    if (!username.trim()) { toast.error('Informe o usuário.'); return; }
    if (!hasPassword && !password.length) { toast.error('Informe a senha.'); return; }
    setSaving(true);
    const payload: any = {
      user_id: user.id,
      base_url: baseUrl.trim() || null,
      username: username.trim(),
    };
    if (password.length) payload.password = password;

    const { error } = await (supabase as any)
      .from('auge_user_credentials')
      .upsert(payload, { onConflict: 'user_id' });
    setSaving(false);
    if (error) { toast.error('Erro ao salvar: ' + error.message); return; }
    toast.success('Credenciais do Auge salvas com sucesso.');
    setPassword('');
    setHasPassword(true);
    onSaved?.();
    onOpenChange(false);
  };

  const testar = async () => {
    setTesting(true);
    const t = toast.loading('Testando login no Auge com suas credenciais…');
    try {
      // Salva antes de testar (a edge function carrega da tabela pelo user_id do JWT)
      if (password.length || !hasPassword) {
        await salvarSemFechar();
      }
      const { data, error } = await supabase.functions.invoke('auge-sync?action=ping', { body: {} });
      if (error) throw error;
      if ((data as any)?.ok && (data as any)?.connected) {
        toast.success(`Conectado ao Auge (${(data as any).latency_ms}ms).`, { id: t });
      } else {
        toast.error((data as any)?.error ?? 'Falha ao conectar.', { id: t });
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro na chamada.', { id: t });
    } finally {
      setTesting(false);
    }
  };

  const salvarSemFechar = async () => {
    if (!user || !username.trim()) return;
    const payload: any = {
      user_id: user.id,
      base_url: baseUrl.trim() || null,
      username: username.trim(),
    };
    if (password.length) payload.password = password;
    const { error } = await (supabase as any)
      .from('auge_user_credentials')
      .upsert(payload, { onConflict: 'user_id' });
    if (error) throw error;
    setHasPassword(true);
    setPassword('');
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!required || hasPassword) onOpenChange(o); }}>
      <DialogContent
        className="sm:max-w-lg backdrop-blur-xl"
        onEscapeKeyDown={(e) => { if (required && !hasPassword) e.preventDefault(); }}
        onPointerDownOutside={(e) => { if (required && !hasPassword) e.preventDefault(); }}
        onInteractOutside={(e) => { if (required && !hasPassword) e.preventDefault(); }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            Configure suas credenciais do Auge
          </DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              Para realizar ações no Auge pelo Pente Fino (transferências, entradas, alterações),
              o sistema precisa das <b>suas</b> credenciais de acesso ao ERP.
            </span>
            <span className="flex items-start gap-2 rounded-md border border-border/60 bg-muted/40 p-2 text-xs text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 mt-0.5 shrink-0 text-emerald-500" />
              Suas credenciais ficam vinculadas apenas à sua conta e são usadas para autenticar
              você — e somente você — no Auge. Nenhum outro usuário tem acesso.
            </span>
            <span className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-300">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              Sem essas credenciais, as ações no Auge ficam bloqueadas para você.
            </span>
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
          </div>
        ) : (
          <div className="grid gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="auge-u-url" className="text-xs">Base URL (opcional)</Label>
              <Input
                id="auge-u-url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://unilux.auge.app"
                className="h-10 font-mono text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="auge-u-user" className="text-xs">Usuário (e-mail) *</Label>
              <Input
                id="auge-u-user"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="voce@empresa.com"
                className="h-10"
                autoComplete="off"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="auge-u-pwd" className="text-xs">
                Senha {hasPassword && <span className="text-muted-foreground font-normal">(deixe em branco para manter)</span>}
              </Label>
              <div className="relative">
                <Input
                  id="auge-u-pwd"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={hasPassword ? '••••••••' : 'Sua senha do Auge'}
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
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          {(!required || hasPassword) && (
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
              {hasPassword ? 'Fechar' : 'Depois'}
            </Button>
          )}
          <Button variant="outline" onClick={testar} disabled={testing || saving || loading} className="gap-2">
            {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
            Testar conexão
          </Button>
          <Button onClick={salvar} disabled={saving || loading} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
