import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, Download, Upload, RefreshCw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatusBadge } from '@/components/ui/status-badge';

interface Props {
  nfeId: string | null;
  onClose: () => void;
}

interface NFeSefaz {
  id: string;
  numero: string;
  serie: string | null;
  chave_acesso: string;
  protocolo_autorizacao: string | null;
  situacao_sefaz: string | null;
  data_autorizacao: string | null;
  consultado_sefaz_at: string | null;
  xml_path: string | null;
  danfe_path: string | null;
}

const BUCKET = 'nfe-arquivos';

export function NFeSefazDialog({ nfeId, onClose }: Props) {
  const qc = useQueryClient();
  const [protocolo, setProtocolo] = useState('');
  const [situacao, setSituacao] = useState('');

  const { data: nfe, isLoading } = useQuery({
    queryKey: ['nfe-sefaz', nfeId],
    enabled: !!nfeId,
    queryFn: async (): Promise<NFeSefaz | null> => {
      const { data, error } = await (supabase as any)
        .from('nfe_importadas')
        .select('id, numero, serie, chave_acesso, protocolo_autorizacao, situacao_sefaz, data_autorizacao, consultado_sefaz_at, xml_path, danfe_path')
        .eq('id', nfeId!)
        .maybeSingle();
      if (error) throw error;
      return data as NFeSefaz | null;
    },
  });

  useEffect(() => {
    if (nfe) {
      setProtocolo(nfe.protocolo_autorizacao ?? '');
      setSituacao(nfe.situacao_sefaz ?? '');
    }
  }, [nfe]);

  const consultar = useMutation({
    mutationFn: async () => {
      if (!nfe) throw new Error('NF-e não carregada.');
      const { data, error } = await supabase.functions.invoke('nfe-sefaz-consulta', {
        body: { chave: nfe.chave_acesso, nfeId: nfe.id },
      });
      if (error) throw error;
      return data as { ok?: boolean; needs_cert?: boolean; message?: string };
    },
    onSuccess: (r) => {
      if (r?.needs_cert) toast.warning(r.message ?? 'Certificado A1 necessário.');
      else if (r?.ok) toast.success('Consulta realizada.');
      else toast.info(r?.message ?? 'Sem retorno da SEFAZ.');
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Falha na consulta.'),
  });

  const salvarManual = useMutation({
    mutationFn: async () => {
      if (!nfe) return;
      const { error } = await (supabase as any)
        .from('nfe_importadas')
        .update({
          protocolo_autorizacao: protocolo.trim() || null,
          situacao_sefaz: situacao.trim() || null,
          consultado_sefaz_at: new Date().toISOString(),
          data_autorizacao: situacao.trim() === 'autorizada' ? new Date().toISOString() : nfe.data_autorizacao,
        })
        .eq('id', nfe.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Protocolo registrado.');
      qc.invalidateQueries({ queryKey: ['nfe-sefaz', nfeId] });
      qc.invalidateQueries({ queryKey: ['expedicao', 'nfes'] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Falha ao salvar.'),
  });

  const upload = useMutation({
    mutationFn: async ({ file, kind }: { file: File; kind: 'xml' | 'danfe' }) => {
      if (!nfe) throw new Error('NF-e não carregada.');
      const ext = kind === 'xml' ? 'xml' : 'pdf';
      const path = `${nfe.chave_acesso}/${kind}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, {
        upsert: true,
        contentType: kind === 'xml' ? 'application/xml' : 'application/pdf',
      });
      if (upErr) throw upErr;
      const field = kind === 'xml' ? 'xml_path' : 'danfe_path';
      const { error } = await (supabase as any).from('nfe_importadas').update({ [field]: path }).eq('id', nfe.id);
      if (error) throw error;
      return kind;
    },
    onSuccess: (k) => {
      toast.success(`${k.toUpperCase()} salvo.`);
      qc.invalidateQueries({ queryKey: ['nfe-sefaz', nfeId] });
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : 'Falha no upload.'),
  });

  const baixar = async (path: string | null) => {
    if (!path) return;
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 300);
    if (error || !data?.signedUrl) {
      toast.error('Não foi possível gerar link.');
      return;
    }
    window.open(data.signedUrl, '_blank');
  };

  return (
    <Dialog open={!!nfeId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[95vw] sm:max-w-2xl p-0 gap-0 overflow-hidden flex flex-col">
        <DialogHeader className="p-5 sm:p-6 pb-4 sm:pb-4 mb-0">
          <DialogTitle>NF-e {nfe?.numero ?? '—'} / série {nfe?.serie ?? '—'}</DialogTitle>
          <DialogDescription className="font-mono text-xs break-all">
            {nfe?.chave_acesso ?? ''}
          </DialogDescription>
        </DialogHeader>

        {isLoading || !nfe ? (
          <div className="py-8 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-5 pt-2">
            <section className="border border-border rounded-md p-3 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  {nfe.situacao_sefaz === 'autorizada' ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-warning" />
                  )}
                  Situação SEFAZ
                </h3>
                <Button size="sm" variant="outline" onClick={() => consultar.mutate()} disabled={consultar.isPending}>
                  {consultar.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Consultar
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="proto" className="text-xs">Protocolo</Label>
                  <Input id="proto" value={protocolo} onChange={(e) => setProtocolo(e.target.value)} placeholder="Nº protocolo autorização" className="h-9 font-mono text-sm" />
                </div>
                <div>
                  <Label htmlFor="sit" className="text-xs">Situação</Label>
                  <Input id="sit" value={situacao} onChange={(e) => setSituacao(e.target.value)} placeholder="autorizada, cancelada..." className="h-9 text-sm" />
                </div>
              </div>

              {nfe.consultado_sefaz_at && (
                <p className="text-xs text-muted-foreground">
                  Última atualização: {new Date(nfe.consultado_sefaz_at).toLocaleString('pt-BR')}
                  {nfe.situacao_sefaz && <> · <StatusBadge tone={nfe.situacao_sefaz === 'autorizada' ? 'success' : 'warning'} label={nfe.situacao_sefaz} /></>}
                </p>
              )}

              <Button size="sm" onClick={() => salvarManual.mutate()} disabled={salvarManual.isPending}>
                {salvarManual.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar protocolo
              </Button>
            </section>

            <section className="border border-border rounded-md p-3 space-y-3">
              <h3 className="text-sm font-medium">Arquivos</h3>
              <div className="grid grid-cols-2 gap-3">
                <FileSlot
                  label="XML"
                  icon={FileText}
                  path={nfe.xml_path}
                  accept=".xml,application/xml,text/xml"
                  onUpload={(f) => upload.mutate({ file: f, kind: 'xml' })}
                  onDownload={() => baixar(nfe.xml_path)}
                  uploading={upload.isPending}
                />
                <FileSlot
                  label="DANFE (PDF)"
                  icon={FileText}
                  path={nfe.danfe_path}
                  accept="application/pdf,.pdf"
                  onUpload={(f) => upload.mutate({ file: f, kind: 'danfe' })}
                  onDownload={() => baixar(nfe.danfe_path)}
                  uploading={upload.isPending}
                />
              </div>
            </section>
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FileSlot({
  label,
  icon: Icon,
  path,
  accept,
  onUpload,
  onDownload,
  uploading,
}: {
  label: string;
  icon: typeof FileText;
  path: string | null;
  accept: string;
  onUpload: (file: File) => void;
  onDownload: () => void;
  uploading: boolean;
}) {
  return (
    <div className="border border-border rounded p-3 space-y-2">
      <div className="flex items-center gap-2 text-sm">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{label}</span>
        {path && <StatusBadge tone="success" label="salvo" />}
      </div>
      <div className="flex gap-2">
        <label className="flex-1">
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(f);
              e.target.value = '';
            }}
          />
          <Button size="sm" variant="outline" asChild disabled={uploading} className="w-full cursor-pointer">
            <span>
              <Upload className="w-4 h-4" />
              {path ? 'Substituir' : 'Enviar'}
            </span>
          </Button>
        </label>
        {path && (
          <Button size="sm" variant="outline" onClick={onDownload}>
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
