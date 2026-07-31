import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

/** Linha já normalizada da planilha de vínculos kit ↔ matéria-prima. */
export interface VinculoImportRow {
  kit_codigo: string;
  kit_descricao: string | null;
  tecido_codigo: string | null;
  tecido_descricao: string | null;
}

const COLUNAS = ['Codigo_Kit', 'Nome_Kit', 'Codigo_Materia_Prima', 'Nome_Materia_Prima'] as const;

const norm = (s: unknown) =>
  String(s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const ALIASES: Record<keyof VinculoImportRow, string[]> = {
  kit_codigo: ['codigokit', 'cdkit', 'kit', 'codigodokit'],
  kit_descricao: ['nomekit', 'descricaokit', 'dskit', 'nomedokit'],
  tecido_codigo: ['codigomateriaprima', 'codigomp', 'cdmateriaprima', 'codigotecido', 'materiaprima'],
  tecido_descricao: ['nomemateriaprima', 'descricaomateriaprima', 'nomemp', 'nometecido'],
};

function mapearColunas(headers: string[]): Partial<Record<keyof VinculoImportRow, string>> {
  const map: Partial<Record<keyof VinculoImportRow, string>> = {};
  for (const campo of Object.keys(ALIASES) as (keyof VinculoImportRow)[]) {
    const alvo = new Set(ALIASES[campo]);
    const achado = headers.find((h) => alvo.has(norm(h)));
    if (achado) map[campo] = achado;
  }
  return map;
}

/** Lê a primeira aba e devolve as linhas válidas (com código de kit). */
async function lerPlanilha(file: File): Promise<VinculoImportRow[]> {
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error('A planilha não possui abas.');

  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '', raw: false });
  if (!json.length) throw new Error('A planilha está vazia.');

  const headers = Array.from(new Set(json.slice(0, 20).flatMap((r) => Object.keys(r))));
  const cols = mapearColunas(headers);
  if (!cols.kit_codigo || !cols.tecido_codigo) {
    throw new Error('A planilha precisa conter as colunas Codigo_Kit e Codigo_Materia_Prima.');
  }

  const dedupe = new Map<string, VinculoImportRow>();
  for (const r of json) {
    const kit = String(r[cols.kit_codigo] ?? '').trim();
    const mp = String(r[cols.tecido_codigo] ?? '').trim();
    if (!kit || !mp) continue;
    dedupe.set(kit.toUpperCase(), {
      kit_codigo: kit,
      kit_descricao: cols.kit_descricao ? String(r[cols.kit_descricao] ?? '').trim() || null : null,
      tecido_codigo: mp,
      tecido_descricao: cols.tecido_descricao
        ? String(r[cols.tecido_descricao] ?? '').trim() || null
        : null,
    });
  }
  if (!dedupe.size) throw new Error('Nenhuma linha válida encontrada.');
  return [...dedupe.values()];
}

function baixarModelo() {
  const ws = XLSX.utils.aoa_to_sheet([
    [...COLUNAS],
    ['KTEC.001.001', 'Kit Tecido Exemplo - Forro Branco', 'TEC.001.001', 'Tecido Exemplo'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Vinculos');
  XLSX.writeFile(wb, 'modelo-vinculos-kit-materia-prima.xlsx');
}

export interface ImportKitsVinculosDialogProps {
  /** Chamado após gravar os vínculos, para recarregar a listagem. */
  onImported?: () => void;
}

/** Importa a planilha Codigo_Kit / Nome_Kit / Codigo_Materia_Prima / Nome_Materia_Prima. */
export default function ImportKitsVinculosDialog({ onImported }: ImportKitsVinculosDialogProps) {
  const [aberto, setAberto] = useState(false);
  const [linhas, setLinhas] = useState<VinculoImportRow[] | null>(null);
  const [arquivo, setArquivo] = useState<string | null>(null);
  const [lendo, setLendo] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processar = async (file?: File | null) => {
    if (!file) return;
    setLendo(true);
    try {
      const rows = await lerPlanilha(file);
      setLinhas(rows);
      setArquivo(file.name);
    } catch (e) {
      setLinhas(null);
      setArquivo(null);
      toast.error(e instanceof Error ? e.message : 'Não foi possível ler a planilha.');
    } finally {
      setLendo(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const importar = async () => {
    if (!linhas?.length) return;
    setSalvando(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = linhas.map((l) => ({
        ...l,
        origem: 'manual',
        score: 1,
        confirmado: true,
        updated_by: userData.user?.id ?? null,
      }));
      for (let i = 0; i < payload.length; i += 500) {
        const { error } = await supabase
          .from('tecido_kit_vinculos')
          .upsert(payload.slice(i, i + 500), { onConflict: 'kit_codigo' });
        if (error) throw error;
      }
      toast.success(`${payload.length} vínculo(s) importado(s).`);
      setAberto(false);
      setLinhas(null);
      setArquivo(null);
      onImported?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao importar vínculos.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-10 gap-2">
          <Upload className="h-4 w-4" /> Importar planilha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Importar vínculos kit ↔ matéria-prima</DialogTitle>
          <DialogDescription>
            Colunas esperadas: {COLUNAS.join(', ')}. Cada linha vincula o kit ao tecido que o compõe.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" className="gap-2" onClick={() => inputRef.current?.click()} disabled={lendo}>
              {lendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              Selecionar arquivo
            </Button>
            <Button variant="ghost" className="gap-2" onClick={baixarModelo}>
              <Download className="h-4 w-4" /> Baixar modelo
            </Button>
          </div>

          {linhas && (
            <div className="rounded-md border">
              <div className="border-b px-3 py-2 text-xs text-muted-foreground">
                {arquivo} · {linhas.length} vínculo(s)
              </div>
              <div className="max-h-64 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-card text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Kit</th>
                      <th className="px-3 py-2 text-left font-medium">Matéria-prima</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linhas.slice(0, 200).map((l) => (
                      <tr key={l.kit_codigo} className="border-t">
                        <td className="px-3 py-1.5">
                          <div className="font-mono text-[11px] text-muted-foreground">{l.kit_codigo}</div>
                          <div className="break-words">{l.kit_descricao}</div>
                        </td>
                        <td className="px-3 py-1.5">
                          <div className="font-mono text-[11px] text-muted-foreground">{l.tecido_codigo}</div>
                          <div className="break-words">{l.tecido_descricao}</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setAberto(false)} disabled={salvando}>
            Cancelar
          </Button>
          <Button onClick={() => void importar()} disabled={!linhas?.length || salvando} className="gap-2">
            {salvando && <Loader2 className="h-4 w-4 animate-spin" />}
            Importar
          </Button>
        </DialogFooter>

        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv,.ods"
          className="hidden"
          onChange={(e) => void processar(e.target.files?.[0])}
        />
      </DialogContent>
    </Dialog>
  );
}
