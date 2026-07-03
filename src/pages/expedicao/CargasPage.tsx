import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Plus, Truck, PackageCheck, MapPin, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageShell, PageHeader, StatCard } from '@/components/expedicao/ui';
import { StatusBadge } from '@/components/ui/status-badge';
import { CargaDetailDialog } from '@/components/expedicao/CargaDetailDialog';

type CargaStatus = 'planejada' | 'em_transito' | 'entregue' | 'cancelada';

type Carga = {
  id: string;
  numero: string;
  status: CargaStatus;
  data_coleta: string | null;
  motorista_nome: string | null;
  rota: string | null;
  custo_frete: number | null;
  codigo_rastreio: string | null;
  transportadora_tipo: string | null;
  veiculo_id: string | null;
  created_at: string;
};

type Veiculo = { id: string; placa: string; modelo: string | null; ativo: boolean };
type RomaneioLivre = { id: string; numero: string; status: string; created_at: string };

function gerarNumeroCarga(): string {
  const d = new Date();
  const ymd = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `CRG-${ymd}-${rand}`;
}

const STATUS_LABELS: Record<CargaStatus, string> = {
  planejada: 'Planejada',
  em_transito: 'Em trânsito',
  entregue: 'Entregue',
  cancelada: 'Cancelada',
};

const STATUS_VARIANT: Record<CargaStatus, 'default' | 'success' | 'warning' | 'destructive'> = {
  planejada: 'default',
  em_transito: 'warning',
  entregue: 'success',
  cancelada: 'destructive',
};

export default function CargasPage() {
  const qc = useQueryClient();
  const [openNew, setOpenNew] = useState(false);
  const [openVeiculos, setOpenVeiculos] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data: cargas = [], isLoading } = useQuery({
    queryKey: ['expedicao_cargas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_cargas')
        .select('id, numero, status, data_coleta, motorista_nome, rota, custo_frete, codigo_rastreio, transportadora_tipo, veiculo_id, created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as Carga[];
    },
    refetchInterval: 20_000,
  });

  const stats = useMemo(() => ({
    total: cargas.length,
    planejadas: cargas.filter(c => c.status === 'planejada').length,
    emTransito: cargas.filter(c => c.status === 'em_transito').length,
    entregues: cargas.filter(c => c.status === 'entregue').length,
  }), [cargas]);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CargaStatus }) => {
      const { error } = await supabase.from('expedicao_cargas').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expedicao_cargas'] });
      toast.success('Status atualizado');
    },
    onError: e => toast.error((e as Error).message),
  });

  return (
    <PageShell>
      <PageHeader
        title="Cargas"
        subtitle="Planejamento e rastreio de cargas (TMS interno)."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setOpenVeiculos(true)} className="gap-2">
              <Truck className="w-4 h-4" /> Veículos
            </Button>
            <Button onClick={() => setOpenNew(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Nova carga
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} icon={PackageCheck} />
        <StatCard label="Planejadas" value={stats.planejadas} />
        <StatCard label="Em trânsito" value={stats.emTransito} variant="warning" />
        <StatCard label="Entregues" value={stats.entregues} variant="success" />
      </div>

      <div className="bg-card border border-border rounded-md overflow-hidden">
        {isLoading ? (
          <div className="p-12 flex items-center justify-center text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : cargas.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">
            Nenhuma carga cadastrada. Clique em "Nova carga" para começar.
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="md:hidden divide-y divide-border">
              {cargas.map(c => (
                <li
                  key={c.id}
                  className="p-3 flex flex-col gap-2 min-h-[64px] cursor-pointer hover:bg-muted/40"
                  onClick={() => setDetailId(c.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{c.numero}</span>
                    <Select
                      value={c.status}
                      onValueChange={v => updateStatus.mutate({ id: c.id, status: v as CargaStatus })}
                    >
                      <SelectTrigger className="h-8 w-32 text-xs" onClick={e => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(STATUS_LABELS) as CargaStatus[]).map(s => (
                          <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {c.motorista_nome && <span>{c.motorista_nome}</span>}
                    {c.rota && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.rota}</span>}
                    {c.data_coleta && <span>Coleta: {c.data_coleta}</span>}
                    {c.codigo_rastreio && <span className="font-mono">{c.codigo_rastreio}</span>}
                    {c.custo_frete && <span className="ml-auto tabular-nums font-medium text-foreground">R$ {Number(c.custo_frete).toFixed(2)}</span>}
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: tabela */}
            <Table className="hidden md:table">
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Coleta</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Rota</TableHead>
                  <TableHead>Rastreio</TableHead>
                  <TableHead className="text-right">Frete (R$)</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {cargas.map(c => (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => setDetailId(c.id)}
                  >
                    <TableCell className="font-mono text-xs">{c.numero}</TableCell>
                    <TableCell>
                      <Select
                        value={c.status}
                        onValueChange={v => updateStatus.mutate({ id: c.id, status: v as CargaStatus })}
                      >
                        <SelectTrigger className="h-7 w-32 text-xs" onClick={e => e.stopPropagation()}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(STATUS_LABELS) as CargaStatus[]).map(s => (
                            <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs">{c.data_coleta ?? '—'}</TableCell>
                    <TableCell className="text-xs">{c.motorista_nome ?? '—'}</TableCell>
                    <TableCell className="text-xs flex items-center gap-1">
                      {c.rota ? <><MapPin className="w-3 h-3" />{c.rota}</> : '—'}
                    </TableCell>
                    <TableCell className="text-xs font-mono">{c.codigo_rastreio ?? '—'}</TableCell>
                    <TableCell className="text-right text-xs">
                      {c.custo_frete ? Number(c.custo_frete).toFixed(2) : '—'}
                    </TableCell>
                    <TableCell><ChevronRight className="w-4 h-4 text-muted-foreground" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
      </div>

      <NovaCargaDialog open={openNew} onOpenChange={setOpenNew} />
      <VeiculosDialog open={openVeiculos} onOpenChange={setOpenVeiculos} />
      {detailId && (
        <CargaDetailDialog
          cargaId={detailId}
          open={!!detailId}
          onOpenChange={o => !o && setDetailId(null)}
        />
      )}
    </PageShell>
  );
}

/* ─────────── Nova Carga ─────────── */
function NovaCargaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [veiculoId, setVeiculoId] = useState<string>('');
  const [motorista, setMotorista] = useState('');
  const [motoristaDoc, setMotoristaDoc] = useState('');
  const [dataColeta, setDataColeta] = useState(new Date().toISOString().slice(0, 10));
  const [rota, setRota] = useState('');
  const [custoFrete, setCustoFrete] = useState('');
  const [codigoRastreio, setCodigoRastreio] = useState('');
  const [transportadoraTipo, setTransportadoraTipo] = useState<string>('');
  const [observacao, setObservacao] = useState('');
  const [selectedRoms, setSelectedRoms] = useState<Set<string>>(new Set());

  const { data: veiculos = [] } = useQuery({
    queryKey: ['expedicao_veiculos_ativos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_veiculos')
        .select('id, placa, modelo, ativo')
        .eq('ativo', true)
        .order('placa');
      if (error) throw error;
      return (data ?? []) as Veiculo[];
    },
    enabled: open,
  });

  const { data: romaneiosLivres = [] } = useQuery({
    queryKey: ['expedicao_romaneios_sem_carga'],
    queryFn: async () => {
      const { data: roms, error } = await supabase
        .from('expedicao_romaneios')
        .select('id, numero, status, created_at')
        .in('status', ['aberto', 'faturado'])
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      if (!roms?.length) return [] as RomaneioLivre[];
      const { data: usados } = await supabase
        .from('expedicao_carga_romaneios')
        .select('romaneio_id')
        .in('romaneio_id', roms.map(r => r.id));
      const usadosSet = new Set((usados ?? []).map(u => u.romaneio_id));
      return roms.filter(r => !usadosSet.has(r.id)) as RomaneioLivre[];
    },
    enabled: open,
  });

  const create = useMutation({
    mutationFn: async () => {
      const numero = gerarNumeroCarga();
      const { data: user } = await supabase.auth.getUser();
      const { data: carga, error } = await supabase
        .from('expedicao_cargas')
        .insert({
          numero,
          veiculo_id: veiculoId || null,
          motorista_nome: motorista.trim() || null,
          motorista_doc: motoristaDoc.trim() || null,
          data_coleta: dataColeta || null,
          rota: rota.trim() || null,
          custo_frete: custoFrete ? Number(custoFrete) : 0,
          codigo_rastreio: codigoRastreio.trim() || null,
          transportadora_tipo: transportadoraTipo || null,
          observacao: observacao.trim() || null,
          criado_por: user.user?.id ?? null,
        })
        .select('id')
        .single();
      if (error) throw error;
      if (selectedRoms.size > 0) {
        const rows = Array.from(selectedRoms).map(rid => ({ carga_id: carga.id, romaneio_id: rid }));
        const { error: e2 } = await supabase.from('expedicao_carga_romaneios').insert(rows);
        if (e2) throw e2;
      }
      return carga.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expedicao_cargas'] });
      qc.invalidateQueries({ queryKey: ['expedicao_romaneios_sem_carga'] });
      toast.success('Carga criada');
      onOpenChange(false);
      setVeiculoId(''); setMotorista(''); setMotoristaDoc(''); setRota('');
      setCustoFrete(''); setCodigoRastreio(''); setTransportadoraTipo(''); setObservacao('');
      setSelectedRoms(new Set());
    },
    onError: e => toast.error((e as Error).message),
  });

  const toggleRom = (id: string) => {
    setSelectedRoms(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Nova carga</DialogTitle></DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label>Veículo</Label>
            <Select value={veiculoId} onValueChange={setVeiculoId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {veiculos.map(v => (
                  <SelectItem key={v.id} value={v.id}>{v.placa} {v.modelo ? `— ${v.modelo}` : ''}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Data da coleta</Label>
            <Input type="date" value={dataColeta} onChange={e => setDataColeta(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Motorista</Label>
            <Input value={motorista} onChange={e => setMotorista(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>CNH / Doc</Label>
            <Input value={motoristaDoc} onChange={e => setMotoristaDoc(e.target.value)} />
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Rota / Destino</Label>
            <Input value={rota} onChange={e => setRota(e.target.value)} placeholder="ex: SP → RJ → MG" />
          </div>
          <div className="space-y-1">
            <Label>Frete (R$)</Label>
            <Input type="number" step="0.01" value={custoFrete} onChange={e => setCustoFrete(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Transportadora (rastreio)</Label>
            <Select value={transportadoraTipo} onValueChange={setTransportadoraTipo}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="correios">Correios</SelectItem>
                <SelectItem value="jadlog">Jadlog</SelectItem>
                <SelectItem value="total">Total Express</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Código de rastreio</Label>
            <Input value={codigoRastreio} onChange={e => setCodigoRastreio(e.target.value)} placeholder="ex: BR123456789XX" />
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Observação</Label>
            <Textarea rows={2} value={observacao} onChange={e => setObservacao(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Romaneios ({selectedRoms.size} selecionado(s))</Label>
          <div className="border border-border rounded-md max-h-52 overflow-y-auto">
            {romaneiosLivres.length === 0 ? (
              <div className="p-4 text-xs text-muted-foreground text-center">
                Nenhum romaneio disponível.
              </div>
            ) : romaneiosLivres.map(r => (
              <label
                key={r.id}
                className="flex items-center gap-3 p-2 border-b border-border last:border-0 cursor-pointer hover:bg-muted/40 text-xs"
              >
                <Checkbox
                  checked={selectedRoms.has(r.id)}
                  onCheckedChange={() => toggleRom(r.id)}
                />
                <span className="font-mono">{r.numero}</span>
                <StatusBadge label={r.status} tone={r.status === 'faturado' ? 'success' : 'neutral'} />
                <span className="text-muted-foreground ml-auto">
                  {new Date(r.created_at).toLocaleDateString('pt-BR')}
                </span>
              </label>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => create.mutate()} disabled={create.isPending}>
            {create.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Criar carga
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────── Veículos ─────────── */
function VeiculosDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient();
  const [placa, setPlaca] = useState('');
  const [modelo, setModelo] = useState('');
  const [capacidade, setCapacidade] = useState('');

  const { data: veiculos = [] } = useQuery({
    queryKey: ['expedicao_veiculos_all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_veiculos')
        .select('id, placa, modelo, capacidade_kg, ativo')
        .order('placa');
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('expedicao_veiculos').insert({
        placa: placa.trim().toUpperCase(),
        modelo: modelo.trim() || null,
        capacidade_kg: capacidade ? Number(capacidade) : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expedicao_veiculos_all'] });
      qc.invalidateQueries({ queryKey: ['expedicao_veiculos_ativos'] });
      toast.success('Veículo cadastrado');
      setPlaca(''); setModelo(''); setCapacidade('');
    },
    onError: e => toast.error((e as Error).message),
  });

  const toggleAtivo = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from('expedicao_veiculos').update({ ativo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['expedicao_veiculos_all'] }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader><DialogTitle>Veículos</DialogTitle></DialogHeader>

        <div className="grid grid-cols-4 gap-2">
          <Input placeholder="Placa" value={placa} onChange={e => setPlaca(e.target.value)} className="col-span-1" />
          <Input placeholder="Modelo" value={modelo} onChange={e => setModelo(e.target.value)} className="col-span-2" />
          <Input placeholder="kg" type="number" value={capacidade} onChange={e => setCapacidade(e.target.value)} />
        </div>
        <Button onClick={() => create.mutate()} disabled={create.isPending || !placa.trim()} className="gap-2">
          <Plus className="w-4 h-4" /> Adicionar veículo
        </Button>

        <div className="border border-border rounded-md max-h-64 overflow-y-auto">
          {veiculos.length === 0 ? (
            <div className="p-4 text-xs text-muted-foreground text-center">Nenhum veículo.</div>
          ) : veiculos.map((v: any) => (
            <div key={v.id} className="flex items-center gap-3 p-2 border-b border-border last:border-0 text-xs">
              <span className="font-mono font-semibold">{v.placa}</span>
              <span className="text-muted-foreground flex-1">{v.modelo ?? '—'}</span>
              <span className="text-muted-foreground">{v.capacidade_kg ? `${v.capacidade_kg} kg` : ''}</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={v.ativo}
                  onCheckedChange={c => toggleAtivo.mutate({ id: v.id, ativo: !!c })}
                />
                Ativo
              </label>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
