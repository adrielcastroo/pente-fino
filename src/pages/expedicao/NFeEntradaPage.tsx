import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Inbox,
  Loader2,
  RefreshCw,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  FileText,
  Plus,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageShell, PageHeader, StatCard } from '@/components/expedicao/ui';
import { StatusBadge } from '@/components/ui/status-badge';
import { parseNFeXML } from '@/lib/nfe-parser';

const BUCKET = 'nfe-arquivos';

type Situacao = 'pendente' | 'ciencia' | 'confirmada' | 'desconhecida' | 'nao_realizada';

interface NFeEntrada {
  id: string;
  chave_acesso: string;
  numero: string | null;
  serie: string | null;
  nome_emitente: string | null;
  cnpj_emitente: string | null;
  data_emissao: string | null;
  valor_total: number | null;
  situacao_manifestacao: Situacao;
  manifestada_at: string | null;
  protocolo_manifestacao: string | null;
  xml_path: string | null;
  danfe_path: string | null;
  nsu: string | null;
  created_at: string;
}

const SITUACAO_LABEL: Record<Situacao, string> = {
  pendente: 'Pendente',
  ciencia: 'Ciência',
  confirmada: 'Confirmada',
  desconhecida: 'Desconhecida',
  nao_realizada: 'Não realizada',
};

const SITUACAO_TONE: Record<Situacao, 'info' | 'warning' | 'success' | 'danger'> = {
  pendente: 'warning',
  ciencia: 'info',
  confirmada: 'success',
  desconhecida: 'warning',
  nao_realizada: 'danger',
};

export default function NFeEntradaPage() {
  const qc = useQueryClient();
  const [importOpen, setImportOpen] = useState(false);

  const { data: notas = [], isLoading } = useQuery({
    queryKey: ['nfe-entrada'],
    queryFn: async (): Promise<NFeEntrada[]> => {
      const { data, error } = await (supabase as any)
        .from('nfe_entrada')
        .select('id, chave_acesso, numero, serie, nome_emitente, cnpj_emitente, data_emissao, valor_total, situacao_manifestacao, manifestada_at, protocolo_manifestacao, xml_path, danfe_path, nsu, created_at')
        .order('data_emissao', { ascending: false, nullsFirst: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as NFeEntrada[];
    },
    staleTime: 15_000,
  });

  const stats = useMemo(() => {
    const total = notas.length;
    const pendentes = notas.filter((n) => n.situacao_manifestacao === 'pendente').length;
    const confirmadas = notas.filter((n) => n.situacao_manifestacao === 'confirmada').length;
    const valor = notas.reduce((s, n) => s + (n.valor_total ?? 0), 0);
    return { total, pendentes, confirmadas, valor };
  }, [notas]);

  const consultarDFe = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('nfe-dfe', {
        body: { action: 'consultar-dfe' },
      });
      if (error) throw error;
      return data as { ok?: boolean; needs_cert?: boolean; message?: string };
    },
    onSuccess: (r) => {
      if (r?.needs_cert) toast.warning(r.message ?? 'Certificado A1 necessário.');
      else if (r?.ok) toast.success('DFe consultado.');
      else toast.info(r?.message ?? 'Sem novidades da SEFAZ.');
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Falha na consulta.'),
  });

  const manifestar = useMutation({
    mutationFn: async ({ id, tipo }: { id: string; tipo: Situacao }) => {
      // Tentar via edge (SEFAZ real); se sem cert, marca localmente.
      const nota = notas.find((n) => n.id === id);
      const res = await supabase.functions.invoke('nfe-dfe', {
        body: { action: 'manifestar', nfeEntradaId: id, tipoEvento: tipo },
      });
      const remote = res.data as { ok?: boolean; needs_cert?: boolean; message?: string } | null;
      const manual = !remote?.ok;

      const uid = (await supabase.auth.getUser()).data.user?.id ?? null;
      const { error } = await (supabase as any)
        .from('nfe_entrada')
        .update({
          situacao_manifestacao: tipo,
          manifestada_at: new Date().toISOString(),
          manifestada_por: uid,
        })
        .eq('id', id);
      if (error) throw error;

      await (supabase as any).from('nfe_entrada_eventos').insert({
        nfe_entrada_id: id,
        tipo: `manifestacao:${tipo}`,
        detalhes: { manual, chave: nota?.chave_acesso, remote_message: remote?.message ?? null },
        user_id: uid,
      });
      return { tipo, manual };
    },
    onSuccess: (r) => {
      toast.success(`Manifestação ${SITUACAO_LABEL[r.tipo]}${r.manual ? ' (registro manual)' : ''}`);
      qc.invalidateQueries({ queryKey: ['nfe-entrada'] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Falha ao manifestar.'),
  });

  return (
    <PageShell>
      <PageHeader
        title="NF-e Entrada"
        subtitle="Distribuição DFe da SEFAZ e Manifestação do Destinatário."
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => consultarDFe.mutate()} disabled={consultarDFe.isPending}>
              {consultarDFe.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Consultar DFe
            </Button>
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" /> Nova entrada
                </Button>
              </DialogTrigger>
              <ImportEntradaDialog onDone={() => { setImportOpen(false); qc.invalidateQueries({ queryKey: ['nfe-entrada'] }); }} />
            </Dialog>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} icon={Inbox} />
        <StatCard label="Pendentes" value={stats.pendentes} icon={AlertCircle} />
        <StatCard label="Confirmadas" value={stats.confirmadas} icon={CheckCircle2} />
        <StatCard label="Valor total" value={stats.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={FileText} />
      </div>

      <section className="bg-card border border-border rounded-md">
        <header className="px-4 py-3 border-b border-border">
          <h2 className="text-sm font-medium">Notas recebidas</h2>
        </header>
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : notas.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma NF-e de entrada registrada.</p>
        ) : (
          <ul className="divide-y divide-border">
            {notas.map((n) => (
              <NotaRow key={n.id} nota={n} onManifestar={(tipo) => manifestar.mutate({ id: n.id, tipo })} busy={manifestar.isPending} />
            ))}
          </ul>
        )}
      </section>
    </PageShell>
  );
}

function NotaRow({
  nota,
  onManifestar,
  busy,
}: {
  nota: NFeEntrada;
  onManifestar: (tipo: Situacao) => void;
  busy: boolean;
}) {
  const [tipo, setTipo] = useState<Situacao>('ciencia');
  const baixar = async (path: string | null) => {
    if (!path) return;
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  return (
    <li className="p-4 space-y-2">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="font-mono font-medium">NF {nota.numero ?? '—'}/{nota.serie ?? '—'}</span>
        <StatusBadge tone={SITUACAO_TONE[nota.situacao_manifestacao]} label={SITUACAO_LABEL[nota.situacao_manifestacao]} />
        <span className="text-muted-foreground truncate">{nota.nome_emitente ?? '—'}</span>
        <span className="ml-auto tabular-nums text-muted-foreground">
          {(nota.valor_total ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      </div>
      <p className="font-mono text-[11px] text-muted-foreground break-all">{nota.chave_acesso}</p>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Select value={tipo} onValueChange={(v) => setTipo(v as Situacao)}>
          <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ciencia">Ciência da operação</SelectItem>
            <SelectItem value="confirmada">Confirmação da operação</SelectItem>
            <SelectItem value="desconhecida">Desconhecimento</SelectItem>
            <SelectItem value="nao_realizada">Operação não realizada</SelectItem>
          </SelectContent>
        </Select>
        <Button size="sm" variant="outline" onClick={() => onManifestar(tipo)} disabled={busy}>
          Manifestar
        </Button>
        {nota.xml_path && (
          <Button size="sm" variant="ghost" onClick={() => baixar(nota.xml_path)} className="gap-1">
            <Download className="w-3.5 h-3.5" /> XML
          </Button>
        )}
        {nota.danfe_path && (
          <Button size="sm" variant="ghost" onClick={() => baixar(nota.danfe_path)} className="gap-1">
            <Download className="w-3.5 h-3.5" /> DANFE
          </Button>
        )}
        {nota.manifestada_at && (
          <span className="ml-auto text-[11px] text-muted-foreground">
            {new Date(nota.manifestada_at).toLocaleString('pt-BR')}
          </span>
        )}
      </div>
    </li>
  );
}

function ImportEntradaDialog({ onDone }: { onDone: () => void }) {
  const [chave, setChave] = useState('');
  const [numero, setNumero] = useState('');
  const [emitente, setEmitente] = useState('');
  const [valor, setValor] = useState('');
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const handleXml = async (file: File) => {
    setXmlFile(file);
    try {
      const text = await file.text();
      const nfe = parseNFeXML(text);
      setChave(nfe.chaveAcesso);
      setNumero(nfe.numero);
      setEmitente(nfe.nomeEmitente);
      setValor(String(nfe.valorTotal));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'XML inválido.');
    }
  };

  const salvar = async () => {
    const clean = chave.replace(/\D/g, '');
    if (clean.length !== 44) return toast.error('Chave deve ter 44 dígitos.');
    setBusy(true);
    try {
      const uid = (await supabase.auth.getUser()).data.user?.id ?? null;
      let xml_path: string | null = null;
      if (xmlFile) {
        const path = `entrada/${clean}/xml.xml`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, xmlFile, {
          upsert: true,
          contentType: 'application/xml',
        });
        if (error) throw error;
        xml_path = path;
      }
      const { error } = await (supabase as any).from('nfe_entrada').insert({
        chave_acesso: clean,
        numero: numero || null,
        nome_emitente: emitente || null,
        valor_total: valor ? Number(valor) : null,
        xml_path,
        origem: 'manual',
      });
      if (error) throw error;
      await (supabase as any).from('nfe_entrada_eventos').insert({
        nfe_entrada_id: null,
        tipo: 'importada_manual',
        detalhes: { chave: clean },
        user_id: uid,
      }).select();
      toast.success('NF-e de entrada registrada.');
      onDone();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao salvar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>Nova NF-e de entrada</DialogTitle>
        <DialogDescription>Envie o XML ou preencha os campos manualmente.</DialogDescription>
      </DialogHeader>

      <div className="space-y-3">
        <label className="block">
          <input
            type="file"
            accept=".xml,application/xml,text/xml"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleXml(f); e.target.value = ''; }}
          />
          <Button asChild variant="outline" size="sm" className="w-full cursor-pointer">
            <span><Upload className="w-4 h-4" /> {xmlFile ? xmlFile.name : 'Enviar XML'}</span>
          </Button>
        </label>

        <div>
          <Label className="text-xs">Chave de acesso</Label>
          <Input value={chave} onChange={(e) => setChave(e.target.value)} className="h-9 font-mono text-xs" placeholder="44 dígitos" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Número</Label>
            <Input value={numero} onChange={(e) => setNumero(e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Valor total</Label>
            <Input value={valor} onChange={(e) => setValor(e.target.value)} type="number" step="0.01" className="h-9" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Emitente</Label>
          <Input value={emitente} onChange={(e) => setEmitente(e.target.value)} className="h-9" />
        </div>
      </div>

      <DialogFooter>
        <Button onClick={salvar} disabled={busy}>
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Salvar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
