import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
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
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';

interface Row {
  codigo_interno: string;
  descricao: string;
  codigos_fornecedor: string[];
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

export default function ImportItensDialog({ open, onOpenChange }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const bulk = useBulkUpsertItensCadastro();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const handleFile = async (file: File) => {
    setErrorMsg(null);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (!json.length) {
        toast.error('Planilha vazia');
        return;
      }

      const headers = Array.from(new Set(json.slice(0, 20).flatMap((r) => Object.keys(r))));
      const kInterno = findKey(headers, HEADER_ALIASES.codigo_interno);
      const kDesc = findKey(headers, HEADER_ALIASES.descricao);
      const kForn = findKey(headers, HEADER_ALIASES.codigo_fornecedor);

      if (!kInterno) {
        toast.error('Planilha precisa ter ao menos a coluna: codigo_interno');
        return;
      }

      // Mescla múltiplas linhas com mesmo codigo_interno.
      // Campos em branco são preservados como string vazia (não invalidam a linha).
      const byInterno = new Map<string, Row>();
      let ignoradas = 0;
      for (const r of json) {
        const codigo_interno = String(r[kInterno] ?? '').trim();
        if (!codigo_interno) {
          ignoradas++;
          continue;
        }
        const descricao = kDesc ? String(r[kDesc] ?? '').trim() : '';
        const fornRaw = kForn ? String(r[kForn] ?? '').trim() : '';
        let codigos = splitCodes(fornRaw);
        let detectado = false;
        if (!codigos.length && descricao) {
          const ext = extractCodigoFornecedor(descricao);
          if (ext) {
            codigos = [ext.codigo];
            detectado = true;
          }
        }
        const existing = byInterno.get(codigo_interno);
        if (existing) {
          existing.codigos_fornecedor = dedupeCodes([...existing.codigos_fornecedor, ...codigos]);
          if (!existing.descricao && descricao) existing.descricao = descricao;
        } else {
          byInterno.set(codigo_interno, {
            codigo_interno,
            descricao,
            codigos_fornecedor: dedupeCodes(codigos),
            detectado,
          });
        }
      }

      const parsed = Array.from(byInterno.values());
      setRows(parsed);
      toast.success(
        `${parsed.length} itens carregados${ignoradas ? ` (${ignoradas} linhas sem código interno ignoradas)` : ''}`,
      );
    } catch (e: any) {
      setErrorMsg(`Falha ao ler planilha: ${e?.message || e}`);
      toast.error('Não foi possível ler a planilha');
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
      const res = await bulk.mutateAsync({
        inputs: validRows.map((r) => ({
          codigo_interno: r.codigo_interno,
          descricao: r.descricao,
          codigos_fornecedor: r.codigos_fornecedor,
        })),
        signal: controller.signal,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      toast.success(`${res.count} itens importados`);
      setRows([]);
      setFileName('');
      setProgress(null);
      onOpenChange(false);
    } catch (e: any) {
      const msg = e?.message || 'Erro desconhecido ao importar';
      setErrorMsg(msg);
      toast.error('Importação interrompida — veja detalhes no diálogo');
    } finally {
      abortRef.current = null;
      setProgress(null);
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
            Aceita .xlsx ou .csv. Colunas esperadas: <code>codigo_interno</code>, <code>descricao</code> e opcionalmente <code>codigo_fornecedor</code>.
            Para vários códigos no mesmo item, separe por <code>;</code> ou <code>|</code> (ex.: <code>YM4202;RF-MOMBASSA</code>).
            Linhas duplicadas pelo mesmo código interno são mescladas automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
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

        {rows.length > 0 && (
          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="w-[180px]">Código interno</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[260px]">Códigos fornecedor (; ou |)</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.slice(0, 200).map((r, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs">{r.codigo_interno}</TableCell>
                    <TableCell className="text-xs max-w-md truncate" title={r.descricao}>
                      {r.descricao}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Input
                          value={r.codigos_fornecedor.join('; ')}
                          onChange={(e) => updateCodigosText(idx, e.target.value)}
                          className="h-8 font-mono text-xs"
                          placeholder="—"
                        />
                        {r.detectado && (
                          <Badge variant="outline" className="text-[9px] px-1">auto</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeRow(idx)} className="h-7 text-xs">×</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {rows.length > 200 && (
              <div className="p-2 text-xs text-center text-muted-foreground">
                ...e mais {rows.length - 200} linhas (todas serão importadas)
              </div>
            )}
          </div>
        )}

        {errorMsg && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Importação interrompida</AlertTitle>
            <AlertDescription className="text-xs whitespace-pre-wrap break-words">
              {errorMsg}
              {'\n\n'}Dicas: verifique sua conexão, reduza o tamanho do arquivo (o sistema já processa em lotes de 200) ou remova linhas com dados inválidos.
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
    </Dialog>
  );
}
