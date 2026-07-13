// ============================================================================
// Dialog: gerar etiquetas a partir do XML da NF-e.
// Duas abas: escolher NF-e já importada OU fazer upload de um XML avulso.
// O app detecta transportadora, volumes e destinatário automaticamente.
// ============================================================================
import { useMemo, useRef, useState } from 'react';
import { FileText, Upload, Search, PackageOpen, Truck, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { useNFesImportadas } from '@/hooks/expedicao/useExpedicaoData';
import { parseNFeXML, type NFeData } from '@/lib/nfe-parser';
import { supabase } from '@/integrations/supabase/client';
import { nfeToPatch, type EtiquetaXmlPatch } from './etiqueta-xml';

export type LabelSizeKey = '100x150' | '100x100' | '100x50';

const SIZES: { key: LabelSizeKey; label: string }[] = [
  { key: '100x150', label: '100 × 150 mm (padrão)' },
  { key: '100x100', label: '100 × 100 mm (quadrada)' },
  { key: '100x50', label: '100 × 50 mm (compacta)' },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onApply: (patch: EtiquetaXmlPatch & { pageSize: LabelSizeKey; copies: number }) => void;
}

export default function EtiquetaXmlDialog({ open, onOpenChange, onApply }: Props) {
  const { data: nfes = [], isLoading } = useNFesImportadas();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploadedNfe, setUploadedNfe] = useState<NFeData | null>(null);
  const [size, setSize] = useState<LabelSizeKey>('100x150');
  const [oneLabelPerVolume, setOneLabelPerVolume] = useState(true);
  const [manualVolumes, setManualVolumes] = useState<number>(1);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return nfes;
    return nfes.filter((n) =>
      [n.numero, n.nome_destinatario, n.transportadora, n.chave_acesso]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [nfes, query]);

  const selectedFromDb = nfes.find((n) => n.id === selectedId) ?? null;

  async function handleUpload(file: File) {
    try {
      const text = await file.text();
      const parsed = parseNFeXML(text);
      setUploadedNfe(parsed);
      setSelectedId(null);
      toast.success(`NF-e ${parsed.numero} lida do arquivo.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Falha ao ler XML.');
    }
  }

  async function loadXmlFromDb(id: string): Promise<NFeData | null> {
    const { data, error } = await (supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (c: string, v: string) => { maybeSingle: () => Promise<{ data: { xml_raw: string } | null; error: Error | null }> };
        };
      };
    })
      .from('nfe_importadas')
      .select('xml_raw')
      .eq('id', id)
      .maybeSingle();
    if (error || !data?.xml_raw) return null;
    try { return parseNFeXML(data.xml_raw); } catch { return null; }
  }

  async function confirm() {
    let nfe: NFeData | null = uploadedNfe;
    if (!nfe && selectedFromDb) {
      const parsed = await loadXmlFromDb(selectedFromDb.id);
      if (parsed) {
        nfe = parsed;
      } else {
        // Fallback: monta um NFeData mínimo a partir dos campos indexados
        nfe = {
          numero: selectedFromDb.numero,
          serie: selectedFromDb.serie ?? '',
          chaveAcesso: selectedFromDb.chave_acesso,
          dataEmissao: selectedFromDb.data_emissao ?? '',
          cnpjEmitente: '', nomeEmitente: '',
          cnpjDestinatario: '', nomeDestinatario: selectedFromDb.nome_destinatario ?? '',
          valorTotal: selectedFromDb.valor_total ?? 0,
          valorProdutos: selectedFromDb.valor_produtos ?? 0,
          valorFrete: selectedFromDb.valor_frete ?? 0,
          transportadora: selectedFromDb.transportadora ?? '',
          volumes: selectedFromDb.volumes ?? 1,
          pesoLiquido: 0, pesoBruto: 0, itens: [],
        };
      }
    }
    if (!nfe) return toast.error('Selecione uma NF-e ou envie um XML.');
    const totalVol = Math.max(1, nfe.volumes || manualVolumes || 1);
    const patch = nfeToPatch(nfe, 1);
    patch.volumeTotal = String(totalVol);
    onApply({
      ...patch,
      pageSize: size,
      copies: oneLabelPerVolume ? totalVol : 1,
    });
    onOpenChange(false);
  }

  const preview = uploadedNfe ?? (selectedFromDb ? {
    numero: selectedFromDb.numero,
    nomeDestinatario: selectedFromDb.nome_destinatario ?? '',
    transportadora: selectedFromDb.transportadora ?? '',
    volumes: selectedFromDb.volumes ?? 1,
    chaveAcesso: selectedFromDb.chave_acesso,
  } : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-4 text-primary" /> Gerar etiquetas a partir do XML
          </DialogTitle>
          <DialogDescription>
            Detectamos transportadora, volumes e destinatário automaticamente. Você escolhe o tamanho.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="importadas" className="w-full">
          <TabsList className="grid grid-cols-2 mb-3">
            <TabsTrigger value="importadas">NF-e importadas</TabsTrigger>
            <TabsTrigger value="upload">Upload XML</TabsTrigger>
          </TabsList>

          <TabsContent value="importadas" className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input placeholder="Buscar por NF, destinatário, transportadora, chave…"
                value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8 h-9" />
            </div>
            <ScrollArea className="h-64 border border-border rounded-md">
              {isLoading ? (
                <p className="text-xs text-muted-foreground p-3">Carregando…</p>
              ) : filtered.length === 0 ? (
                <p className="text-xs text-muted-foreground p-3 italic">Nenhuma NF-e encontrada.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {filtered.map((n) => (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => { setSelectedId(n.id); setUploadedNfe(null); }}
                        className={`w-full text-left px-3 py-2 hover:bg-accent/40 transition-colors ${
                          selectedId === n.id ? 'bg-primary/10' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm font-semibold">NF {n.numero}</span>
                          <Badge variant="secondary" className="text-[10px] font-mono">
                            {n.volumes ?? 1} vol
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {n.nome_destinatario ?? '—'} · {n.transportadora ?? 'Sem transportadora'}
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="upload" className="space-y-3">
            <label className="flex flex-col items-center justify-center gap-2 border border-dashed border-border rounded-md py-8 cursor-pointer hover:bg-accent/30 transition-colors">
              <Upload className="size-6 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Clique ou arraste um arquivo <code className="font-mono text-[11px]">.xml</code> da NF-e</span>
              <input
                ref={fileRef} type="file" accept=".xml,text/xml,application/xml" className="hidden"
                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
              />
            </label>
            {uploadedNfe && (
              <div className="text-xs text-muted-foreground p-2 bg-muted/40 rounded">
                Lido: <span className="font-mono">NF {uploadedNfe.numero}</span> · {uploadedNfe.volumes} vol
              </div>
            )}
          </TabsContent>
        </Tabs>

        {preview && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-md border border-border bg-muted/30 p-3 text-xs">
            <InfoRow icon={<FileText className="size-3.5" />} label="NF-e" value={preview.numero} mono />
            <InfoRow icon={<Truck className="size-3.5" />} label="Transportadora" value={preview.transportadora || '—'} />
            <InfoRow icon={<User className="size-3.5" />} label="Destinatário" value={preview.nomeDestinatario || '—'} />
            <InfoRow icon={<PackageOpen className="size-3.5" />} label="Volumes" value={String(preview.volumes ?? 1)} mono />
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Tamanho da etiqueta</Label>
            <Select value={size} onValueChange={(v) => setSize(v as LabelSizeKey)}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SIZES.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Cópias</Label>
            <Select value={oneLabelPerVolume ? 'volumes' : 'one'} onValueChange={(v) => setOneLabelPerVolume(v === 'volumes')}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="volumes">Uma por volume (auto)</SelectItem>
                <SelectItem value="one">Somente 1 etiqueta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!preview?.volumes && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-medium text-muted-foreground">Volumes (manual)</Label>
              <Input type="number" min={1} value={manualVolumes}
                onChange={(e) => setManualVolumes(Math.max(1, Number(e.target.value) || 1))} className="h-9" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={confirm} disabled={!preview}>
            Gerar etiqueta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className={`truncate ${mono ? 'font-mono' : 'font-medium'}`} title={value}>{value}</span>
    </div>
  );
}
