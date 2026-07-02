import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageShell, PageHeader } from '@/components/expedicao/ui';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type Carrinho = { id: string; codigo: string; status: string };
type PecaAlocada = {
  id: string;
  codigo_etiqueta: string;
  codigo_peca: string | null;
  descricao: string | null;
  alocada_at: string | null;
};

export default function AlocacaoPage() {
  const qc = useQueryClient();
  const [carrinhoCodigo, setCarrinhoCodigo] = useState('');
  const [carrinho, setCarrinho] = useState<Carrinho | null>(null);
  const [etiquetaInput, setEtiquetaInput] = useState('');
  const [saving, setSaving] = useState(false);
  const carrinhoRef = useRef<HTMLInputElement>(null);
  const etiquetaRef = useRef<HTMLInputElement>(null);

  useEffect(() => { carrinhoRef.current?.focus(); }, []);
  useEffect(() => { if (carrinho) etiquetaRef.current?.focus(); }, [carrinho]);

  const { data: pecas = [], isLoading } = useQuery({
    queryKey: ['expedicao_pecas_carrinho', carrinho?.id],
    enabled: !!carrinho,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_pecas')
        .select('id, codigo_etiqueta, codigo_peca, descricao, alocada_at')
        .eq('carrinho_id', carrinho!.id)
        .in('status', ['no_carrinho', 'conferida'])
        .order('alocada_at', { ascending: false });
      if (error) throw error;
      return data as PecaAlocada[];
    },
  });

  const abrirCarrinho = async (e: React.FormEvent) => {
    e.preventDefault();
    const cod = carrinhoCodigo.trim().toUpperCase();
    if (!cod) return;
    const { data, error } = await supabase
      .from('expedicao_carrinhos')
      .select('id, codigo, status')
      .eq('codigo', cod)
      .maybeSingle();
    if (error) return toast.error(error.message);
    if (!data) return toast.error(`Carrinho ${cod} não encontrado`);
    setCarrinho(data);
    setCarrinhoCodigo('');
    toast.success(`Carrinho ${cod} aberto`);
  };

  const fecharCarrinho = () => {
    setCarrinho(null);
    setEtiquetaInput('');
    carrinhoRef.current?.focus();
  };

  const alocar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carrinho) return;
    const codigo = etiquetaInput.trim();
    if (!codigo) return;
    setSaving(true);
    try {
      const { data: peca, error: fetchErr } = await supabase
        .from('expedicao_pecas')
        .select('id, status, carrinho_id')
        .eq('codigo_etiqueta', codigo)
        .maybeSingle();
      if (fetchErr) throw fetchErr;
      if (!peca) throw new Error(`Etiqueta ${codigo} não encontrada`);
      if (peca.status === 'cancelada') throw new Error('Etiqueta cancelada');
      if (peca.carrinho_id === carrinho.id) throw new Error('Já alocada neste carrinho');
      if (peca.status !== 'etiquetada') throw new Error(`Peça em status "${peca.status}" — não pode alocar`);

      const { data: userData } = await supabase.auth.getUser();
      const now = new Date().toISOString();
      const { error: updErr } = await supabase
        .from('expedicao_pecas')
        .update({ carrinho_id: carrinho.id, status: 'no_carrinho', alocada_at: now })
        .eq('id', peca.id);
      if (updErr) throw updErr;

      await supabase.from('expedicao_pecas_historico').insert({
        peca_id: peca.id,
        acao: 'alocada',
        carrinho_destino_id: carrinho.id,
        usuario_id: userData.user?.id ?? null,
        usuario_email: userData.user?.email ?? null,
      });

      toast.success(`${codigo} → ${carrinho.codigo}`);
      setEtiquetaInput('');
      qc.invalidateQueries({ queryKey: ['expedicao_pecas_carrinho', carrinho.id] });
      etiquetaRef.current?.focus();
    } catch (err: any) {
      toast.error(err.message ?? 'Falha ao alocar');
    } finally {
      setSaving(false);
    }
  };

  const remover = async (id: string) => {
    if (!confirm('Remover peça deste carrinho?')) return;
    const { data: userData } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('expedicao_pecas')
      .update({ carrinho_id: null, status: 'etiquetada', alocada_at: null })
      .eq('id', id);
    if (error) return toast.error(error.message);
    await supabase.from('expedicao_pecas_historico').insert({
      peca_id: id,
      acao: 'removida_carrinho',
      carrinho_origem_id: carrinho?.id ?? null,
      usuario_id: userData.user?.id ?? null,
      usuario_email: userData.user?.email ?? null,
    });
    toast.success('Peça removida');
    qc.invalidateQueries({ queryKey: ['expedicao_pecas_carrinho', carrinho?.id] });
  };

  return (
    <PageShell>
      <PageHeader
        title="Alocação em Carrinho"
        subtitle="Etapa 2 — bipe o carrinho e depois as etiquetas das peças."
      />

      {!carrinho ? (
        <form onSubmit={abrirCarrinho} className="flex gap-2 max-w-md bg-card border border-border rounded-md p-4">
          <Input
            ref={carrinhoRef}
            placeholder="Bipe o código do carrinho (ex: C001)"
            value={carrinhoCodigo}
            onChange={e => setCarrinhoCodigo(e.target.value)}
            autoComplete="off"
          />
          <Button type="submit" className="gap-2 shrink-0">
            <ShoppingCart className="w-4 h-4" /> Abrir
          </Button>
        </form>
      ) : (
        <>
          <div className="flex items-center justify-between bg-primary/10 border border-primary/30 rounded-md p-3">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-primary" />
              <div>
                <div className="text-xs text-muted-foreground">Carrinho ativo</div>
                <div className="font-semibold font-mono">{carrinho.codigo}</div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={fecharCarrinho} className="gap-1">
              <X className="w-4 h-4" /> Fechar
            </Button>
          </div>

          <form onSubmit={alocar} className="flex gap-2 max-w-md bg-card border border-border rounded-md p-4">
            <Input
              ref={etiquetaRef}
              placeholder="Bipe a etiqueta (EXP-...)"
              value={etiquetaInput}
              onChange={e => setEtiquetaInput(e.target.value)}
              autoComplete="off"
            />
            <Button type="submit" disabled={saving} className="shrink-0">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Alocar'}
            </Button>
          </form>

          <div className="bg-card border border-border rounded-md overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h2 className="text-sm font-medium">Peças no carrinho</h2>
              <span className="text-xs text-muted-foreground">{pecas.length}</span>
            </div>
            {isLoading ? (
              <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : pecas.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma peça alocada.</p>
            ) : (
              <ul className="divide-y divide-border">
                {pecas.map(p => (
                  <li key={p.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                    <span className="font-mono font-medium">{p.codigo_etiqueta}</span>
                    <span className="text-muted-foreground truncate flex-1">
                      {p.codigo_peca} {p.descricao ? `— ${p.descricao}` : ''}
                    </span>
                    <Button variant="ghost" size="icon" onClick={() => remover(p.id)} className="h-7 w-7">
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}
