import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageShell, PageHeader } from '@/components/compras/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ArrowLeft, Plus, Trash2, FileSpreadsheet, Save, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportRomaneioXLSX } from '@/lib/compras/starcolorRomaneioExport';
import { ComboboxCreatable } from '@/components/compras/ComboboxCreatable';

type RomaneioStatus = 'rascunho' | 'gerado' | 'enviado' | 'retornou' | 'finalizado';

interface ItemDraft {
  id?: string;
  codigo: string;
  qtd_pecas: string;
  tam_barras: string;
  peso_liq: string;
  op_id: string | null;
  op_texto: string;
}

interface OPOption {
  id: string;
  numero_op: string;
  status: string;
}

const emptyItem = (): ItemDraft => ({
  codigo: '', qtd_pecas: '', tam_barras: '', peso_liq: '', op_id: null, op_texto: '',
});

const num = (v: string): number => {
  if (!v) return 0;
  const n = Number(v.toString().replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const OP_FREE_VALUE = '__free__';

export default function RomaneioStarcolorEditorPage() {
  const { id } = useParams<{ id?: string }>();
  const isNew = !id || id === 'novo';
  const nav = useNavigate();
  const qc = useQueryClient();

  const [numero, setNumero] = useState('');
  const [numeroNf, setNumeroNf] = useState('');
  const [cor, setCor] = useState('');
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().slice(0, 10));
  const [servicoAdicional, setServicoAdicional] = useState('');
  const [acabamento, setAcabamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [status, setStatus] = useState<RomaneioStatus>('rascunho');
  const [itens, setItens] = useState<ItemDraft[]>([emptyItem()]);

  // OPs disponíveis para vincular
  const opsQ = useQuery({
    queryKey: ['compras', 'starcolor', 'ops', 'options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras_starcolor_ops')
        .select('id, numero_op, status')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as OPOption[];
    },
  });

  // Sugestões de cor (inclui valores antigos de acabamento — são a mesma coisa)
  const sugestoesQ = useQuery({
    queryKey: ['compras', 'starcolor', 'romaneios', 'sugestoes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('compras_starcolor_romaneios')
        .select('cor, acabamento');
      if (error) throw error;
      const cores = new Set<string>();
      for (const r of (data ?? []) as any[]) {
        if (r.cor?.trim()) cores.add(r.cor.trim());
        if (r.acabamento?.trim()) cores.add(r.acabamento.trim());
      }
      return { cores: [...cores] };
    },
    staleTime: 60_000,
  });

  // Carregar romaneio existente
  const romQ = useQuery({
    queryKey: ['compras', 'starcolor', 'romaneio', id],
    queryFn: async () => {
      const { data: rom, error: e1 } = await supabase
        .from('compras_starcolor_romaneios')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (e1) throw e1;
      const { data: its, error: e2 } = await supabase
        .from('compras_starcolor_romaneio_itens')
        .select('*')
        .eq('romaneio_id', id!)
        .order('ordem');
      if (e2) throw e2;
      return { rom: rom as any, itens: (its ?? []) as any[] };
    },
    enabled: !isNew,
  });

  useEffect(() => {
    if (!romQ.data?.rom) return;
    const r = romQ.data.rom;
    setNumero(r.numero ?? '');
    setNumeroNf(r.numero_nf ?? '');
    setCor(r.cor ?? '');
    setDataEmissao(r.data_emissao ?? new Date().toISOString().slice(0, 10));
    setServicoAdicional(r.servico_adicional ?? '');
    setAcabamento(r.acabamento ?? '');
    setObservacoes(r.observacoes ?? '');
    setStatus((r.status ?? 'rascunho') as RomaneioStatus);
    setItens(
      (romQ.data.itens ?? []).map((it: any) => ({
        id: it.id,
        codigo: it.codigo ?? '',
        qtd_pecas: it.qtd_pecas != null ? String(it.qtd_pecas) : '',
        tam_barras: it.tam_barras != null ? String(it.tam_barras) : '',
        peso_liq: it.peso_liq != null ? String(it.peso_liq) : '',
        op_id: it.op_id ?? null,
        op_texto: it.op_texto ?? '',
      })),
    );
    if ((romQ.data.itens ?? []).length === 0) setItens([emptyItem()]);
  }, [romQ.data]);

  // Cálculos derivados
  const totals = useMemo(() => {
    let peso = 0, metro = 0;
    for (const it of itens) {
      const q = num(it.qtd_pecas);
      const t = num(it.tam_barras);
      const p = num(it.peso_liq);
      metro += q * t;
      peso += p;
    }
    const fator = peso > 0 ? metro / peso : 0;
    return { peso, metro, fator };
  }, [itens]);

  const patchItem = (idx: number, patch: Partial<ItemDraft>) =>
    setItens(prev => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeItem = (idx: number) =>
    setItens(prev => (prev.length <= 1 ? [emptyItem()] : prev.filter((_, i) => i !== idx)));
  const addItem = () => setItens(prev => [...prev, emptyItem()]);

  const opById = useMemo(() => {
    const m = new Map<string, OPOption>();
    for (const o of opsQ.data ?? []) m.set(o.id, o);
    return m;
  }, [opsQ.data]);

  const validate = (): string | null => {
    if (!numeroNf.trim()) return 'Nº da NF é obrigatório.';
    if (!cor.trim()) return 'Cor é obrigatória.';
    if (!numero.trim()) return 'Nº do romaneio é obrigatório.';
    return null;
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const err = validate();
      if (err) throw new Error(err);

      const payload = {
        numero: numero.trim(),
        numero_nf: numeroNf.trim(),
        cor: cor.trim(),
        data_emissao: dataEmissao,
        servico_adicional: servicoAdicional.trim() || null,
        acabamento: acabamento.trim() || null,
        observacoes: observacoes.trim() || null,
        status,
      };

      let romaneioId = id;
      if (isNew) {
        const { data, error } = await supabase
          .from('compras_starcolor_romaneios')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        romaneioId = (data as any).id;
      } else {
        const { error } = await supabase
          .from('compras_starcolor_romaneios')
          .update(payload)
          .eq('id', id!);
        if (error) throw error;
      }

      // Substituir itens (simples e confiável neste tamanho)
      await supabase
        .from('compras_starcolor_romaneio_itens')
        .delete()
        .eq('romaneio_id', romaneioId!);

      const rows = itens
        .filter(it => it.codigo.trim() || it.qtd_pecas || it.tam_barras || it.peso_liq || it.op_texto || it.op_id)
        .map((it, idx) => ({
          romaneio_id: romaneioId!,
          ordem: idx + 1,
          codigo: it.codigo.trim() || null,
          qtd_pecas: it.qtd_pecas ? num(it.qtd_pecas) : null,
          tam_barras: it.tam_barras ? num(it.tam_barras) : null,
          peso_liq: it.peso_liq ? num(it.peso_liq) : null,
          op_id: it.op_id,
          op_texto: it.op_id ? null : (it.op_texto.trim() || null),
        }));
      if (rows.length) {
        const { error } = await supabase
          .from('compras_starcolor_romaneio_itens')
          .insert(rows);
        if (error) throw error;
      }
      return romaneioId!;
    },
    onSuccess: (rid) => {
      qc.invalidateQueries({ queryKey: ['compras', 'starcolor', 'romaneios'] });
      qc.invalidateQueries({ queryKey: ['compras', 'starcolor', 'romaneio_itens'] });
      toast.success('Romaneio salvo');
      if (isNew) nav(`/compras/acompanhamentos/starcolor/romaneios/${rid}`, { replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleExport = () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    exportRomaneioXLSX({
      numero, numero_nf: numeroNf, cor, data_emissao: dataEmissao,
      servico_adicional: servicoAdicional, acabamento, observacoes,
      itens: itens.map(it => ({
        codigo: it.codigo || null,
        qtd_pecas: num(it.qtd_pecas) || null,
        tam_barras: num(it.tam_barras) || null,
        peso_liq: num(it.peso_liq) || null,
        op: it.op_id ? (opById.get(it.op_id)?.numero_op ?? '') : it.op_texto,
      })),
    });
  };

  return (
    <PageShell>
      <PageHeader
        title={isNew ? 'Novo Romaneio Starcolor' : `Editar Romaneio ${numero || ''}`}
        subtitle="Um romaneio por cor. NFs com múltiplas cores ficam agrupadas pelo mesmo Nº NF."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => nav('/compras/acompanhamentos/starcolor/romaneios')}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <FileSpreadsheet className="w-4 h-4 mr-1" /> Exportar XLSX
            </Button>
            <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Salvar
            </Button>
          </div>
        }
      />

      {/* Cabeçalho */}
      <div className="rounded-lg border border-border bg-card p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <Label>Nº do Romaneio *</Label>
          <Input value={numero} onChange={e => setNumero(e.target.value)} placeholder="ex.: ROM-0001" />
        </div>
        <div>
          <Label>Nº da NF *</Label>
          <Input value={numeroNf} onChange={e => setNumeroNf(e.target.value)} placeholder="ex.: 17941" />
        </div>
        <div>
          <Label>Cor *</Label>
          <ComboboxCreatable
            value={cor}
            onChange={setCor}
            options={sugestoesQ.data?.cores ?? []}
            placeholder="Selecione ou digite a cor…"
          />
        </div>
        <div>
          <Label>Data de emissão</Label>
          <Input type="date" value={dataEmissao} onChange={e => setDataEmissao(e.target.value)} />
        </div>

        <div className="md:col-span-2">
          <Label>Serviço adicional</Label>
          <Input value={servicoAdicional} onChange={e => setServicoAdicional(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Acabamento</Label>
          <ComboboxCreatable
            value={acabamento}
            onChange={setAcabamento}
            options={sugestoesQ.data?.acabamentos ?? []}
            placeholder="Selecione ou digite o acabamento…"
          />
        </div>

        <div className="md:col-span-3">
          <Label>Observações</Label>
          <Textarea rows={2} value={observacoes} onChange={e => setObservacoes(e.target.value)} />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={status} onValueChange={v => setStatus(v as RomaneioStatus)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rascunho">Rascunho</SelectItem>
              <SelectItem value="gerado">Gerado</SelectItem>
              <SelectItem value="enviado">Enviado</SelectItem>
              <SelectItem value="retornou">Retornou</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Peso Líq. Total</div>
          <div className="text-lg font-semibold tabular-nums">{totals.peso.toFixed(2)} <span className="text-xs text-muted-foreground">kg</span></div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Metragem Total</div>
          <div className="text-lg font-semibold tabular-nums">{totals.metro.toFixed(2)} <span className="text-xs text-muted-foreground">m</span></div>
        </div>
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Fator (M/KG)</div>
          <div className="text-lg font-semibold tabular-nums">{totals.fator ? totals.fator.toFixed(3) : '—'}</div>
        </div>
      </div>

      {/* Itens */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border/60">
          <div className="text-sm font-semibold">Itens</div>
          <Button size="sm" variant="outline" onClick={addItem}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar linha
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-3 py-2 w-8">#</th>
                <th className="text-left px-2 py-2">Código</th>
                <th className="text-right px-2 py-2 w-24">Qtd. Peças</th>
                <th className="text-right px-2 py-2 w-24">Tam. Barras</th>
                <th className="text-right px-2 py-2 w-24">Peso Liq.</th>
                <th className="text-right px-2 py-2 w-24">Metro</th>
                <th className="text-right px-2 py-2 w-24">Fator</th>
                <th className="text-left px-2 py-2 w-56">OP</th>
                <th className="w-10" />
              </tr>
            </thead>
            <tbody>
              {itens.map((it, idx) => {
                const q = num(it.qtd_pecas), t = num(it.tam_barras), p = num(it.peso_liq);
                const metro = q * t;
                const fator = p > 0 ? metro / p : 0;
                return (
                  <tr key={idx} className="border-t border-border/60">
                    <td className="px-3 py-1.5 text-muted-foreground tabular-nums">{idx + 1}</td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="h-8"
                        value={it.codigo}
                        onChange={e => patchItem(idx, { codigo: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="h-8 text-right tabular-nums"
                        inputMode="decimal"
                        value={it.qtd_pecas}
                        onChange={e => patchItem(idx, { qtd_pecas: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="h-8 text-right tabular-nums"
                        inputMode="decimal"
                        value={it.tam_barras}
                        onChange={e => patchItem(idx, { tam_barras: e.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <Input
                        className="h-8 text-right tabular-nums"
                        inputMode="decimal"
                        value={it.peso_liq}
                        onChange={e => patchItem(idx, { peso_liq: e.target.value })}
                      />
                    </td>
                    <td className={cn('px-2 py-1.5 text-right tabular-nums text-muted-foreground', metro > 0 && 'text-foreground')}>
                      {metro > 0 ? metro.toFixed(2) : '—'}
                    </td>
                    <td className={cn('px-2 py-1.5 text-right tabular-nums text-muted-foreground', fator > 0 && 'text-foreground')}>
                      {fator > 0 ? fator.toFixed(3) : '—'}
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex gap-1">
                        <Select
                          value={it.op_id ?? OP_FREE_VALUE}
                          onValueChange={v => patchItem(idx, { op_id: v === OP_FREE_VALUE ? null : v })}
                        >
                          <SelectTrigger className="h-8 w-32"><SelectValue placeholder="OP..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value={OP_FREE_VALUE}>Livre…</SelectItem>
                            {(opsQ.data ?? []).map(o => (
                              <SelectItem key={o.id} value={o.id}>{o.numero_op}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!it.op_id && (
                          <Input
                            className="h-8 flex-1"
                            placeholder="Digitar OP"
                            value={it.op_texto}
                            onChange={e => patchItem(idx, { op_texto: e.target.value })}
                          />
                        )}
                        {it.op_id && (
                          <Badge variant="secondary" className="h-8 self-center px-2 text-[11px]">
                            {opById.get(it.op_id)?.numero_op ?? '—'}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeItem(idx)}
                        aria-label="Remover linha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </PageShell>
  );
}
