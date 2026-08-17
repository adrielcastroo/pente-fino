import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Loader2, Upload, Camera, MapPin, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/ui/status-badge';

type Props = { cargaId: string; open: boolean; onOpenChange: (o: boolean) => void };

export function CargaDetailDialog({ cargaId, open, onOpenChange }: Props) {
  const qc = useQueryClient();

  const { data: carga } = useQuery({
    queryKey: ['expedicao_carga', cargaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_cargas')
        .select('*, expedicao_veiculos(placa, modelo)')
        .eq('id', cargaId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: romaneios = [] } = useQuery({
    queryKey: ['expedicao_carga_romaneios', cargaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_carga_romaneios')
        .select('romaneio_id, expedicao_romaneios(numero, status)')
        .eq('carga_id', cargaId);
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  const { data: comprovantes = [] } = useQuery({
    queryKey: ['expedicao_comprovantes', cargaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expedicao_comprovantes')
        .select('*')
        .eq('carga_id', cargaId)
        .order('data_hora', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-hidden flex flex-col p-0 gap-0">
        <DialogHeader className="p-5 sm:p-6 pb-4 sm:pb-4 mb-0">
          <DialogTitle className="flex items-center gap-3">
            <span className="font-mono">{carga?.numero ?? '…'}</span>
            {carga && <StatusBadge label={carga.status} tone={
              carga.status === 'entregue' ? 'success'
              : carga.status === 'em_transito' ? 'warning'
              : carga.status === 'cancelada' ? 'danger' : 'neutral'
            } />}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-4 pt-2">
          {carga && (
          <>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Info label="Veículo" value={carga.expedicao_veiculos ? `${carga.expedicao_veiculos.placa} ${carga.expedicao_veiculos.modelo ?? ''}` : '—'} />
              <Info label="Motorista" value={carga.motorista_nome ?? '—'} />
              <Info label="Data coleta" value={carga.data_coleta ?? '—'} />
              <Info label="Frete" value={carga.custo_frete ? `R$ ${Number(carga.custo_frete).toFixed(2)}` : '—'} />
              <Info label="Rota" value={carga.rota ?? '—'} icon={<MapPin className="w-3 h-3" />} />
            </div>

            <Section title={`Romaneios (${romaneios.length})`}>
              {romaneios.length === 0 ? (
                <p className="text-xs text-muted-foreground">Nenhum romaneio vinculado.</p>
              ) : (
                <ul className="space-y-1">
                  {romaneios.map((r: any) => (
                    <li key={r.romaneio_id} className="flex items-center gap-2 text-xs">
                      <span className="font-mono">{r.expedicao_romaneios?.numero}</span>
                      <StatusBadge label={r.expedicao_romaneios?.status ?? '—'} tone={
                        r.expedicao_romaneios?.status === 'faturado' ? 'success' : 'neutral'
                      } />
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section title={`Comprovantes (${comprovantes.length})`}>
              <ComprovanteForm cargaId={cargaId} onDone={() => qc.invalidateQueries({ queryKey: ['expedicao_comprovantes', cargaId] })} />
              {comprovantes.length > 0 && (
                <ul className="space-y-2 mt-3">
                  {comprovantes.map((c: any) => (
                    <li key={c.id} className="text-xs border border-border rounded-md p-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{c.recebedor_nome ?? '—'} {c.recebedor_doc ? `(${c.recebedor_doc})` : ''}</div>
                          <div className="text-muted-foreground">{new Date(c.data_hora).toLocaleString('pt-BR')}</div>
                        </div>
                        {c.foto_path && <FotoLink path={c.foto_path} />}
                      </div>
                      {c.observacao && <div className="text-muted-foreground mt-1">{c.observacao}</div>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-muted-foreground uppercase text-[10px] tracking-wider">{label}</div>
      <div className="flex items-center gap-1">{icon}{value}</div>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function ComprovanteForm({ cargaId, onDone }: { cargaId: string; onDone: () => void }) {
  const [recebedor, setRecebedor] = useState('');
  const [doc, setDoc] = useState('');
  const [obs, setObs] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!recebedor.trim() && !file) {
      toast.error('Informe pelo menos o recebedor ou uma foto.');
      return;
    }
    setSaving(true);
    try {
      let foto_path: string | null = null;
      if (file) {
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `${cargaId}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('expedicao-comprovantes').upload(path, file);
        if (upErr) throw upErr;
        foto_path = path;
      }
      const { data: user } = await supabase.auth.getUser();
      const { error } = await supabase.from('expedicao_comprovantes').insert({
        carga_id: cargaId,
        recebedor_nome: recebedor.trim() || null,
        recebedor_doc: doc.trim() || null,
        observacao: obs.trim() || null,
        foto_path,
        criado_por: user.user?.id ?? null,
      });
      if (error) throw error;
      toast.success('Comprovante salvo');
      setRecebedor(''); setDoc(''); setObs(''); setFile(null);
      onDone();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 border border-border rounded-md p-3 bg-muted/20">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Recebedor</Label>
          <Input value={recebedor} onChange={e => setRecebedor(e.target.value)} className="h-8 text-xs" />
        </div>
        <div>
          <Label className="text-xs">Documento</Label>
          <Input value={doc} onChange={e => setDoc(e.target.value)} className="h-8 text-xs" />
        </div>
      </div>
      <div>
        <Label className="text-xs">Observação</Label>
        <Textarea rows={2} value={obs} onChange={e => setObs(e.target.value)} className="text-xs" />
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-xs cursor-pointer text-primary">
          <Camera className="w-3 h-3" />
          {file ? file.name : 'Foto (opcional)'}
          <input type="file" accept="image/*" capture="environment" className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <Button size="sm" onClick={submit} disabled={saving} className="ml-auto gap-1">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          Salvar
        </Button>
      </div>
    </div>
  );
}

function FotoLink({ path }: { path: string }) {
  const load = async () => {
    const { data } = await supabase.storage.from('expedicao-comprovantes').createSignedUrl(path, 300);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };
  return (
    <Button size="sm" variant="ghost" onClick={load} className="gap-1 h-7 text-xs">
      <ExternalLink className="w-3 h-3" /> Foto
    </Button>
  );
}
