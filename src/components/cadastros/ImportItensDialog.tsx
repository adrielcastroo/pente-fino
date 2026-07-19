import { useState, useRef } from 'react';
import { List, type RowComponentProps } from 'react-window';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { extractCodigoFornecedor, normalizarCodigo } from '@/lib/codigoFornecedor';
import { useBulkUpsertItensCadastro } from '@/hooks/useItensCadastro';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, AlertCircle, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import XlsxWorker from '@/workers/xlsxParser.worker.ts?worker';

interface Row {
  codigo_interno: string;
  descricao: string;
  codigos_fornecedor: string[];
  unidade?: string | null;
  pacote_fornecedor?: number | null;
  pacote_estocagem?: number | null;
  detectado: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const HEADER_ALIASES: Record<string, string[]> = {
  codigo_interno: [
    'codigo_interno', 'codigo interno', 'cod interno', 'codigo', 'cod', 'sku',
    'n do item', 'no do item', 'numero do item', 'num do item', 'item',
    'n item', 'no item', 'numero item',
  ],
  descricao: [
    'descricao', 'descrição', 'descricao_completa', 'descrição do item',
    'descricao do item', 'descricao completa', 'descricao do produto', 'produto',
  ],
  codigo_fornecedor: [
    'codigo_fornecedor', 'codigo fornecedor', 'cod fornecedor', 'codigo do fornecedor',
    'codigos_fornecedor', 'codigos fornecedor', 'referencia', 'referência', 'ref',
  ],
};

function findKey(headers: string[], aliases: string[]): string | null {
  const norm = (s: string) =>
    (s || '')
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ') // remove º, #, ., _, -, etc.
      .replace(/\s+/g, ' ')
      .trim();
  const wanted = new Set(aliases.map(norm));
  for (const h of headers) {
    if (wanted.has(norm(h))) return h;
  }
  return null;
}

function splitCodes(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[;|,/]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function dedupeCodes(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of list) {
    const n = normalizarCodigo(c);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(c);
  }
  return out;
}

type RowProps = {
  rows: Row[];
  updateCodigosText: (idx: number, text: string) => void;
  removeRow: (idx: number) => void;
};

function ImportRow({ index, style, rows, updateCodigosText, removeRow }: RowComponentProps<RowProps>) {
  const r = rows[index];
  if (!r) return null;
  return (
    <div
      style={style}
      className="grid grid-cols-[180px_1fr_260px_60px] gap-2 px-3 items-center border-b text-xs"
    >
      <div className="font-mono truncate" title={r.codigo_interno}>{r.codigo_interno}</div>
      <div className="truncate" title={r.descricao}>{r.descricao}</div>
      <div className="flex items-center gap-1">
        <Input
          value={r.codigos_fornecedor.join('; ')}
          onChange={(e) => updateCodigosText(index, e.target.value)}
          className="h-8 font-mono text-xs"
          placeholder="—"
        />
        {r.detectado && <Badge variant="outline" className="text-[9px] px-1">auto</Badge>}
      </div>
      <div>
        <Button variant="ghost" size="sm" onClick={() => removeRow(index)} className="h-7 text-xs">×</Button>
      </div>
    </div>
  );
}

export default function ImportItensDialog({ open, onOpenChange }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const bulk = useBulkUpsertItensCadastro();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [descPrompt, setDescPrompt] = useState<{
    changes: Array<{ codigo_interno: string; oldDesc: string; newDesc: string }>;
    selected: Set<string>;
    summary: { inserted: number; skipped: number; duplicatesInFile: number };
  } | null>(null);
  const [updatingDesc, setUpdatingDesc] = useState(false);

  const [parsing, setParsing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const MAX_FILE_BYTES = 10 * 1024 * 1024;

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    if (file.size > MAX_FILE_BYTES) {
      const msg = `Arquivo excede o limite de ${(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)} MB.`;
      setErrorMsg(msg);
      toast.error(msg);
      return;
    }
    setFileName(file.name);
    setParsing(true);
    try {
      const buf = await file.arrayBuffer();
      const worker = new XlsxWorker();
      const result: any = await new Promise((resolve, reject) => {
        worker.onmessage = (ev) => resolve(ev.data);
        worker.onerror = (err) => reject(err);
        worker.postMessage({ buffer: buf }, [buf]);
      });
      worker.terminate();
      if (!result?.ok) {
        toast.error(result?.error || 'Falha ao ler planilha');
        return;
      }
      const parsed: Row[] = result.rows;
      setRows(parsed);
      toast.success(
        `${parsed.length} itens carregados${result.ignoradas ? ` (${result.ignoradas} linhas sem código interno ignoradas)` : ''}`,
      );
    } catch (e: any) {
      setErrorMsg(`Falha ao ler planilha: ${e?.message || e}`);
      toast.error('Não foi possível ler a planilha');
    } finally {
      setParsing(false);
    }
  };


  const updateCodigosText = (idx: number, text: string) => {
    setRows((rs) =>
      rs.map((r, i) =>
        i === idx
          ? { ...r, codigos_fornecedor: dedupeCodes(splitCodes(text)), detectado: false }
          : r,
      ),
    );
  };

  const removeRow = (idx: number) => {
    setRows((rs) => rs.filter((_, i) => i !== idx));
  };

  const handleCancel = () => {
    abortRef.current?.abort();
  };

  const logImport = async (payload: {
    total: number;
    inseridos: number;
    atualizados: number;
    ignorados: number;
    resultado: 'sucesso' | 'parcial' | 'falha' | 'cancelado';
    erro?: string | null;
    detalhes?: Record<string, unknown>;
  }) => {
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) return;
      await (supabase as any).from('import_log').insert({
        user_id: u.user.id,
        user_email: u.user.email,
        file_name: fileName || null,
        total_linhas: payload.total,
        inseridos: payload.inseridos,
        atualizados: payload.atualizados,
        ignorados: payload.ignorados,
        resultado: payload.resultado,
        erro: payload.erro ?? null,
        detalhes: payload.detalhes ?? null,
      });
    } catch {
      /* auditoria não deve bloquear o fluxo */
    }
  };

  const handleImport = async () => {
    setErrorMsg(null);
    const validRows = rows.filter((r) => r.codigo_interno);
    if (!validRows.length) {
      toast.error('Nenhuma linha válida (código interno é obrigatório)');
      return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress({ done: 0, total: validRows.length });
    try {
      const res: any = await bulk.mutateAsync({
        inputs: validRows.map((r) => ({
          codigo_interno: r.codigo_interno,
          descricao: r.descricao,
          codigos_fornecedor: r.codigos_fornecedor,
          unidade: r.unidade ?? null,
          pacote_fornecedor: r.pacote_fornecedor ?? null,
          pacote_estocagem: r.pacote_estocagem ?? null,
        })),
        signal: controller.signal,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      const { inserted = 0, skipped = 0, duplicatesInFile = 0, fornecedorUpdated = 0, descChanges = [], fornecedorConflicts = [] } = res || {};
      const parts = [
        `${inserted} novo(s) importado(s)`,
        skipped > 0 ? `${skipped} já cadastrado(s) ignorado(s)` : null,
        fornecedorUpdated > 0 ? `${fornecedorUpdated} com novo(s) código(s) de fornecedor adicionado(s)` : null,
        duplicatesInFile > 0 ? `${duplicatesInFile} duplicata(s) na planilha mescladas` : null,
        fornecedorConflicts.length > 0 ? `${fornecedorConflicts.length} conflito(s) de código de fornecedor ignorado(s)` : null,
      ].filter(Boolean).join(' · ');
      toast.success(parts || 'Nada a importar');
      if (fornecedorConflicts.length > 0) {
        const preview = fornecedorConflicts.slice(0, 5)
          .map((c: any) => `${c.codigo_fornecedor} → já em ${c.conflita_com} (tentado em ${c.codigo_interno})`)
          .join('\n');
        toast.warning(`Códigos de fornecedor duplicados (ignorados):\n${preview}${fornecedorConflicts.length > 5 ? `\n… +${fornecedorConflicts.length - 5}` : ''}`, { duration: 10000 });
      }
      setProgress(null);

      await logImport({
        total: validRows.length,
        inseridos: inserted,
        atualizados: fornecedorUpdated,
        ignorados: skipped,
        resultado: 'sucesso',
        detalhes: { duplicatesInFile, descChangesCount: descChanges.length, fornecedorConflicts: fornecedorConflicts.length },
      });

      if (descChanges.length > 0) {
        setDescPrompt({
          changes: descChanges,
          selected: new Set(descChanges.map((c: any) => c.codigo_interno)),
          summary: { inserted, skipped, duplicatesInFile },
        });
      } else {
        setRows([]);
        setFileName('');
        onOpenChange(false);
      }
    } catch (e: any) {
      const msg = e?.message || 'Erro desconhecido ao importar';
      const cancelled = controller.signal.aborted;
      setErrorMsg(msg);
      toast.error(cancelled ? 'Importação cancelada' : 'Importação interrompida — veja detalhes no diálogo');
      await logImport({
        total: validRows.length,
        inseridos: 0,
        atualizados: 0,
        ignorados: 0,
        resultado: cancelled ? 'cancelado' : 'falha',
        erro: msg,
      });
    } finally {
      abortRef.current = null;
      setProgress(null);
    }
  };

  const downloadErrorCsv = () => {
    if (!errorMsg) return;
    const csv = 'linha,codigo_interno,descricao,erro\n' +
      rows.map((r, i) =>
        `${i + 1},"${r.codigo_interno.replace(/"/g, '""')}","${(r.descricao || '').replace(/"/g, '""')}","${errorMsg.replace(/"/g, '""')}"`
      ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-erros-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const confirmDescUpdates = async () => {
    if (!descPrompt) return;
    const items = descPrompt.changes.filter((c) => descPrompt.selected.has(c.codigo_interno));
    if (!items.length) {
      setDescPrompt(null);
      setRows([]);
      setFileName('');
      onOpenChange(false);
      return;
    }
    setUpdatingDesc(true);
    try {
      const { itensCadastroService } = await import('@/services/itensCadastroService');
      const res = await itensCadastroService.bulkUpdateDescricoes(
        items.map((i) => ({ codigo_interno: i.codigo_interno, descricao: i.newDesc })),
      );
      toast.success(`${res.count} descrição(ões) atualizada(s)`);
      setDescPrompt(null);
      setRows([]);
      setFileName('');
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message || 'Falha ao atualizar descrições');
    } finally {
      setUpdatingDesc(false);
    }
  };

  const semCodigo = rows.filter((r) => !r.codigos_fornecedor.length).length;
  const comMultiplos = rows.filter((r) => r.codigos_fornecedor.length > 1).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar planilha de itens</DialogTitle>
          <DialogDescription>
            Aceita .xlsx ou .csv. Colunas: <code>codigo_interno</code>, <code>descricao</code>, <code>codigo_fornecedor</code>, <code>unidade</code>, <code>pacote_fornecedor</code>, <code>pacote_estocagem</code> (só <code>codigo_interno</code> é obrigatório).
            Para vários códigos no mesmo item, separe por <code>;</code> ou <code>|</code> (ex.: <code>YM4202;RF-MOMBASSA</code>).
            Linhas duplicadas pelo mesmo código interno são mescladas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div
          className={`flex items-center gap-3 rounded-md border-2 border-dashed p-3 transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-transparent'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <Button variant="outline" onClick={() => inputRef.current?.click()} className="gap-2">
            <Upload className="h-4 w-4" />
            Selecionar arquivo
          </Button>
          {rows.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                let detected = 0;
                setRows((rs) =>
                  rs.map((r) => {
                    if (r.codigos_fornecedor.length || !r.descricao) return r;
                    const ext = extractCodigoFornecedor(r.descricao);
                    if (!ext) return r;
                    detected++;
                    return { ...r, codigos_fornecedor: dedupeCodes([ext.codigo]), detectado: true };
                  }),
                );
                if (detected > 0) toast.success(`${detected} código(s) detectado(s) na descrição`);
                else toast.info('Nenhum código detectado na descrição dos itens sem código');
              }}
            >
              Detectar códigos na descrição
            </Button>
          )}
          {fileName && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <FileSpreadsheet className="h-3 w-3" />
              {fileName}
            </span>
          )}
          {rows.length > 0 && (
            <div className="ml-auto flex gap-2 text-xs">
              <Badge variant="secondary">{rows.length} itens</Badge>
              {comMultiplos > 0 && <Badge variant="outline">{comMultiplos} com múltiplos</Badge>}
              {semCodigo > 0 && <Badge variant="outline">{semCodigo} sem código</Badge>}
            </div>
          )}
        </div>

        {parsing && (
          <div className="text-xs text-muted-foreground">Processando planilha em segundo plano…</div>
        )}

        {rows.length > 0 && (
          <div className="flex-1 flex flex-col border rounded-md overflow-hidden min-h-[300px]">
            <div className="grid grid-cols-[180px_1fr_260px_60px] gap-2 px-3 py-2 border-b bg-muted/40 text-xs font-medium">
              <div>Código interno</div>
              <div>Descrição</div>
              <div>Códigos fornecedor (; ou |)</div>
              <div />
            </div>
            <div className="flex-1">
              <List
                rowCount={rows.length}
                rowHeight={40}
                rowComponent={ImportRow}
                rowProps={{ rows, updateCodigosText, removeRow }}
                style={{ height: '100%', width: '100%' }}
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Importação interrompida</AlertTitle>
            <AlertDescription className="text-xs whitespace-pre-wrap break-words space-y-2">
              <div>
                {errorMsg}
                {'\n\n'}Dicas: verifique sua conexão, reduza o tamanho do arquivo (o sistema já processa em lotes de 200) ou remova linhas com dados inválidos.
              </div>
              <Button size="sm" variant="outline" onClick={downloadErrorCsv} className="gap-2">
                <Download className="h-3 w-3" /> Baixar log de erros (CSV)
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {progress && (
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Importando lote a lote…</span>
              <span>{progress.done} / {progress.total}</span>
            </div>
            <Progress value={progress.total ? (progress.done / progress.total) * 100 : 0} className="h-2" />
          </div>
        )}

        <DialogFooter>
          {bulk.isPending ? (
            <Button variant="destructive" onClick={handleCancel}>Cancelar importação</Button>
          ) : (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
          )}
          <Button onClick={handleImport} disabled={!rows.length || bulk.isPending}>
            {bulk.isPending ? 'Importando...' : `Importar ${rows.length} itens`}
          </Button>
        </DialogFooter>
      </DialogContent>

      {descPrompt && (
        <Dialog open onOpenChange={(v) => !v && setDescPrompt(null)}>
          <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Atualizar descrições?</DialogTitle>
              <DialogDescription>
                {descPrompt.summary.inserted} novo(s) importado(s), {descPrompt.summary.skipped} já existente(s) ignorado(s).
                Encontramos {descPrompt.changes.length} item(ns) já cadastrado(s) cuja descrição na planilha difere da atual.
                Marque os que deseja atualizar (apenas a descrição será alterada).
              </DialogDescription>
            </DialogHeader>

            <div className="flex items-center gap-3 text-xs">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  setDescPrompt((p) => p && { ...p, selected: new Set(p.changes.map((c) => c.codigo_interno)) })
                }
              >
                Marcar todos
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDescPrompt((p) => p && { ...p, selected: new Set() })}
              >
                Desmarcar todos
              </Button>
              <span className="text-muted-foreground ml-auto">
                {descPrompt.selected.size} de {descPrompt.changes.length} selecionados
              </span>
            </div>

            <div className="flex-1 overflow-auto border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background">
                  <TableRow>
                    <TableHead className="w-[40px]"></TableHead>
                    <TableHead className="w-[160px]">Código interno</TableHead>
                    <TableHead>Descrição atual</TableHead>
                    <TableHead>Nova descrição (planilha)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {descPrompt.changes.map((c) => {
                    const checked = descPrompt.selected.has(c.codigo_interno);
                    return (
                      <TableRow key={c.codigo_interno}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setDescPrompt((p) => {
                                if (!p) return p;
                                const s = new Set(p.selected);
                                if (e.target.checked) s.add(c.codigo_interno);
                                else s.delete(c.codigo_interno);
                                return { ...p, selected: s };
                              });
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{c.codigo_interno}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{c.oldDesc || '—'}</TableCell>
                        <TableCell className="text-xs">{c.newDesc}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => {
                  setDescPrompt(null);
                  setRows([]);
                  setFileName('');
                  onOpenChange(false);
                }}
                disabled={updatingDesc}
              >
                Não atualizar
              </Button>
              <Button onClick={confirmDescUpdates} disabled={updatingDesc || descPrompt.selected.size === 0}>
                {updatingDesc ? 'Atualizando...' : `Atualizar ${descPrompt.selected.size} descrição(ões)`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
