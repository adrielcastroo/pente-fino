import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Upload, FileText, AlertCircle, CheckCircle2, Trash2, RefreshCw, Truck } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { PageShell, PageHeader } from '@/components/expedicao/ui';
import { parseNFeXML, formatBRL, type NFeData } from '@/lib/nfe-parser';

function formatCnpj(v: string): string {
  const d = (v ?? '').replace(/\D/g, '').padStart(14, '0').slice(0, 14);
  return d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5');
}

async function logConsulta(nfe: NFeData, tipo: 'emitido' | 'recebido') {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await (supabase as any).from('nfe_consulta_log').insert({
      user_id: user.id,
      user_email: user.email,
      cnpj: tipo === 'emitido' ? nfe.cnpjEmitente : nfe.cnpjDestinatario,
      tipo,
      chave_acesso: nfe.chaveAcesso,
      status: 'xml_importado',
      motivo: 'Importação manual de XML NF-e',
      cache_hit: false,
      detalhes: {
        numero: nfe.numero,
        serie: nfe.serie,
        valor: nfe.valorTotal,
        emitente: nfe.nomeEmitente,
        destinatario: nfe.nomeDestinatario,
      },
    });
  } catch {
    /* logging não bloqueia */
  }
}

const MAX_XML_BYTES = 10 * 1024 * 1024; // 10 MB

type TrackingEvento = {
  id: string;
  data_evento: string;
  status: string;
  local: string | null;
  descricao: string | null;
  fonte: string | null;
};

export default function RastreioNFePage() {
  const [xmlText, setXmlText] = useState('');
  const [nfe, setNfe] = useState<NFeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [eventos, setEventos] = useState<TrackingEvento[]>([]);
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);
  const [tracking, setTracking] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const carregarEventos = useCallback(async (chave: string) => {
    const { data } = await (supabase as any)
      .from('nfe_entrada')
      .select('id, tracking_status, nfe_entrada_tracking_eventos(id, data_evento, status, local, descricao, fonte)')
      .eq('chave_acesso', chave)
      .maybeSingle();
    if (data) {
      setTrackingStatus(data.tracking_status ?? null);
      const list: TrackingEvento[] = (data.nfe_entrada_tracking_eventos ?? []) as TrackingEvento[];
      list.sort((a, b) => (b.data_evento ?? '').localeCompare(a.data_evento ?? ''));
      setEventos(list);
    }
  }, []);

  const processarXml = useCallback(async (xml: string) => {
    setError(null);
    setEventos([]);
    setTrackingStatus(null);
    try {
      const parsed = parseNFeXML(xml);
      setNfe(parsed);
      void logConsulta(parsed, 'emitido');
      // Registra a NF-e para permitir rastreamento posterior
      if (parsed.chaveAcesso) {
        await (supabase as any).from('nfe_entrada').upsert({
          chave_acesso: parsed.chaveAcesso,
          numero: parsed.numero,
          serie: parsed.serie,
          cnpj_emitente: parsed.cnpjEmitente,
          nome_emitente: parsed.nomeEmitente,
          data_emissao: parsed.dataEmissao || null,
          valor_total: parsed.valorTotal,
          transportadora: parsed.transportadora || null,
          origem: 'xml_manual',
        }, { onConflict: 'chave_acesso' });
        void carregarEventos(parsed.chaveAcesso);
      }
      toast.success(`NF-e ${parsed.numero} importada.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao processar XML.';
      setError(msg);
      setNfe(null);
      toast.error(msg);
    }
  }, [carregarEventos]);

  const atualizarRastreio = useCallback(async (silent = false) => {
    if (!nfe?.chaveAcesso) return;
    setTracking(true);
    const t0 = performance.now();
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('tracking-fetch', {
        body: { chave: nfe.chaveAcesso },
      });
      if (fnErr) throw fnErr;
      const r = data?.results?.[0];
      const latency = Math.round(performance.now() - t0);
      // Auditoria da consulta
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await (supabase as any).from('nfe_consulta_log').insert({
            user_id: user.id,
            user_email: user.email,
            cnpj: nfe.cnpjEmitente,
            tipo: 'rastreio',
            chave_acesso: nfe.chaveAcesso,
            status: r?.status ?? 'desconhecido',
            motivo: silent ? 'polling automático' : 'atualização manual',
            cache_hit: false,
            detalhes: { eventos: r?.eventos ?? 0, latency_ms: latency },
          });
        }
      } catch { /* auditoria não bloqueia */ }
      if (!silent) toast.success(`Rastreio atualizado: ${r?.eventos ?? 0} evento(s) — status ${r?.status ?? '—'}.`);
      await carregarEventos(nfe.chaveAcesso);
    } catch (e: any) {
      if (!silent) toast.error(e?.message || 'Falha ao consultar rastreio.');
    } finally {
      setTracking(false);
    }
  }, [nfe?.chaveAcesso, nfe?.cnpjEmitente, carregarEventos]);

  // F-EXP-02: Polling automático a cada 10 min enquanto status não for final
  useEffect(() => {
    if (!nfe?.chaveAcesso) return;
    if (trackingStatus === 'ENTREGUE' || trackingStatus === 'EXCECAO') return;
    const id = setInterval(() => { void atualizarRastreio(true); }, 10 * 60 * 1000);
    return () => clearInterval(id);
  }, [nfe?.chaveAcesso, trackingStatus, atualizarRastreio]);

  const onFile = useCallback(async (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_XML_BYTES) {
      const msg = `Arquivo excede o limite de ${(MAX_XML_BYTES / 1024 / 1024).toFixed(0)} MB.`;
      setError(msg);
      toast.error(msg);
      return;
    }
    const text = await f.text();
    setXmlText(text);
    void processarXml(text);
  }, [processarXml]);

  const limpar = () => {
    setXmlText('');
    setNfe(null);
    setError(null);
    setEventos([]);
    setTrackingStatus(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const totalItens = useMemo(() => nfe?.itens.length ?? 0, [nfe]);


  return (
    <PageShell>
      <PageHeader
        title="Rastreio de NF-e"
        subtitle="Importe o XML da NF-e para consultar os dados fiscais e itens."
      />

      
      <div
        className={`rounded-md border p-4 space-y-4 max-w-4xl transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border bg-card'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void onFile(f);
        }}
      >
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".xml,text/xml,application/xml"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
          <Button onClick={() => fileRef.current?.click()} className="gap-2">
            <Upload className="w-4 h-4" /> Enviar XML
          </Button>
          <Button
            variant="outline"
            onClick={() => processarXml(xmlText)}
            disabled={!xmlText.trim()}
            className="gap-2"
          >
            <FileText className="w-4 h-4" /> Processar texto
          </Button>
          {(nfe || xmlText) && (
            <Button variant="ghost" onClick={limpar} className="gap-2">
              <Trash2 className="w-4 h-4" /> Limpar
            </Button>
          )}
          <span className="text-[11px] text-muted-foreground self-center ml-auto">
            Arraste e solte o .xml aqui (máx. 10 MB)
          </span>
        </div>

        <div>
          <Label htmlFor="xml" className="text-xs">Ou cole o conteúdo XML abaixo</Label>
          <Textarea
            id="xml"
            value={xmlText}
            onChange={(e) => setXmlText(e.target.value)}
            placeholder="<?xml version='1.0'?><nfeProc>...</nfeProc>"
            className="font-mono text-xs h-32"
          />
        </div>

        {error && (
          <Alert variant="destructive" role="alert" aria-live="assertive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro ao processar XML</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

      {nfe && (
        <div
          className="rounded-md border border-border bg-card p-4 space-y-4 max-w-4xl"
          role="region"
          aria-live="polite"
          aria-label="Resultado da NF-e"
        >

          <div className="flex items-center gap-2 flex-wrap">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="font-medium">NF-e {nfe.numero} — Série {nfe.serie}</span>
            <Badge variant="secondary">{totalItens} {totalItens === 1 ? 'item' : 'itens'}</Badge>
            {trackingStatus && <Badge variant="outline" className="gap-1"><Truck className="w-3 h-3" /> {trackingStatus}</Badge>}
            <Button
              size="sm"
              variant="outline"
              onClick={atualizarRastreio}
              disabled={tracking || !nfe.chaveAcesso}
              className="ml-auto gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${tracking ? 'animate-spin' : ''}`} />
              Atualizar rastreamento
            </Button>
          </div>

          {eventos.length > 0 && (
            <div className="border border-border rounded-md">
              <div className="px-3 py-1.5 text-xs font-medium bg-muted/40 border-b border-border">
                Eventos de rastreamento ({eventos.length})
              </div>
              <ul className="divide-y divide-border max-h-64 overflow-y-auto">
                {eventos.map((ev) => (
                  <li key={ev.id} className="px-3 py-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="font-medium">{ev.status}</span>
                      <span className="text-muted-foreground">{new Date(ev.data_evento).toLocaleString('pt-BR')}</span>
                    </div>
                    {ev.descricao && <div className="text-muted-foreground">{ev.descricao}</div>}
                    {ev.local && <div className="text-muted-foreground">{ev.local}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}


          <dl className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div><dt className="text-muted-foreground text-xs">Chave de acesso</dt><dd className="font-mono text-xs break-all">{nfe.chaveAcesso || '—'}</dd></div>
            <div><dt className="text-muted-foreground text-xs">Emissão</dt><dd>{nfe.dataEmissao ? new Date(nfe.dataEmissao).toLocaleString('pt-BR') : '—'}</dd></div>
            <div><dt className="text-muted-foreground text-xs">Emitente</dt><dd>{nfe.nomeEmitente} <span className="text-muted-foreground">({formatCnpj(nfe.cnpjEmitente)})</span></dd></div>
            <div><dt className="text-muted-foreground text-xs">Destinatário</dt><dd>{nfe.nomeDestinatario} <span className="text-muted-foreground">({formatCnpj(nfe.cnpjDestinatario)})</span></dd></div>
            <div><dt className="text-muted-foreground text-xs">Valor total</dt><dd>{formatBRL(nfe.valorTotal)}</dd></div>
            <div><dt className="text-muted-foreground text-xs">Frete</dt><dd>{formatBRL(nfe.valorFrete)}</dd></div>
            <div><dt className="text-muted-foreground text-xs">Transportadora</dt><dd>{nfe.transportadora || '—'}</dd></div>
            <div><dt className="text-muted-foreground text-xs">Volumes / Peso bruto</dt><dd>{nfe.volumes} / {nfe.pesoBruto} kg</dd></div>
          </dl>

          {nfe.itens.length > 0 && (
            <div className="overflow-x-auto border border-border rounded-md">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-2 py-1.5">Código</th>
                    <th className="text-left px-2 py-1.5">Descrição</th>
                    <th className="text-right px-2 py-1.5">Qtd</th>
                    <th className="text-left px-2 py-1.5">Un</th>
                    <th className="text-right px-2 py-1.5">Vl. Unit.</th>
                    <th className="text-right px-2 py-1.5">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {nfe.itens.map((it, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-2 py-1 font-mono">{it.codigo}</td>
                      <td className="px-2 py-1">{it.descricao}</td>
                      <td className="px-2 py-1 text-right">{it.quantidade}</td>
                      <td className="px-2 py-1">{it.unidade}</td>
                      <td className="px-2 py-1 text-right">{formatBRL(it.valorUnitario)}</td>
                      <td className="px-2 py-1 text-right">{formatBRL(it.valorTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
