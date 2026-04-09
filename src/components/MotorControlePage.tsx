import { useState, useRef, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useToastStore } from '@/hooks/useToast';
import { Zap, Plus, Package, Settings2, Eye } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { motion, AnimatePresence } from 'framer-motion';

type SubMode = 'motor' | 'controle';

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
    // Remove model prefix if present
    if (mod && cleaned.toLowerCase().startsWith(mod.toLowerCase())) {
      cleaned = cleaned.slice(mod.length).trim();
    }
    // Remove trailing letter
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

  const handleAddMotor = () => {
    if (!modelo.trim()) { addToast('Preencha o Modelo', 'warn'); return; }
    if (!nf.trim()) { addToast('Preencha a Nota Fiscal', 'warn'); return; }
    if (!serie.trim()) { addToast('Bipe a Série', 'warn'); return; }

    const cleaned = cleanMotorSerie(serie, modelo);
    if (!cleaned) { addToast('Série inválida', 'warn'); return; }
    if (isDuplicate(cleaned)) { addToast('Série já cadastrada!', 'warn'); setSerie(''); return; }

    const cxLabel = temCaixa ? `CX${caixaNum.padStart(2, '0')}` : 'S/CX';
    const loteSistema = `${modelo.trim()} NFe ${nf.trim()} ${cleaned} ${cxLabel}`;

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
    if (!modelo.trim()) { addToast('Preencha o Modelo', 'warn'); return; }
    if (!nf.trim()) { addToast('Preencha a Nota Fiscal', 'warn'); return; }
    if (!serie.trim()) { addToast('Bipe a Série', 'warn'); return; }

    const cleaned = cleanControleSerie(serie);
    if (!cleaned) { addToast('Série inválida', 'warn'); return; }
    if (isDuplicate(cleaned)) { addToast('Série já cadastrada!', 'warn'); setSerie(''); return; }

    const seq = getSequencial();
    const loteSistema = `${modelo.trim()} NFe ${nf.trim()} ${cleaned}`;

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

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-2xl mx-auto space-y-4">
      {/* Subtoggle */}
      <div className="flex gap-1 p-1 rounded-lg bg-muted border border-border">
        {(['motor', 'controle'] as SubMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => handleSubModeChange(mode)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all ${
              subMode === mode
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {mode === 'motor' ? 'Motor' : 'Controle'}
          </button>
        ))}
      </div>

      {/* Card */}
      <motion.div
        key={subMode}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-xl border p-4 sm:p-5 space-y-4 ${
          subMode === 'motor'
            ? 'bg-orange-50/50 border-orange-200/60'
            : 'bg-blue-50/50 border-blue-200/60'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {subMode === 'motor' ? <Package className="w-5 h-5 text-orange-600" /> : <Settings2 className="w-5 h-5 text-blue-600" />}
            <h2 className="text-base font-semibold text-foreground">
              Cadastro de {subMode === 'motor' ? 'Motor' : 'Controle'}
            </h2>
          </div>
          {currentCount > 0 && (
            <span className="text-xs font-mono bg-primary/10 text-primary px-2 py-1 rounded-md">
              {currentCount} {subMode === 'motor' ? 'motor(es)' : 'controle(s)'}
            </span>
          )}
        </div>

        {/* Motor: caixa toggle */}
        {subMode === 'motor' && (
          <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
            <Switch checked={temCaixa} onCheckedChange={setTemCaixa} />
            <span className="text-sm font-medium">Motor em Caixa</span>
            {temCaixa && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-muted-foreground">Nº:</span>
                <input
                  type="number"
                  min="1"
                  value={caixaNum}
                  onChange={e => setCaixaNum(e.target.value)}
                  className="w-14 rounded-md border border-border bg-background px-2 py-1 text-sm text-center"
                />
                <span className="text-xs font-mono bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                  CX{caixaNum.padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Modelo */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Modelo</label>
          <input
            ref={modeloRef}
            value={modelo}
            onChange={e => setModelo(sanitize(e.target.value))}
            placeholder={subMode === 'motor' ? 'Ex: SOMFY' : 'Ex: SI 5 PU'}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Nota Fiscal */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nota Fiscal (NFe)</label>
          <input
            value={nf}
            onChange={e => setNf(sanitize(e.target.value))}
            placeholder="Ex: 146842"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Série */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Série</label>
          <input
            ref={serieRef}
            value={serie}
            onChange={e => setSerie(e.target.value)}
            onKeyDown={handleSerieKeyDown}
            placeholder="Bipe o código de barras..."
            className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring font-mono"
          />
        </div>

        {/* Info text */}
        <div className="ai-status-box text-xs text-muted-foreground">
          {subMode === 'motor' ? (
            <>
              <Zap className="w-3 h-3 inline mr-1 text-primary" />
              O leitor envia <strong>Enter</strong> automaticamente após a bipagem.
              A série será limpa (modelo e letra removidos).
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 inline mr-1 text-primary" />
              Os dígitos antes de "<strong>F</strong>" serão extraídos automaticamente.
              Sequência: #{getSequencial()}
            </>
          )}
        </div>

        {/* Add button */}
        <button
          onClick={subMode === 'motor' ? handleAddMotor : handleAddControle}
          className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all ${
            subMode === 'motor'
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
          }`}
        >
          <Plus className="w-4 h-4" />
          Adicionar {subMode === 'motor' ? 'Motor' : 'Controle'}
        </button>
      </motion.div>

      {/* Preview of recent items */}
      {currentCount > 0 && (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase">Últimos cadastrados</span>
          </div>
          <div className="space-y-1 max-h-[200px] overflow-y-auto">
            {registros
              .filter(r => r.modoOrigem === subMode)
              .slice(-5)
              .reverse()
              .map(r => (
                <div key={r.id} className="flex justify-between items-center text-xs font-mono px-2 py-1.5 rounded bg-muted/50">
                  <span className="text-foreground truncate">{r.loteSistema}</span>
                  {r.quantidade && <span className="text-muted-foreground">#{r.quantidade}</span>}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
