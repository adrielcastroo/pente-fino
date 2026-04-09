import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/hooks/useToast';
import { Zap, Plus, Settings2, ScanBarcode, X, Undo2, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';

type SubMode = 'motor' | 'controle';

const CONTROLE_MODEL_MAP: Record<string, string> = {
  '1870405': 'SI 1 PU',
  '1870421': 'SI 4 PU',
  '1811608': 'SI 1 VA',
  '1811610': 'SI 4 VA',
  'situo 1 pure': 'SI 1 PU',
  'situo 4 pure': 'SI 4 PU',
  'situo 1 variation pure': 'SI 1 VA',
  'situo 4 variation pure': 'SI 4 VA',
};

function mapModelo(raw: string): string {
  const trimmed = raw.trim();
  // exact match by code
  if (CONTROLE_MODEL_MAP[trimmed]) return CONTROLE_MODEL_MAP[trimmed];
  // case-insensitive match
  const lower = trimmed.toLowerCase();
  if (CONTROLE_MODEL_MAP[lower]) return CONTROLE_MODEL_MAP[lower];
  return trimmed;
}

function sanitize(v: string) {
  return v.replace(/[`''']/g, '-');
}

export default function MotorControlePage() {
  const { registros, addRegistro, setMode } = useAppStore();
  const addToast = useToastStore(s => s.addToast);

  const [subMode, setSubMode] = useState<SubMode>('motor');
  const [modelo, setModelo] = useState('');
  const [nf, setNf] = useState('');
  const [serie, setSerie] = useState('');
  const [temCaixa, setTemCaixa] = useState(false);
  const [caixaNum, setCaixaNum] = useState('1');

  const serieRef = useRef<HTMLInputElement>(null);
  const modeloRef = useRef<HTMLInputElement>(null);

  const handleSubModeChange = (mode: SubMode) => {
    setSubMode(mode);
    setMode(mode);
    resetFields();
  };

  const resetFields = () => {
    setModelo('');
    setNf('');
    setSerie('');
    setTemCaixa(false);
    setCaixaNum('1');
  };

  const cleanMotorSerie = (raw: string, mod: string): string => {
    let cleaned = raw.trim();
    if (mod && cleaned.toLowerCase().startsWith(mod.toLowerCase())) {
      cleaned = cleaned.slice(mod.length).trim();
    }
    cleaned = cleaned.replace(/[A-Za-z]$/, '').trim();
    return cleaned;
  };

  const cleanControleSerie = (raw: string): string => {
    const idx = raw.search(/[Ff]/);
    if (idx > 0) return raw.slice(0, idx).trim();
    return raw.trim();
  };

  const isDuplicate = (cleanedSerie: string): boolean => {
    return registros.some(r =>
      (r.modoOrigem === 'motor' || r.modoOrigem === 'controle') &&
      r.lote === cleanedSerie
    );
  };

  const getSequencial = (): number => {
    return registros.filter(r => r.modoOrigem === 'controle').length + 1;
  };

  const handleModeloBlur = () => {
    if (subMode === 'controle') {
      setModelo(mapModelo(modelo));
    }
  };

  const handleAddMotor = () => {
    if (!modelo.trim()) { addToast('Preencha o Modelo', 'warn'); return; }
    if (!nf.trim()) { addToast('Preencha a Nota Fiscal', 'warn'); return; }
    if (!serie.trim()) { addToast('Bipe a Série', 'warn'); return; }

    const cleaned = cleanMotorSerie(serie, modelo);
    if (!cleaned) { addToast('Série inválida', 'warn'); return; }
    if (isDuplicate(cleaned)) { addToast('Série já cadastrada!', 'warn'); setSerie(''); return; }

    const cxLabel = temCaixa ? `CX${caixaNum.padStart(2, '0')}` : 'S/CX';
    const loteSistema = `${cxLabel} NF ${nf.trim()} série ${cleaned}`;

    addRegistro({
      id: crypto.randomUUID(),
      item: modelo.trim(),
      processo: nf.trim(),
      nf: nf.trim(),
      endereco: '',
      m2: 0,
      mLinear: 0,
      largura: 0,
      lote: cleaned,
      loteSistema,
      quantidade: temCaixa ? parseInt(caixaNum) || 1 : undefined,
      tipoTecido: 'Motor',
      modoOrigem: 'motor',
      isNew: true,
    });

    addToast(`Motor adicionado: ${cleaned}`, 'ok');
    setSerie('');
    serieRef.current?.focus();
  };

  const handleAddControle = () => {
    const resolvedModelo = mapModelo(modelo);
    setModelo(resolvedModelo);

    if (!resolvedModelo.trim()) { addToast('Preencha o Modelo', 'warn'); return; }
    if (!nf.trim()) { addToast('Preencha a Nota Fiscal', 'warn'); return; }
    if (!serie.trim()) { addToast('Bipe a Série', 'warn'); return; }

    const cleaned = cleanControleSerie(serie);
    if (!cleaned) { addToast('Série inválida', 'warn'); return; }
    if (isDuplicate(cleaned)) { addToast('Série já cadastrada!', 'warn'); setSerie(''); return; }

    const seq = getSequencial();
    const loteSistema = `${resolvedModelo.trim()} NF ${nf.trim()} série ${cleaned} Sequência ${seq}`;

    addRegistro({
      id: crypto.randomUUID(),
      item: resolvedModelo.trim(),
      processo: nf.trim(),
      nf: nf.trim(),
      endereco: '',
      m2: 0,
      mLinear: 0,
      largura: 0,
      lote: cleaned,
      loteSistema,
      quantidade: seq,
      tipoTecido: 'Controle',
      modoOrigem: 'controle',
      isNew: true,
    });

    addToast(`Controle #${seq} adicionado: ${cleaned}`, 'ok');
    setSerie('');
    serieRef.current?.focus();
  };

  const handleSerieKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (subMode === 'motor') handleAddMotor();
      else handleAddControle();
    }
  };

  const motorCount = registros.filter(r => r.modoOrigem === 'motor').length;
  const controleCount = registros.filter(r => r.modoOrigem === 'controle').length;
  const currentCount = subMode === 'motor' ? motorCount : controleCount;
  const currentItems = registros.filter(r => r.modoOrigem === subMode);

  return (
    <motion.div
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="surface-bg border-r border-border overflow-hidden flex flex-col h-full"
    >
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {/* Subtoggle */}
        <div className="flex surface-2-bg border border-border rounded-lg p-0.5 gap-0.5">
          {(['motor', 'controle'] as SubMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => handleSubModeChange(mode)}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition-all duration-200 flex items-center justify-center gap-1.5 ${
                subMode === mode
                  ? 'surface-bg text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              {mode === 'motor' ? 'Motor' : 'Controle'}
            </button>
          ))}
        </div>

        {/* Tip bar */}
        <AnimatePresence mode="wait">
          <motion.div
            key={subMode}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="ai-status-box text-xs leading-relaxed flex items-center justify-between"
          >
            <div>
              <ScanBarcode className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
              {subMode === 'motor'
                ? <>O leitor envia <kbd className="kbd">Enter</kbd> automaticamente. Série limpa (modelo e letra removidos).</>
                : <>Dígitos antes de "<strong>F</strong>" serão extraídos. Sequência: #{getSequencial()}</>
              }
            </div>
            <div className="flex gap-1 flex-shrink-0 ml-2">
              <button onClick={resetFields} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors text-[10px] font-medium text-muted-foreground border border-border">
                <X className="w-3 h-3" />
                Limpar
              </button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Motor: caixa toggle */}
        {subMode === 'motor' && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
            <Switch checked={temCaixa} onCheckedChange={setTemCaixa} />
            <span className="text-xs font-medium text-foreground">Motor em Caixa</span>
            {temCaixa && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-[10px] text-muted-foreground">Nº:</span>
                <input
                  type="number"
                  min="1"
                  value={caixaNum}
                  onChange={e => setCaixaNum(e.target.value)}
                  className="w-14 rounded-md border border-border bg-background px-2 py-1 text-xs text-center outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                  CX{caixaNum.padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Modelo */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Modelo</label>
          <input
            ref={modeloRef}
            value={modelo}
            onChange={e => setModelo(sanitize(e.target.value))}
            onBlur={handleModeloBlur}
            placeholder={subMode === 'motor' ? 'Ex: SOMFY' : 'Ex: 1870405 ou SI 1 PU'}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Nota Fiscal */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Nota Fiscal (NFe)</label>
          <input
            value={nf}
            onChange={e => setNf(sanitize(e.target.value))}
            placeholder="Ex: 146842"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Série */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Série</label>
          <input
            ref={serieRef}
            value={serie}
            onChange={e => setSerie(e.target.value)}
            onKeyDown={handleSerieKeyDown}
            placeholder="Bipe o código de barras..."
            className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
          />
        </div>

        {/* Add button */}
        <button
          onClick={subMode === 'motor' ? handleAddMotor : handleAddControle}
          className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Adicionar {subMode === 'motor' ? 'Motor' : 'Controle'}
        </button>

        {/* Preview table of recent items */}
        {currentCount > 0 && (
          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Últimos cadastrados ({currentCount})
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-border">
                    {subMode === 'motor' && <th className="text-left py-1 px-1.5 font-semibold text-muted-foreground">Caixa</th>}
                    <th className="text-left py-1 px-1.5 font-semibold text-muted-foreground">Modelo</th>
                    <th className="text-left py-1 px-1.5 font-semibold text-muted-foreground">NF</th>
                    <th className="text-left py-1 px-1.5 font-semibold text-muted-foreground">Série</th>
                    <th className="text-left py-1 px-1.5 font-semibold text-muted-foreground">Série Final</th>
                    {subMode === 'controle' && <th className="text-left py-1 px-1.5 font-semibold text-muted-foreground">Seq</th>}
                  </tr>
                </thead>
                <tbody>
                  {currentItems
                    .slice(-5)
                    .reverse()
                    .map(r => (
                      <tr key={r.id} className="border-b border-border/50 last:border-0">
                        {subMode === 'motor' && (
                          <td className="py-1.5 px-1.5 font-mono text-foreground">
                            {r.quantidade ? `CX${String(r.quantidade).padStart(2, '0')}` : 'S/CX'}
                          </td>
                        )}
                        <td className="py-1.5 px-1.5 text-foreground">{r.item}</td>
                        <td className="py-1.5 px-1.5 text-foreground">{r.nf}</td>
                        <td className="py-1.5 px-1.5 font-mono text-foreground">{r.lote}</td>
                        <td className="py-1.5 px-1.5 font-mono text-muted-foreground truncate max-w-[140px]">{r.loteSistema}</td>
                        {subMode === 'controle' && (
                          <td className="py-1.5 px-1.5 font-mono text-primary">#{r.quantidade}</td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
