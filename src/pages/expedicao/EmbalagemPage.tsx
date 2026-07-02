import { useState, useRef, useEffect } from 'react';
import { Tag, Loader2, Printer, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageShell, PageHeader } from '@/components/expedicao/ui';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

type PecaRecente = {
  id: string;
  codigo_etiqueta: string;
  codigo_peca: string | null;
  descricao: string | null;
  etiquetada_at: string;
  status: string;
};

function novoCodigoEtiqueta() {
  const d = new Date();
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `EXP-${yy}${mm}${dd}-${rand}`;
}

export default function EmbalagemPage() {
  const qc = useQueryClient();
  const [codigoPeca, setCodigoPeca] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const { data: recentes = [], isLoading } = useQuery({
    queryKey: ['expedicao_pecas_recentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_pecas')
        .select('id, codigo_etiqueta, codigo_peca, descricao, etiquetada_at, status')
        .order('etiquetada_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as PecaRecente[];
    },
  });

  const gerarEtiqueta = async (e: React.FormEvent) => {
    e.preventDefault();
    const peca = codigoPeca.trim();
    if (!peca) {
      toast.error('Bipe o código da peça');
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const codigo_etiqueta = novoCodigoEtiqueta();
      const { data: inserted, error } = await supabase
        .from('expedicao_pecas')
        .insert({
          codigo_etiqueta,
          codigo_peca: peca,
          descricao: descricao.trim() || null,
          embalador_id: userData.user?.id ?? null,
          status: 'etiquetada',
        })
        .select('id')
        .single();
      if (error) throw error;

      await supabase.from('expedicao_pecas_historico').insert({
        peca_id: inserted.id,
        acao: 'etiquetada',
        usuario_id: userData.user?.id ?? null,
        usuario_email: userData.user?.email ?? null,
        detalhes: { codigo_etiqueta, codigo_peca: peca },
      });

      toast.success(`Etiqueta ${codigo_etiqueta} gerada`);
      setCodigoPeca('');
      setDescricao('');
      qc.invalidateQueries({ queryKey: ['expedicao_pecas_recentes'] });
      inputRef.current?.focus();
    } catch (err: any) {
      toast.error(err.message ?? 'Falha ao gerar etiqueta');
    } finally {
      setSaving(false);
    }
  };

  const cancelar = async (id: string) => {
    if (!confirm('Cancelar esta etiqueta?')) return;
    const { error } = await supabase
      .from('expedicao_pecas')
      .update({ status: 'cancelada' })
      .eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Etiqueta cancelada');
    qc.invalidateQueries({ queryKey: ['expedicao_pecas_recentes'] });
  };

  return (
    <PageShell>
      <PageHeader
        title="Embalagem"
        subtitle="Etapa 1 — bipe a peça e gere a etiqueta única de expedição."
        icon={<Tag className="w-5 h-5" />}
      />

      <form onSubmit={gerarEtiqueta} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] max-w-3xl bg-card border border-border rounded-md p-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Código da peça *</label>
          <Input
            ref={inputRef}
            placeholder="Bipe o código"
            value={codigoPeca}
            onChange={e => setCodigoPeca(e.target.value)}
            autoComplete="off"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Descrição (opcional)</label>
          <Input
            placeholder="Ex: Cortina 3x2,5"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" disabled={saving} className="gap-2 w-full md:w-auto">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            Gerar etiqueta
          </Button>
        </div>
      </form>

      <div className="bg-card border border-border rounded-md overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-medium">Últimas etiquetas</h2>
          <span className="text-xs text-muted-foreground">{recentes.length}</span>
        </div>
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : recentes.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma etiqueta gerada ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recentes.map(p => (
              <li key={p.id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
                <span className="font-mono font-medium">{p.codigo_etiqueta}</span>
                <span className="text-muted-foreground truncate flex-1">
                  {p.codigo_peca} {p.descricao ? `— ${p.descricao}` : ''}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  p.status === 'cancelada' ? 'bg-destructive/15 text-destructive' :
                  p.status === 'etiquetada' ? 'bg-warning/15 text-warning' :
                  'bg-success/15 text-success'
                }`}>{p.status}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {new Date(p.etiquetada_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {p.status === 'etiquetada' && (
                  <Button variant="ghost" size="icon" onClick={() => cancelar(p.id)} className="h-7 w-7">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
