import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Search, Loader2, Send, CheckCircle2, AlertTriangle, X, Trash2, Plus, FileSpreadsheet, Upload, Download, FileUp } from 'lucide-react';
import { toast } from 'sonner';

interface Acabamento {
  cd_acabamento: string;
  chave_acabamento: string | null;
  nm_acabamento: string;
  id_cancelado: string | null;
}

interface RunDetalhes {
  phase?: string;
  current?: number;
  total?: number;
  item?: string;
  results?: Array<{ cd: string; ok: boolean; erro?: string; cdItem?: string }>;
}

interface SyncRun {
  id: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  error_message: string | null;
  detalhes: RunDetalhes | null;
}

interface ItemVinculo {
  cd_acabamento_item: string;
  cd_acabamento: string;
  cd_item_acabamento: string;
  ds_item_acabamento: string | null;
}

type Mode = 'incluir' | 'excluir';

type ItemPayload = {
  cdItemAcabamento: string;
  dsItemAcabamento: string;
  dsItemAcabamentoReduzida: string;
  dsItemAcabamentoOriginal: string;
  cdKitComplementar1: string;
  cdKitComplementar2: string;
  cdKitComplementar3: string;
  cdKitComplementar4: string;
  cdKitComplementar5: string;
};

type ImportedItem = ItemPayload & {
  acabamentosRaw: string;
  acabamentosCodes: string[]; // tokens brutos digitados
};

const emptyItem: ItemPayload = {
  cdItemAcabamento: '',
  dsItemAcabamento: '',
  dsItemAcabamentoReduzida: '',
  dsItemAcabamentoOriginal: '',
  cdKitComplementar1: '',
  cdKitComplementar2: '',
  cdKitComplementar3: '',
  cdKitComplementar4: '',
  cdKitComplementar5: '',
};

const IMPORT_HEADER_ALIASES: Array<{ key: keyof ItemPayload | 'acabamentos'; aliases: string[] }> = [
  { key: 'cdItemAcabamento', aliases: ['codigo do tecido kit', 'codigo do tecido/kit', 'codigo tecido kit', 'codigo', 'cod', 'codigo tecido', 'codigo kit', 'sku', 'item'] },
  { key: 'dsItemAcabamento', aliases: ['descricao do tecido kit', 'descricao do tecido/kit', 'descricao tecido kit', 'descricao', 'descricao completa'] },
  { key: 'dsItemAcabamentoReduzida', aliases: ['descricao reduzida', 'desc reduzida', 'reduzida'] },
  { key: 'dsItemAcabamentoOriginal', aliases: ['descricao original', 'desc original', 'original'] },
  { key: 'cdKitComplementar1', aliases: ['kit complementar 01', 'kit complementar 1', 'kit 01', 'kit 1', 'complementar 01', 'complementar 1'] },
  { key: 'cdKitComplementar2', aliases: ['kit complementar 02', 'kit complementar 2', 'kit 02', 'kit 2', 'complementar 02', 'complementar 2'] },
  { key: 'cdKitComplementar3', aliases: ['kit complementar 03', 'kit complementar 3', 'kit 03', 'kit 3', 'complementar 03', 'complementar 3'] },
  { key: 'cdKitComplementar4', aliases: ['kit complementar 04', 'kit complementar 4', 'kit 04', 'kit 4', 'complementar 04', 'complementar 4'] },
  { key: 'cdKitComplementar5', aliases: ['kit complementar 05', 'kit complementar 5', 'kit 05', 'kit 5', 'complementar 05', 'complementar 5'] },
  { key: 'acabamentos', aliases: ['acabamentos', 'acabamento', 'codigo acabamento', 'codigos acabamento', 'codigos dos acabamentos', 'chave acabamento', 'chaves acabamento', 'chaves dos acabamentos'] },
];

const POSITIONAL_ORDER: Array<keyof ItemPayload | 'acabamentos'> = [
  'cdItemAcabamento',
  'dsItemAcabamento',
  'dsItemAcabamentoReduzida',
  'dsItemAcabamentoOriginal',
  'cdKitComplementar1',
  'cdKitComplementar2',
  'cdKitComplementar3',
  'cdKitComplementar4',
  'cdKitComplementar5',
  'acabamentos',
];

const normHeader = (s: string) =>
  (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const splitAcabamentos = (raw: string): string[] =>
  (raw || '')
    .split(/[;,|\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

function parseImportedSheet(buf: ArrayBuffer): ImportedItem[] {
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', blankrows: false });
  if (!rows.length) return [];

  // Detect header row
  const firstRow = rows[0].map((c) => normHeader(String(c ?? '')));
  const headerMap: Partial<Record<keyof ItemPayload | 'acabamentos', number>> = {};
  let hasHeader = false;
  IMPORT_HEADER_ALIASES.forEach(({ key, aliases }) => {
    const wanted = new Set(aliases.map(normHeader));
    const idx = firstRow.findIndex((h) => wanted.has(h));
    if (idx >= 0) {
      headerMap[key] = idx;
      hasHeader = true;
    }
  });

  const dataRows = hasHeader ? rows.slice(1) : rows;
  const out: ImportedItem[] = [];
  for (const r of dataRows) {
    const base: ItemPayload = { ...emptyItem };
    let acabamentosRaw = '';
    if (hasHeader) {
      (Object.keys(headerMap) as Array<keyof ItemPayload | 'acabamentos'>).forEach((k) => {
        const idx = headerMap[k];
        if (idx == null) return;
        const val = String(r[idx] ?? '').trim();
        if (k === 'acabamentos') acabamentosRaw = val;
        else (base as any)[k] = val;
      });
    } else {
      POSITIONAL_ORDER.forEach((k, i) => {
        const val = String(r[i] ?? '').trim();
        if (k === 'acabamentos') acabamentosRaw = val;
        else (base as any)[k] = val;
      });
    }
    if (base.cdItemAcabamento) {
      base.cdItemAcabamento = base.cdItemAcabamento.toUpperCase();
      out.push({
        ...base,
        acabamentosRaw,
        acabamentosCodes: splitAcabamentos(acabamentosRaw),
      });
    }
  }
  return out;
}

function downloadTemplate() {
  const headers = [
    'Código do Tecido/Kit',
    'Descrição do Tecido/Kit',
    'Descrição Reduzida',
    'Descrição Original',
    'Kit Complementar 01',
    'Kit Complementar 02',
    'Kit Complementar 03',
    'Kit Complementar 04',
    'Kit Complementar 05',
    'Acabamentos',
  ];
  const example = [
    ['TEC001234', 'Tecido Exemplo 1,40m', 'TEC EX 140', 'Tecido Exemplo original 1,40m', '', '', '', '', '', '1001;1002;1003'],
    ['TEC009876', 'Tecido Exemplo 2,80m', 'TEC EX 280', 'Tecido Exemplo original 2,80m', '', '', '', '', '', '1005'],
  ];
  const ws = XLSX.utils.aoa_to_sheet([headers, ...example]);
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(14, h.length + 2) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
  XLSX.writeFile(wb, 'modelo-incluir-em-massa.xlsx');
}

export default function IncluirItemMassaTab() {
  const [mode, setMode] = useState<Mode>('incluir');
  const [item, setItem] = useState({ ...emptyItem });
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [enviando, setEnviando] = useState(false);
  const [run, setRun] = useState<SyncRun | null>(null);
  const channelRef = useRef<any>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Importação de planilha (xlsx/csv/ods)
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importedItems, setImportedItems] = useState<ImportedItem[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; label: string } | null>(null);

  // Excluir mode
  const [codigoExcluir, setCodigoExcluir] = useState('');
  const [codigoBuscado, setCodigoBuscado] = useState('');
  const [selecionadosExcluir, setSelecionadosExcluir] = useState<Set<string>>(new Set()); // cd_acabamento_item

  const { data: acabamentos = [], isLoading } = useQuery({
    queryKey: ['acabamentos-list-massa'],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('auge_acabamentos')
        .select('cd_acabamento, chave_acabamento, nm_acabamento, id_cancelado')
        .neq('id_cancelado', 'S')
        .order('nm_acabamento', { ascending: true })
        .limit(3000);
      return (data ?? []) as Acabamento[];
    },
  });

  const { data: vinculos = [], isLoading: loadingVinculos, refetch: refetchVinculos } = useQuery({
    queryKey: ['acabamentos-vinculos-item', codigoBuscado],
    enabled: mode === 'excluir' && codigoBuscado.trim().length > 0,
    queryFn: async () => {
      const term = codigoBuscado.trim().toUpperCase();
      const { data } = await (supabase as any)
        .from('auge_acabamento_itens')
        .select('cd_acabamento_item, cd_acabamento, cd_item_acabamento, ds_item_acabamento')
        .ilike('cd_item_acabamento', `%${term}%`)
        .limit(2000);
      return (data ?? []) as ItemVinculo[];
    },
  });

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return acabamentos;
    return acabamentos.filter((a) =>
      (a.nm_acabamento ?? '').toLowerCase().includes(t) ||
      (a.chave_acabamento ?? '').toLowerCase().includes(t) ||
      (a.cd_acabamento ?? '').toLowerCase().includes(t)
    );
  }, [acabamentos, busca]);

  const acabByCd = useMemo(() => {
    const m = new Map<string, Acabamento>();
    acabamentos.forEach((a) => m.set(a.cd_acabamento, a));
    return m;
  }, [acabamentos]);

  // Índice de resolução por chave/código para reconhecimento na planilha.
  const acabByToken = useMemo(() => {
    const m = new Map<string, Acabamento>();
    const norm = (s: string) => (s || '').toString().trim().toUpperCase();
    acabamentos.forEach((a) => {
      if (a.cd_acabamento) m.set(norm(a.cd_acabamento), a);
      if (a.chave_acabamento) m.set(norm(a.chave_acabamento), a);
    });
    return m;
  }, [acabamentos]);

  const resolveTokens = (tokens: string[]): { resolved: Acabamento[]; unresolved: string[] } => {
    const resolved: Acabamento[] = [];
    const unresolved: string[] = [];
    const seen = new Set<string>();
    tokens.forEach((t) => {
      const key = t.trim().toUpperCase();
      if (!key) return;
      const a = acabByToken.get(key);
      if (a && !seen.has(a.cd_acabamento)) {
        seen.add(a.cd_acabamento);
        resolved.push(a);
      } else if (!a) {
        unresolved.push(t);
      }
    });
    return { resolved, unresolved };
  };

  const vinculosGrouped = useMemo(() => {
    // group by cd_acabamento; keep list of item vinculos per acabamento
    const map = new Map<string, ItemVinculo[]>();
    vinculos.forEach((v) => {
      const arr = map.get(v.cd_acabamento) ?? [];
      arr.push(v);
      map.set(v.cd_acabamento, arr);
    });
    return Array.from(map.entries())
      .map(([cd, list]) => ({ cd, list, acab: acabByCd.get(cd) }))
      .sort((a, b) => (a.acab?.nm_acabamento ?? '').localeCompare(b.acab?.nm_acabamento ?? ''));
  }, [vinculos, acabByCd]);

  useEffect(() => () => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
  }, []);

  const subscribeRun = (runId: string) => {
    if (channelRef.current) supabase.removeChannel(channelRef.current);
    const ch = supabase
      .channel(`run-massa-${runId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'auge_sync_runs', filter: `id=eq.${runId}` },
        (p: any) => {
          setRun(p.new as SyncRun);
          if (p.new?.status === 'success' || p.new?.status === 'error') {
            setEnviando(false);
            const dets = p.new?.detalhes as RunDetalhes | null;
            const ok = dets?.results?.filter((r) => r.ok).length ?? 0;
            const fail = (dets?.results?.length ?? 0) - ok;
            const verb = mode === 'incluir' ? 'Incluído' : 'Removido';
            if (p.new?.status === 'success') toast.success(`${verb} em ${ok} acabamentos${fail ? ` (${fail} falharam)` : ''}.`);
            else toast.error(p.new?.error_message ?? `Falhou: ${fail} erro(s).`);
            if (mode === 'excluir') refetchVinculos();
          }
        }
      )
      .subscribe();
    channelRef.current = ch;
  };

  const toggle = (cd: string) => {
    setSelecionados((prev) => {
      const n = new Set(prev);
      if (n.has(cd)) n.delete(cd); else n.add(cd);
      return n;
    });
  };
  const toggleAllFiltrados = () => {
    const allSelected = filtrados.every((a) => selecionados.has(a.cd_acabamento));
    setSelecionados((prev) => {
      const n = new Set(prev);
      if (allSelected) filtrados.forEach((a) => n.delete(a.cd_acabamento));
      else filtrados.forEach((a) => n.add(a.cd_acabamento));
      return n;
    });
  };

  const toggleExcluir = (cdItem: string) => {
    setSelecionadosExcluir((prev) => {
      const n = new Set(prev);
      if (n.has(cdItem)) n.delete(cdItem); else n.add(cdItem);
      return n;
    });
  };
  const toggleAllExcluir = () => {
    const all = vinculos.every((v) => selecionadosExcluir.has(v.cd_acabamento_item));
    setSelecionadosExcluir((prev) => {
      const n = new Set(prev);
      if (all) vinculos.forEach((v) => n.delete(v.cd_acabamento_item));
      else vinculos.forEach((v) => n.add(v.cd_acabamento_item));
      return n;
    });
  };

  const buscarVinculos = () => {
    if (!codigoExcluir.trim()) return toast.error('Informe o código do item.');
    setSelecionadosExcluir(new Set());
    setCodigoBuscado(codigoExcluir.trim());
  };

  const handleImportFile = async (file: File) => {
    try {
      const buf = await file.arrayBuffer();
      const parsed = parseImportedSheet(buf);
      if (!parsed.length) {
        toast.error('Nenhuma linha válida encontrada na planilha.');
        return;
      }
      setImportedItems(parsed);
      setImportFileName(file.name);
      toast.success(`${parsed.length} item(ns) carregado(s) da planilha.`);
    } catch (e: any) {
      toast.error(`Falha ao ler planilha: ${e?.message ?? e}`);
    }
  };

  const invokeIncluirRun = async (payload: ItemPayload): Promise<string | null> => {
    const { data, error } = await supabase.functions.invoke('auge-sync?action=incluir_item_massa', {
      body: { item: payload, cdAcabamentos: Array.from(selecionados) },
    });
    if (error) throw error;
    if (data?.ok === false) throw new Error(data?.error ?? 'Falha ao iniciar');
    return data?.run_id ?? null;
  };

  const waitRunTerminal = async (runId: string): Promise<SyncRun | null> => {
    // Poll até terminal (success|error). Timeout de segurança: 10min.
    const deadline = Date.now() + 10 * 60 * 1000;
    while (Date.now() < deadline) {
      const { data } = await (supabase as any)
        .from('auge_sync_runs').select('*').eq('id', runId).maybeSingle();
      if (data) {
        setRun(data as SyncRun);
        if (data.status === 'success' || data.status === 'error') return data as SyncRun;
      }
      await new Promise((r) => setTimeout(r, 1500));
    }
    return null;
  };

  const enviarIncluir = async () => {
    if (selecionados.size === 0) return toast.error('Selecione ao menos 1 acabamento.');

    // Modo em lote (planilha importada)
    if (importedItems.length > 0) {
      setEnviando(true);
      setRun(null);
      let sucesso = 0;
      let falha = 0;
      try {
        for (let i = 0; i < importedItems.length; i++) {
          const it = importedItems[i];
          setBatchProgress({ current: i + 1, total: importedItems.length, label: it.cdItemAcabamento });
          try {
            const runId = await invokeIncluirRun(it);
            if (runId) {
              subscribeRun(runId);
              const final = await waitRunTerminal(runId);
              if (final?.status === 'success') sucesso++;
              else falha++;
            } else {
              falha++;
            }
          } catch (e: any) {
            falha++;
            toast.error(`${it.cdItemAcabamento}: ${e?.message ?? e}`);
          }
        }
        toast.success(`Lote concluído — ${sucesso} sucesso · ${falha} falha(s).`);
      } finally {
        setBatchProgress(null);
        setEnviando(false);
      }
      return;
    }

    // Modo item único (formulário)
    if (!item.cdItemAcabamento.trim()) return toast.error('Informe o Código do Tecido/Kit ou importe uma planilha.');

    setEnviando(true);
    setRun(null);
    try {
      const runId = await invokeIncluirRun(item);
      if (runId) {
        const { data: initial } = await (supabase as any)
          .from('auge_sync_runs').select('*').eq('id', runId).maybeSingle();
        if (initial) setRun(initial as SyncRun);
        subscribeRun(runId);
        toast.info(`Iniciando inclusão em ${selecionados.size} acabamentos…`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro');
      setEnviando(false);
    }
  };

  const enviarExcluir = async () => {
    if (selecionadosExcluir.size === 0) return toast.error('Selecione ao menos 1 acabamento para remover.');
    const targets = vinculos
      .filter((v) => selecionadosExcluir.has(v.cd_acabamento_item))
      .map((v) => ({ cdAcabamento: v.cd_acabamento, cdAcabamentoItem: v.cd_acabamento_item }));

    if (!confirm(`Remover o item de ${targets.length} acabamento(s)? Esta ação será propagada ao Auge.`)) return;

    setEnviando(true);
    setRun(null);
    try {
      const { data, error } = await supabase.functions.invoke('auge-sync?action=excluir_item_massa', {
        body: { targets, cdItemAcabamento: codigoBuscado },
      });
      if (error) throw error;
      if (data?.ok === false) throw new Error(data?.error ?? 'Falha ao iniciar');
      if (data?.run_id) {
        const { data: initial } = await (supabase as any)
          .from('auge_sync_runs').select('*').eq('id', data.run_id).maybeSingle();
        if (initial) setRun(initial as SyncRun);
        subscribeRun(data.run_id);
        toast.info(`Iniciando exclusão em ${targets.length} acabamentos…`);
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Erro');
      setEnviando(false);
    }
  };

  const results = run?.detalhes?.results ?? [];
  const total = run?.detalhes?.total ?? (mode === 'incluir' ? selecionados.size : selecionadosExcluir.size);
  const current = run?.detalhes?.current ?? 0;
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  const okCount = results.filter((r) => r.ok).length;
  const errCount = results.filter((r) => !r.ok).length;
  const isActive = run?.status === 'running';

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="inline-flex rounded-lg border bg-muted/40 p-1">
        <button
          onClick={() => setMode('incluir')}
          className={`px-4 h-8 text-xs font-medium rounded-md flex items-center gap-2 transition ${mode === 'incluir' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Plus className="h-3.5 w-3.5" /> Incluir em massa
        </button>
        <button
          onClick={() => setMode('excluir')}
          className={`px-4 h-8 text-xs font-medium rounded-md flex items-center gap-2 transition ${mode === 'excluir' ? 'bg-background shadow-sm text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Trash2 className="h-3.5 w-3.5" /> Excluir em massa
        </button>
      </div>

      {mode === 'incluir' ? (
        <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4">
          {/* Formulário do item */}
          <Card className="p-4 space-y-3 h-fit">
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dados do item</div>
              <input
                ref={importInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.ods"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleImportFile(f);
                  e.target.value = '';
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => importInputRef.current?.click()}
                className="h-8 text-[11px] gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" /> Importar planilha
              </Button>
            </div>

            {importedItems.length > 0 && (
              <div className="rounded-md border border-primary/40 bg-primary/5 p-2 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileSpreadsheet className="h-3.5 w-3.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold truncate">{importFileName || 'Planilha carregada'}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {importedItems.length} item(ns) — serão incluídos em cada acabamento selecionado
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    onClick={() => { setImportedItems([]); setImportFileName(''); }}
                    disabled={enviando}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="max-h-32 overflow-y-auto rounded bg-background/60 divide-y divide-border/40">
                  {importedItems.slice(0, 50).map((it, i) => (
                    <div key={i} className="px-2 py-1 text-[10px] font-mono flex items-center gap-2">
                      <span className="text-muted-foreground w-6 text-right">{i + 1}</span>
                      <span className="font-semibold">{it.cdItemAcabamento}</span>
                      <span className="text-muted-foreground truncate">{it.dsItemAcabamento}</span>
                    </div>
                  ))}
                  {importedItems.length > 50 && (
                    <div className="px-2 py-1 text-[10px] text-center text-muted-foreground">
                      … +{importedItems.length - 50} outros
                    </div>
                  )}
                </div>
                {batchProgress && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-muted-foreground">Processando {batchProgress.current}/{batchProgress.total}</span>
                      <span className="font-mono truncate">{batchProgress.label}</span>
                    </div>
                    <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-1.5" />
                  </div>
                )}
              </div>
            )}

            <div className="text-[10px] text-muted-foreground -mt-1">
              Colunas aceitas (nesta ordem): <span className="font-mono">Código do Tecido/Kit · Descrição · Reduzida · Original · Kit Complementar 01–05</span>. Formatos: <code>.xlsx</code>, <code>.csv</code>, <code>.ods</code>.
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-medium">Código do Tecido/Kit {importedItems.length === 0 && '*'}</label>
              <Input
                value={item.cdItemAcabamento}
                onChange={(e) => setItem({ ...item, cdItemAcabamento: e.target.value.toUpperCase() })}
                className="h-9 text-xs font-mono"
                placeholder="Ex: TEC001234"
                disabled={importedItems.length > 0}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium">Descrição do Tecido/Kit</label>
              <Input value={item.dsItemAcabamento} onChange={(e) => setItem({ ...item, dsItemAcabamento: e.target.value })} className="h-9 text-xs" disabled={importedItems.length > 0} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium">Descrição Reduzida</label>
              <Input value={item.dsItemAcabamentoReduzida} onChange={(e) => setItem({ ...item, dsItemAcabamentoReduzida: e.target.value })} className="h-9 text-xs" disabled={importedItems.length > 0} />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-medium">Descrição Original</label>
              <Textarea value={item.dsItemAcabamentoOriginal} onChange={(e) => setItem({ ...item, dsItemAcabamentoOriginal: e.target.value })} className="text-xs min-h-[60px]" disabled={importedItems.length > 0} />
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="space-y-1">
                  <label className="text-[11px] font-medium">Kit Complementar {String(n).padStart(2, '0')}</label>
                  <Input
                    value={(item as any)[`cdKitComplementar${n}`]}
                    onChange={(e) => setItem({ ...item, [`cdKitComplementar${n}`]: e.target.value })}
                    className="h-8 text-xs font-mono"
                    placeholder="Código"
                    disabled={importedItems.length > 0}
                  />
                </div>
              ))}
            </div>
            <Button onClick={enviarIncluir} disabled={enviando || isActive} className="w-full h-10 gap-2">
              {enviando || isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {importedItems.length > 0
                ? `Incluir ${importedItems.length} item(ns) em ${selecionados.size} acabamento(s)`
                : `Incluir em ${selecionados.size} acabamento(s)`}
            </Button>
          </Card>

          {/* Seleção + Progresso */}
          <div className="space-y-3">
            {run && (
              <ProgressCard run={run} results={results} total={total} current={current} pct={pct} okCount={okCount} errCount={errCount} isActive={isActive} acabByCd={acabByCd} onClose={() => setRun(null)} verbActive="Incluindo" />
            )}

            <Card className="p-3 space-y-2">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar acabamentos para incluir..." className="h-9 pl-7 text-xs" />
                </div>
                <Button size="sm" variant="outline" onClick={toggleAllFiltrados} className="h-9 text-[11px]">
                  {filtrados.every((a) => selecionados.has(a.cd_acabamento)) ? 'Desmarcar' : 'Marcar'} filtrados
                </Button>
                {selecionados.size > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => setSelecionados(new Set())} className="h-9 text-[11px]">
                    Limpar ({selecionados.size})
                  </Button>
                )}
              </div>
              <div className="text-[10px] text-muted-foreground">{filtrados.length} de {acabamentos.length} · {selecionados.size} selecionados</div>
              <div className="max-h-[60vh] overflow-auto space-y-1">
                {isLoading && <div className="p-6 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></div>}
                {filtrados.map((a) => {
                  const sel = selecionados.has(a.cd_acabamento);
                  return (
                    <button
                      key={a.cd_acabamento}
                      onClick={() => toggle(a.cd_acabamento)}
                      className={`w-full text-left rounded border p-2 text-xs transition ${sel ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`h-3.5 w-3.5 rounded border shrink-0 flex items-center justify-center ${sel ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                          {sel && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{a.nm_acabamento}</div>
                          <div className="font-mono text-[10px] text-muted-foreground">{a.chave_acabamento ?? `#${a.cd_acabamento}`}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        </div>
      ) : (
        /* ================= MODO EXCLUIR ================= */
        <div className="space-y-3">
          <Card className="p-4 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Buscar item para remover</div>
            <div className="flex flex-col md:flex-row gap-2">
              <Input
                value={codigoExcluir}
                onChange={(e) => setCodigoExcluir(e.target.value.toUpperCase())}
                onKeyDown={(e) => { if (e.key === 'Enter') buscarVinculos(); }}
                placeholder="Código do Tecido/Kit (ex: TEC001234)"
                className="h-10 text-sm font-mono flex-1"
              />
              <Button onClick={buscarVinculos} className="h-10 gap-2" variant="secondary">
                <Search className="h-4 w-4" /> Buscar acabamentos vinculados
              </Button>
            </div>
            {codigoBuscado && (
              <div className="text-[11px] text-muted-foreground">
                Buscando por <span className="font-mono font-semibold">{codigoBuscado}</span>. Se o item foi cadastrado recentemente e não aparece, execute a sincronização completa de acabamentos primeiro.
              </div>
            )}
          </Card>

          {run && (
            <ProgressCard run={run} results={results} total={total} current={current} pct={pct} okCount={okCount} errCount={errCount} isActive={isActive} acabByCd={acabByCd} onClose={() => setRun(null)} verbActive="Removendo" />
          )}

          {codigoBuscado && (
            <Card className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="text-xs">
                  <span className="font-semibold">{vinculos.length}</span>{' '}
                  <span className="text-muted-foreground">acabamento(s) contendo este item</span>
                  {' · '}
                  <span className="text-muted-foreground">{selecionadosExcluir.size} marcado(s)</span>
                </div>
                <div className="flex items-center gap-2">
                  {vinculos.length > 0 && (
                    <Button size="sm" variant="outline" onClick={toggleAllExcluir} className="h-8 text-[11px]">
                      {vinculos.every((v) => selecionadosExcluir.has(v.cd_acabamento_item)) ? 'Desmarcar todos' : 'Marcar todos'}
                    </Button>
                  )}
                  <Button
                    onClick={enviarExcluir}
                    disabled={enviando || isActive || selecionadosExcluir.size === 0}
                    variant="destructive"
                    size="sm"
                    className="h-8 text-[11px] gap-1"
                  >
                    {enviando || isActive ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    Remover de {selecionadosExcluir.size} acabamento(s)
                  </Button>
                </div>
              </div>

              <div className="max-h-[60vh] overflow-auto space-y-1">
                {loadingVinculos && <div className="p-6 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></div>}
                {!loadingVinculos && vinculosGrouped.length === 0 && (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Nenhum acabamento encontrado com este item.
                  </div>
                )}
                {vinculosGrouped.map(({ cd, list, acab }) => {
                  // exibe uma linha por vínculo (cd_acabamento_item)
                  return list.map((v) => {
                    const sel = selecionadosExcluir.has(v.cd_acabamento_item);
                    return (
                      <button
                        key={v.cd_acabamento_item}
                        onClick={() => toggleExcluir(v.cd_acabamento_item)}
                        className={`w-full text-left rounded border p-2 text-xs transition ${sel ? 'bg-destructive/10 border-destructive' : 'hover:bg-muted'}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`h-3.5 w-3.5 rounded border shrink-0 flex items-center justify-center ${sel ? 'bg-destructive border-destructive' : 'border-muted-foreground/40'}`}>
                            {sel && <CheckCircle2 className="h-3 w-3 text-destructive-foreground" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{acab?.nm_acabamento ?? `Acabamento #${cd}`}</div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[10px] text-muted-foreground">{acab?.chave_acabamento ?? `#${cd}`}</span>
                              <Badge variant="outline" className="text-[9px] h-4 font-mono">item {v.cd_item_acabamento}</Badge>
                              {v.ds_item_acabamento && (
                                <span className="text-[10px] text-muted-foreground truncate">{v.ds_item_acabamento}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  });
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function ProgressCard({ run, results, total, current, pct, okCount, errCount, isActive, acabByCd, onClose, verbActive }: {
  run: SyncRun;
  results: Array<{ cd: string; ok: boolean; erro?: string; cdItem?: string }>;
  total: number; current: number; pct: number;
  okCount: number; errCount: number; isActive: boolean;
  acabByCd: Map<string, Acabamento>;
  onClose: () => void;
  verbActive: string;
}) {
  return (
    <Card className="p-3 border-primary/40 bg-primary/5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          {isActive ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> :
            run.status === 'error' ? <AlertTriangle className="h-4 w-4 text-destructive" /> :
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          <div className="text-xs font-semibold">
            {isActive ? `${verbActive} item ${run.detalhes?.item ?? ''}…` :
              run.status === 'error' ? 'Concluído com erros' : 'Concluído'}
          </div>
        </div>
        {!isActive && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
      <Progress value={pct} className="h-2" />
      <div className="mt-2 grid grid-cols-4 gap-2 text-[11px]">
        <div><span className="text-muted-foreground">Progresso:</span> <span className="font-mono">{current}/{total}</span></div>
        <div><span className="text-muted-foreground">Sucesso:</span> <span className="font-mono text-emerald-600">{okCount}</span></div>
        <div><span className="text-muted-foreground">Erros:</span> <span className="font-mono text-destructive">{errCount}</span></div>
        <div><span className="text-muted-foreground">Status:</span> <Badge variant={run.status === 'error' ? 'destructive' : run.status === 'success' ? 'default' : 'secondary'} className="text-[10px]">{run.status}</Badge></div>
      </div>
      {results.length > 0 && (
        <ScrollArea className="mt-3 max-h-56 rounded border bg-background">
          <div className="divide-y">
            {results.slice().reverse().map((r, i) => {
              const a = acabByCd.get(r.cd);
              return (
                <div key={i} className="p-2 text-[11px] flex items-start gap-2">
                  {r.ok
                    ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    : <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{a?.nm_acabamento ?? `#${r.cd}`}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{a?.chave_acabamento ?? r.cd}</div>
                    {!r.ok && <div className="text-destructive/90 break-words">{r.erro}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </Card>
  );
}
