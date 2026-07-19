import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Upload, FileJson, Search, Copy, ArrowRightLeft, ChevronDown, ChevronRight, Download, Trash2 } from 'lucide-react';

interface HarEntry {
  idx: number;
  method: string;
  url: string;
  host: string;
  path: string;
  status: number;
  mimeType: string;
  size: number;
  time: number;
  startedAt: string;
  requestHeaders: Record<string, string>;
  requestBody: string | null;
  responseBody: string | null;
  requestJson: any;
  responseJson: any;
}

const KEYWORDS_DEFAULT = 'transferenc,transfer,movimento,movto,estoque,deposito,dep_';
const REDACT_HEADERS = ['authorization', 'cookie', 'set-cookie', 'x-api-key', 'x-auth-token', 'proxy-authorization'];

function tryParseJson(s: string | null): any {
  if (!s) return null;
  try { return JSON.parse(s); } catch { return null; }
}

function parseHar(rawText: string): HarEntry[] {
  const har = JSON.parse(rawText);
  const entries = har?.log?.entries;
  if (!Array.isArray(entries)) throw new Error('HAR inválido: não achei log.entries');

  return entries.map((e: any, idx: number) => {
    const url: string = e.request?.url || '';
    let host = '', path = '';
    try { const u = new URL(url); host = u.host; path = u.pathname + u.search; } catch { path = url; }

    const requestHeaders: Record<string, string> = {};
    for (const h of e.request?.headers || []) {
      const name = String(h.name || '').toLowerCase();
      requestHeaders[name] = REDACT_HEADERS.includes(name) ? '[REDACTED]' : String(h.value ?? '');
    }

    const requestBody: string | null = e.request?.postData?.text ?? null;
    const responseBody: string | null = e.response?.content?.text ?? null;

    return {
      idx,
      method: e.request?.method || 'GET',
      url,
      host,
      path,
      status: e.response?.status || 0,
      mimeType: e.response?.content?.mimeType || '',
      size: e.response?.content?.size || 0,
      time: Math.round(e.time || 0),
      startedAt: e.startedDateTime || '',
      requestHeaders,
      requestBody,
      responseBody,
      requestJson: tryParseJson(requestBody),
      responseJson: tryParseJson(responseBody),
    };
  });
}

function redactEntry(e: HarEntry): HarEntry {
  return { ...e, requestHeaders: { ...e.requestHeaders } }; // headers já redacted no parse
}

function methodColor(m: string) {
  switch (m) {
    case 'GET': return 'bg-emerald-500/15 text-success border-emerald-500/30';
    case 'POST': return 'bg-blue-500/15 text-blue-500 border-blue-500/30';
    case 'PUT': return 'bg-amber-500/15 text-warning border-amber-500/30';
    case 'PATCH': return 'bg-purple-500/15 text-purple-500 border-purple-500/30';
    case 'DELETE': return 'bg-red-500/15 text-destructive border-red-500/30';
    default: return 'bg-muted text-muted-foreground border-border';
  }
}

export default function HarTransferenciasPage() {
  const { isAdmin, loading } = useAuth();
  const [rawText, setRawText] = useState('');
  const [entries, setEntries] = useState<HarEntry[]>([]);
  const [keywords, setKeywords] = useState(KEYWORDS_DEFAULT);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<number | null>(null);
  const [expandedReq, setExpandedReq] = useState(true);
  const [expandedRes, setExpandedRes] = useState(true);

  if (loading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleFile = async (file: File) => {
    const t = toast.loading(`Lendo ${file.name}...`);
    try {
      const text = await file.text();
      setRawText(text);
      const parsed = parseHar(text);
      setEntries(parsed);
      toast.success(`${parsed.length} requisições carregadas`, { id: t });
    } catch (err: any) {
      toast.error('Falha: ' + (err.message || String(err)), { id: t });
    }
  };

  const handleTextParse = () => {
    try {
      const parsed = parseHar(rawText);
      setEntries(parsed);
      toast.success(`${parsed.length} requisições carregadas`);
    } catch (err: any) {
      toast.error('Falha: ' + (err.message || String(err)));
    }
  };

  const filtered = useMemo(() => {
    const kws = keywords.split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
    const q = search.trim().toLowerCase();
    return entries.filter(e => {
      if (kws.length) {
        const hay = (e.url + ' ' + (e.requestBody || '') + ' ' + (e.responseBody || '').slice(0, 4000)).toLowerCase();
        if (!kws.some(k => hay.includes(k))) return false;
      }
      if (q && !(e.url.toLowerCase().includes(q) || (e.requestBody || '').toLowerCase().includes(q))) return false;
      return true;
    });
  }, [entries, keywords, search]);

  const summary = useMemo(() => {
    const byHost = new Map<string, number>();
    const byMethod = new Map<string, number>();
    for (const e of filtered) {
      byHost.set(e.host, (byHost.get(e.host) || 0) + 1);
      byMethod.set(e.method, (byMethod.get(e.method) || 0) + 1);
    }
    return {
      hosts: [...byHost.entries()].sort((a, b) => b[1] - a[1]),
      methods: [...byMethod.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [filtered]);

  const exportFiltered = () => {
    const payload = filtered.map(redactEntry).map(e => ({
      method: e.method, url: e.url, status: e.status, mimeType: e.mimeType,
      requestHeaders: e.requestHeaders, requestBody: e.requestBody, responseBody: e.responseBody,
    }));
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `har-transferencias-filtered-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast.success('Export gerado (headers sensíveis redacted)');
  };

  const copyForAgent = () => {
    const lines = filtered.map(e => {
      const bodyPreview = (e.responseBody || '').slice(0, 2000);
      const reqPreview = (e.requestBody || '').slice(0, 1000);
      return `━━━ [${e.method}] ${e.status} ${e.url}\nreq: ${reqPreview}\nres: ${bodyPreview}`;
    }).join('\n\n');
    navigator.clipboard.writeText(lines);
    toast.success(`${filtered.length} entradas copiadas`);
  };

  const clear = () => {
    setEntries([]); setRawText(''); setSelected(null);
  };

  const sel = selected != null ? entries.find(e => e.idx === selected) : null;

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-[1600px] mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-md bg-primary/10 flex items-center justify-center">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">Análise HAR — Transferências</h1>
          <p className="text-xs text-muted-foreground">
            Cole/importe um HAR do Auge (aba Rede do DevTools). O parse é 100% local no seu navegador — nada é enviado ao servidor.
          </p>
        </div>
        {entries.length > 0 && (
          <Button variant="outline" size="sm" onClick={clear} className="gap-1.5">
            <Trash2 className="w-3.5 h-3.5" /> Limpar
          </Button>
        )}
      </div>

      {/* Import */}
      <Card className="p-4 space-y-3 border-border/40">
        <div className="flex flex-col md:flex-row gap-3">
          <label className="flex-1 flex items-center gap-2 border-2 border-dashed border-border/60 rounded-md p-4 cursor-pointer hover:border-primary/60 transition-colors">
            <Upload className="w-5 h-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Selecionar arquivo .har</p>
              <p className="text-xs text-muted-foreground">Ou arraste. Nomes sugeridos: auge-transferencias.har</p>
            </div>
            <input
              type="file"
              accept=".har,application/json,application/har+json"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ''; }}
            />
          </label>
        </div>
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ou cole o JSON do HAR aqui</summary>
          <Textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder='{"log":{"entries":[...]}}'
            className="mt-2 font-mono text-[11px] h-40"
          />
          <Button size="sm" onClick={handleTextParse} disabled={!rawText.trim()} className="mt-2 gap-1.5">
            <FileJson className="w-3.5 h-3.5" /> Analisar texto
          </Button>
        </details>
      </Card>

      {entries.length > 0 && (
        <>
          {/* Filters */}
          <Card className="p-3 space-y-2 border-border/40">
            <div className="flex flex-col lg:flex-row gap-2">
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Palavras-chave (vírgula)</label>
                <Input value={keywords} onChange={e => setKeywords(e.target.value)} className="h-9 text-xs font-mono mt-1" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Busca livre (URL ou body)</label>
                <div className="relative mt-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} className="h-9 text-xs pl-8" placeholder="ex: doc_id, /api/transf..." />
                </div>
              </div>
              <div className="flex gap-2 items-end">
                <Button size="sm" variant="outline" onClick={copyForAgent} className="h-9 gap-1.5">
                  <Copy className="w-3.5 h-3.5" /> Copiar p/ IA
                </Button>
                <Button size="sm" variant="outline" onClick={exportFiltered} className="h-9 gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Exportar JSON
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
              <span className="text-muted-foreground">
                {filtered.length}/{entries.length} matches
              </span>
              {summary.methods.map(([m, c]) => (
                <Badge key={m} variant="outline" className={`text-[10px] h-5 ${methodColor(m)}`}>{m}: {c}</Badge>
              ))}
              {summary.hosts.slice(0, 5).map(([h, c]) => (
                <Badge key={h} variant="outline" className="text-[10px] h-5 font-mono">{h} ({c})</Badge>
              ))}
            </div>
          </Card>

          {/* Split view: list + detail */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3">
            {/* List */}
            <Card className="border-border/40 overflow-hidden">
              <ScrollArea className="h-[calc(100vh-24rem)]">
                <ul className="divide-y divide-border/40">
                  {filtered.length === 0 && (
                    <li className="p-6 text-center text-xs text-muted-foreground">Nenhuma requisição bate com os filtros.</li>
                  )}
                  {filtered.map(e => (
                    <li
                      key={e.idx}
                      onClick={() => setSelected(e.idx)}
                      className={`p-2.5 cursor-pointer hover:bg-muted/40 ${selected === e.idx ? 'bg-primary/5 border-l-2 border-primary' : ''}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-[10px] h-5 shrink-0 ${methodColor(e.method)}`}>{e.method}</Badge>
                        <Badge variant="outline" className={`text-[10px] h-5 shrink-0 ${e.status >= 400 ? 'text-destructive border-red-500/30' : e.status >= 300 ? 'text-warning' : ''}`}>{e.status}</Badge>
                        <span className="text-[10px] text-muted-foreground font-mono truncate">{e.host}</span>
                      </div>
                      <p className="text-[11px] font-mono break-all leading-tight">{e.path}</p>
                    </li>
                  ))}
                </ul>
              </ScrollArea>
            </Card>

            {/* Detail */}
            <Card className="border-border/40 overflow-hidden">
              {!sel ? (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-2 p-6 text-muted-foreground">
                  <FileJson className="w-10 h-10 opacity-40" />
                  <p className="text-xs">Selecione uma requisição à esquerda</p>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-24rem)]">
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={`text-[10px] h-5 ${methodColor(sel.method)}`}>{sel.method}</Badge>
                        <Badge variant="outline" className="text-[10px] h-5">{sel.status}</Badge>
                        <span className="text-[10px] text-muted-foreground">{sel.time}ms · {(sel.size / 1024).toFixed(1)}KB</span>
                      </div>
                      <p className="text-xs font-mono break-all bg-muted/40 p-2 rounded">{sel.url}</p>
                    </div>

                    <Section title="Request headers" defaultOpen={false}>
                      <pre className="text-[10px] font-mono bg-muted/30 p-2 rounded overflow-x-auto">
                        {Object.entries(sel.requestHeaders).map(([k, v]) => `${k}: ${v}`).join('\n')}
                      </pre>
                    </Section>

                    <Section title="Request body" defaultOpen={expandedReq} onToggle={() => setExpandedReq(v => !v)}>
                      {sel.requestBody ? (
                        <pre className="text-[10px] font-mono bg-muted/30 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all">
                          {sel.requestJson ? JSON.stringify(sel.requestJson, null, 2) : sel.requestBody}
                        </pre>
                      ) : <p className="text-[10px] text-muted-foreground">(vazio)</p>}
                    </Section>

                    <Section title="Response body" defaultOpen={expandedRes} onToggle={() => setExpandedRes(v => !v)}>
                      {sel.responseBody ? (
                        <pre className="text-[10px] font-mono bg-muted/30 p-2 rounded overflow-x-auto whitespace-pre-wrap break-all max-h-[500px]">
                          {sel.responseJson ? JSON.stringify(sel.responseJson, null, 2) : sel.responseBody.slice(0, 20000)}
                        </pre>
                      ) : <p className="text-[10px] text-muted-foreground">(vazio ou não capturado)</p>}
                    </Section>
                  </div>
                </ScrollArea>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, defaultOpen, onToggle, children }: { title: string; defaultOpen?: boolean; onToggle?: () => void; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen ?? true);
  const isOpen = onToggle ? defaultOpen : open;
  return (
    <div className="border border-border/40 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => { onToggle ? onToggle() : setOpen(v => !v); }}
        className="w-full flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/30 hover:bg-muted/50 text-[10px] font-bold uppercase tracking-wider"
      >
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {title}
      </button>
      {isOpen && <div className="p-2">{children}</div>}
    </div>
  );
}
