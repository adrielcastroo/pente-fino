import { useState, useRef, useEffect, useMemo } from 'react';
import { ShieldCheck, Loader2, X, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { bipToast, describeError } from '@/lib/toast-flows';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageShell, PageHeader } from '@/components/expedicao/ui';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type Carrinho = { id: string; codigo: string; status: string };
type Peca = {
  id: string;
  codigo_etiqueta: string;
  codigo_peca: string | null;
  descricao: string | null;
  status: string;
  carrinho_id: string | null;
  conferida_at: string | null;
};

export default function DoubleCheckPage() {
  const qc = useQueryClient();
  const [carrinhoCodigo, setCarrinhoCodigo] = useState('');
  const [carrinho, setCarrinho] = useState<Carrinho | null>(null);
  const [etiquetaInput, setEtiquetaInput] = useState('');
  const [blockedEtiqueta, setBlockedEtiqueta] = useState<{ codigo: string; motivo: string; carrinhoCorreto?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const carrinhoRef = useRef<HTMLInputElement>(null);
  const etiquetaRef = useRef<HTMLInputElement>(null);

  useEffect(() => { carrinhoRef.current?.focus(); }, []);
  useEffect(() => { if (carrinho && !blockedEtiqueta) etiquetaRef.current?.focus(); }, [carrinho, blockedEtiqueta]);

  const { data: pecas = [], isLoading } = useQuery({
    queryKey: ['expedicao_double_check', carrinho?.id],
    enabled: !!carrinho,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_pecas')
        .select('id, codigo_etiqueta, codigo_peca, descricao, status, carrinho_id, conferida_at')
        .eq('carrinho_id', carrinho!.id)
        .in('status', ['no_carrinho', 'conferida'])
        .order('alocada_at', { ascending: true });
      if (error) throw error;
      return data as Peca[];
    },
  });

  const total = pecas.length;
  const conferidas = useMemo(() => pecas.filter(p => p.status === 'conferida').length, [pecas]);
  const tudoConferido = total > 0 && conferidas === total;

  const abrirCarrinho = async (e: React.FormEvent) => {
    e.preventDefault();
    const cod = carrinhoCodigo.trim().toUpperCase();
    if (!cod) return;
    const { data, error } = await supabase
      .from('expedicao_carrinhos')
      .select('id, codigo, status')
      .eq('codigo', cod)
      .maybeSingle();
    if (error) return bipToast.erro(error);
    if (!data) return bipToast.naoEncontrado(cod, 'na expedição');
    setCarrinho(data);
    setCarrinhoCodigo('');
  };

  const fecharCarrinho = () => {
    setCarrinho(null);
    setEtiquetaInput('');
    setBlockedEtiqueta(null);
    carrinhoRef.current?.focus();
  };

  const logConferencia = async (
    resultado: 'ok' | 'erro_outro_carrinho' | 'erro_nao_encontrada' | 'realocada',
    codigo: string,
    pecaId: string | null,
    detalhes: Record<string, any> = {},
  ) => {
    if (!carrinho) return;
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('expedicao_conferencias_itens').insert([{
      carrinho_id: carrinho.id,
      peca_id: pecaId,
      codigo_bipado: codigo,
      resultado,
      conferente_id: userData.user?.id ?? null,
      detalhes,
    }]);
  };

  const conferir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrinho || blockedEtiqueta) return;
    const codigo = etiquetaInput.trim();
    if (!codigo) return;
    setSaving(true);
    try {
      const { data: peca, error: fetchErr } = await supabase
        .from('expedicao_pecas')
        .select('id, status, carrinho_id, codigo_etiqueta')
        .eq('codigo_etiqueta', codigo)
        .maybeSingle();
      if (fetchErr) throw fetchErr;

      if (!peca) {
        await logConferencia('erro_nao_encontrada', codigo, null);
        throw new Error(`Etiqueta ${codigo} não encontrada`);
      }
      if (peca.status === 'cancelada') {
        await logConferencia('erro_nao_encontrada', codigo, peca.id, { status: 'cancelada' });
        throw new Error('Etiqueta cancelada');
      }

      // HARD BLOCK — peça em outro carrinho
      if (peca.carrinho_id && peca.carrinho_id !== carrinho.id) {
        const { data: outro } = await supabase
          .from('expedicao_carrinhos').select('codigo').eq('id', peca.carrinho_id).maybeSingle();
        await logConferencia('erro_outro_carrinho', codigo, peca.id, {
          carrinho_correto_id: peca.carrinho_id,
          carrinho_correto_codigo: outro?.codigo ?? null,
        });
        setBlockedEtiqueta({
          codigo,
          motivo: 'Peça pertence a outro carrinho',
          carrinhoCorreto: outro?.codigo ?? '???',
        });
        setEtiquetaInput('');
        return;
      }

      // HARD BLOCK — peça sem alocação
      if (!peca.carrinho_id) {
        await logConferencia('erro_nao_encontrada', codigo, peca.id, { motivo: 'sem_carrinho' });
        setBlockedEtiqueta({ codigo, motivo: 'Peça não foi alocada em nenhum carrinho' });
        setEtiquetaInput('');
        return;
      }

      if (peca.status === 'conferida') {
        toast.info('Peça já conferida');
        setEtiquetaInput('');
        etiquetaRef.current?.focus();
        return;
      }

      const { data: userData } = await supabase.auth.getUser();
      const { error: updErr } = await supabase
        .from('expedicao_pecas')
        .update({
          status: 'conferida',
          conferente_id: userData.user?.id ?? null,
          conferida_at: new Date().toISOString(),
        })
        .eq('id', peca.id);
      if (updErr) throw updErr;

      await supabase.from('expedicao_pecas_historico').insert({
        peca_id: peca.id,
        acao: 'conferida',
        carrinho_destino_id: carrinho.id,
        usuario_id: userData.user?.id ?? null,
        usuario_email: userData.user?.email ?? null,
      });

      await logConferencia('ok', codigo, peca.id);

      bipToast.ok(codigo, `Conferida no carrinho ${carrinho.codigo}.`);
      setEtiquetaInput('');
      qc.invalidateQueries({ queryKey: ['expedicao_double_check', carrinho.id] });
      etiquetaRef.current?.focus();
    } catch (err: any) {
      bipToast.erro(err);
    } finally {
      setSaving(false);
    }
  };

  const finalizarConferencia = async () => {
    if (!carrinho || !tudoConferido) return;
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('expedicao_carrinhos')
        .update({
          status: 'em_uso',
          conferido_at: new Date().toISOString(),
          conferente_id: userData.user?.id ?? null,
        })
        .eq('id', carrinho.id);
      if (error) throw error;
      toast.success(`Carrinho ${carrinho.codigo} conferido`, {
        description: 'Pronto para entrar em um romaneio.',
        duration: 3500,
      });
      fecharCarrinho();
    } catch (err: any) {
      toast.error('Não foi possível finalizar a conferência', {
        description: describeError(err, 'As leituras foram mantidas. Tente novamente.'),
        duration: 6000,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Double-Check"
        subtitle="Etapa 3 — confira cada peça do carrinho. Peças de outro carrinho são bloqueadas."
      />

      {!carrinho ? (
        <form onSubmit={abrirCarrinho} className="flex gap-2 max-w-md bg-card border border-border rounded-md p-4">
          <Input
            ref={carrinhoRef}
            placeholder="Bipe o carrinho a conferir"
            value={carrinhoCodigo}
            onChange={e => setCarrinhoCodigo(e.target.value)}
            autoComplete="off"
          />
          <Button type="submit" className="gap-2 shrink-0">
            <ShieldCheck className="w-4 h-4" /> Abrir
          </Button>
        </form>
      ) : (
        <>
          <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-md p-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Conferindo carrinho</div>
                <div className="font-semibold font-mono">{carrinho.codigo}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-sm tabular-nums">
                <span className="font-semibold text-success">{conferidas}</span>
                <span className="text-muted-foreground"> / {total}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={fecharCarrinho} className="gap-1">
                <X className="w-4 h-4" /> Sair
              </Button>
            </div>
          </div>

          {blockedEtiqueta && (
            <div className="bg-destructive/10 border-2 border-destructive rounded-md p-4 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive">Peça bloqueada</h3>
                  <p className="text-sm mt-1">
                    <span className="font-mono">{blockedEtiqueta.codigo}</span> — {blockedEtiqueta.motivo}
                    {blockedEtiqueta.carrinhoCorreto && (
                      <> (carrinho correto: <span className="font-mono font-semibold">{blockedEtiqueta.carrinhoCorreto}</span>).</>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Remova a peça fisicamente e libere para continuar a conferência.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => setBlockedEtiqueta(null)}>
                  Liberar
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={conferir} className="flex gap-2 max-w-md bg-card border border-border rounded-md p-4">
            <Input
              ref={etiquetaRef}
              placeholder="Bipe a etiqueta"
              value={etiquetaInput}
              onChange={e => setEtiquetaInput(e.target.value)}
              disabled={!!blockedEtiqueta}
              autoComplete="off"
            />
            <Button type="submit" disabled={saving || !!blockedEtiqueta} className="shrink-0">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Conferir'}
            </Button>
          </form>

          {tudoConferido && (
            <Button onClick={finalizarConferencia} disabled={saving} size="lg" className="gap-2 bg-success text-success-foreground hover:bg-success/90">
              <Check className="w-5 h-5" /> Finalizar conferência ({total} peças)
            </Button>
          )}

          <div className="bg-card border border-border rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-sm font-medium">Peças a conferir</h2>
            </div>
            {isLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : pecas.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Carrinho vazio.</p>
            ) : (
              <ul className="divide-y divide-border">
                {pecas.map(p => {
                  const ok = p.status === 'conferida';
                  return (
                    <li key={p.id} className={`px-4 py-2.5 flex items-center gap-3 text-sm ${ok ? 'bg-success/5' : ''}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        ok ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'
                      }`}>
                        {ok ? <Check className="w-3 h-3" /> : ''}
                      </span>
                      <span className="font-mono font-medium">{p.codigo_etiqueta}</span>
                      <span className="text-muted-foreground truncate flex-1">
                        {p.codigo_peca} {p.descricao ? `— ${p.descricao}` : ''}
                      </span>
                      {ok && p.conferida_at && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {new Date(p.conferida_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}
