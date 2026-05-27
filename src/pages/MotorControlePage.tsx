import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { Plus, Settings2, ScanBarcode, X, Eye, Sparkles, Lock, Unlock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { usePerformance } from '@/hooks/use-performance';


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
  if (CONTROLE_MODEL_MAP[trimmed]) return CONTROLE_MODEL_MAP[trimmed];
  const lower = trimmed.toLowerCase();
  if (CONTROLE_MODEL_MAP[lower]) return CONTROLE_MODEL_MAP[lower];
  return trimmed;
}

function sanitize(v: string) {
  return v.replace(/[`''']/g, '-');
}

export default function MotorControlePage() {
  const registros = useAppStore(s => s.registros);
  const history = useAppStore(s => s.history);
  const addRegistro = useAppStore(s => s.addRegistro);
  const setMode = useAppStore(s => s.setMode);
  const formData = useAppStore(s => s.formData);
  const setFormData = useAppStore(s => s.setFormData);
  const resetMotorFormData = useAppStore(s => s.resetMotorFormData);
  const lockMotorModelo = useAppStore(s => s.lockMotorModelo);
  const setLockMotorModelo = useAppStore(s => s.setLockMotorModelo);
  const lockMotorNf = useAppStore(s => s.lockMotorNf);
  const setLockMotorNf = useAppStore(s => s.setLockMotorNf);
  const { isLow } = usePerformance();

  useEffect(() => {
    setFormData({ activeTab: 'motor' });
  }, [setFormData]);


  
  const subMode = formData.motorSubMode;
  const modelo = formData.motorModelo;
  const nf = formData.motorNf;
  const serie = formData.motorSerie;
  const temCaixa = formData.motorTemCaixa;
  const caixaNum = formData.motorCaixaNum;

  const setSubMode = useCallback((val: 'motor' | 'controle') => setFormData({ motorSubMode: val }), [setFormData]);
  const setModelo = useCallback((val: string) => setFormData({ motorModelo: val }), [setFormData]);
  const setNf = useCallback((val: string) => setFormData({ motorNf: val }), [setFormData]);
  const setSerie = useCallback((val: string) => setFormData({ motorSerie: val }), [setFormData]);
  const setTemCaixa = useCallback((val: boolean) => setFormData({ motorTemCaixa: val }), [setFormData]);
  const setCaixaNum = useCallback((val: string) => setFormData({ motorCaixaNum: val }), [setFormData]);

  const serieRef = useRef<HTMLInputElement>(null);
  const modeloRef = useRef<HTMLInputElement>(null);

  const handleSubModeChange = useCallback((mode: 'motor' | 'controle') => {
    setSubMode(mode);
    setMode(mode);
  }, [setSubMode, setMode]);

  const resetFields = useCallback(() => {
    resetMotorFormData();
  }, [resetMotorFormData]);

  const cleanMotorSerie = useCallback((raw: string, mod: string): string => {
    let cleaned = raw.trim().replace(/\s+/g, ' ');
    if (mod) {
      const modLower = mod.toLowerCase();
      const lower = cleaned.toLowerCase();
      // Find the model anywhere in the string and take everything after it.
      // Handles cases like "1037549 5010594C B0Z25259200512" -> "B0Z25259200512"
      const idx = lower.lastIndexOf(modLower);
      if (idx !== -1) {
        cleaned = cleaned.slice(idx + mod.length).trim();
      }
    }
    // The series itself should be a single token (no spaces). Take the last token
    // to drop any leftover prefixes like internal codes preceding the actual serial.
    const tokens = cleaned.split(/\s+/).filter(Boolean);
    if (tokens.length > 0) {
      cleaned = tokens[tokens.length - 1];
    }
    return cleaned.trim();
  }, []);

  const cleanControleSerie = useCallback((raw: string): string => {
    let cleaned = raw.trim();
    // Drop everything before (and including) the last hyphen.
    // Handles cases like "4;10;2025 12Ç17Ç38 PM - 020858*1" -> "020858*1"
    const dashIdx = cleaned.lastIndexOf('-');
    if (dashIdx !== -1) {
      cleaned = cleaned.slice(dashIdx + 1).trim();
    }
    // Fallback: legacy 'FF' marker handling
    const ffIdx = cleaned.toUpperCase().indexOf('FF');
    if (ffIdx !== -1) cleaned = cleaned.slice(0, ffIdx).trim();
    return cleaned;
  }, []);

  const { allSeriesSet, maxSequencial } = useMemo(() => {
    const set = new Set<string>();
    let max = 0;
    const currentModelo = subMode === 'controle' ? mapModelo(modelo) : null;
    const currentNf = nf.trim();
    
    // Helper to process a registro
    const processReg = (r: { modoOrigem?: string; lote?: string; loteSistema?: string; item?: string; nf?: string }) => {
      if ((r.modoOrigem === 'motor' || r.modoOrigem === 'controle') && r.lote) {
        set.add(r.lote.trim().toLowerCase());
      }
      if (r.modoOrigem === 'controle' && r.loteSistema) {
        if (currentModelo && r.item !== currentModelo) return;
        if (currentNf && r.nf !== currentNf) return;
        const lastPart = r.loteSistema.split('*').pop();
        if (lastPart) {
          const num = parseInt(lastPart, 10);
          if (!isNaN(num) && num > max) max = num;
        }
      }
    };
    
    // Process current session
    for (let i = 0, len = registros.length; i < len; i++) processReg(registros[i]);
    
    // Process history - only scan motor/controle conferences
    for (let i = 0, len = history.length; i < len; i++) {
      const regs = history[i].registros;
      for (let j = 0, rLen = regs.length; j < rLen; j++) processReg(regs[j]);
    }
    
    return { allSeriesSet: set, maxSequencial: max };
  }, [registros, history, modelo, subMode, nf]);

  const isDuplicate = useCallback((cleanedSerie: string): boolean => {
    return allSeriesSet.has(cleanedSerie.trim().toLowerCase());
  }, [allSeriesSet]);

  const getSequencial = useCallback((): number => {
    return maxSequencial + 1;
  }, [maxSequencial]);

  const handleModeloBlur = useCallback(() => {
    if (subMode === 'controle' && modelo.trim()) {
      setModelo(mapModelo(modelo));
    }
  }, [subMode, modelo, setModelo]);

  const handleAddMotor = useCallback(() => {
    if (!modelo.trim()) { toast.warning('Preencha o Modelo'); return; }
    if (!serie.trim()) { toast.warning('Bipe a Série'); return; }

    // Remove trailing letter from motor model (e.g., 1246344B -> 1246344)
    const cleanedModelo = modelo.trim().replace(/[a-zA-Z]$/, '').trim();
    if (cleanedModelo !== modelo.trim()) {
      setModelo(cleanedModelo);
    }

    const cleaned = cleanMotorSerie(serie, cleanedModelo);
    if (!cleaned) { toast.warning('Série inválida'); return; }
    if (isDuplicate(cleaned)) { toast.warning('Série já cadastrada!'); setSerie(''); return; }

    const cxLabel = temCaixa ? `CX${caixaNum.padStart(2, '0')}` : 'S/CX';
    const nfLabel = nf.trim() ? `NF ${nf.trim()}` : '';
    const loteSistema = [cxLabel, nfLabel, cleaned].filter(Boolean).join(' ');

    addRegistro({
      id: crypto.randomUUID(),
      item: cleanedModelo,
      processo: '',
      nf: nf.trim(),
      endereco: '',
      m2: 0,
      mLinear: 0,
      largura: 0,
      lote: cleaned,
      loteSistema,
      quantidade: temCaixa ? parseInt(caixaNum, 10) || 0 : null,
      tipoTecido: 'Motor',
      modoOrigem: 'motor',
      isNew: true,
    });

    toast.success(`Motor adicionado: ${cleaned}`);
    resetMotorFormData();
    serieRef.current?.focus();
  }, [modelo, serie, nf, temCaixa, caixaNum, cleanMotorSerie, isDuplicate, addRegistro, resetMotorFormData]);

  const handleAddControle = useCallback(() => {
    const resolvedModelo = mapModelo(modelo);
    setModelo(resolvedModelo);

    if (!resolvedModelo.trim()) { toast.warning('Preencha o Modelo'); return; }
    if (!serie.trim()) { toast.warning('Bipe a Série'); return; }

    const cleaned = cleanControleSerie(serie);
    if (!cleaned) { toast.warning('Série inválida'); return; }
    if (isDuplicate(cleaned)) { toast.warning('Série já cadastrada!'); setSerie(''); return; }

    const seq = getSequencial();
    const loteSistema = nf.trim()
      ? `${resolvedModelo.trim()} NFe ${nf.trim()} ${cleaned}*${seq}`
      : `${resolvedModelo.trim()} ${cleaned}*${seq}`;

    addRegistro({
      id: crypto.randomUUID(),
      item: resolvedModelo.trim(),
      processo: '',
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

    toast.success(`Controle #${seq} adicionado: ${cleaned}`);
    resetMotorFormData();
    serieRef.current?.focus();
  }, [modelo, serie, nf, cleanControleSerie, isDuplicate, getSequencial, addRegistro, setModelo, resetMotorFormData]);

  const handleSerieKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (subMode === 'motor') handleAddMotor();
      else handleAddControle();
    }
  }, [subMode, handleAddMotor, handleAddControle]);

  const { motorCount, controleCount, currentItems } = useMemo(() => {
    let mCount = 0;
    let cCount = 0;
    const items = [];
    for (let i = 0, len = registros.length; i < len; i++) {
      const r = registros[i];
      if (r.modoOrigem === 'motor') mCount++;
      if (r.modoOrigem === 'controle') cCount++;
      if (r.modoOrigem === subMode) items.push(r);
    }
    return { 
      motorCount: mCount, 
      controleCount: cCount, 
      currentItems: items 
    };
  }, [registros, subMode]);

  const currentCount = subMode === 'motor' ? motorCount : controleCount;

  return (
    <div className="bg-background xl:border-r border-border/40 overflow-hidden flex flex-col h-full">
      <div className="p-3 sm:p-5 flex-1 overflow-y-auto space-y-3 sm:space-y-4 custom-scrollbar">

        {/* Subtoggle */}
        <div className="flex gap-2">
          {(['motor', 'controle'] as SubMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => handleSubModeChange(mode)}
              className={`flex-1 py-2.5 sm:py-3 rounded-full text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1 sm:gap-1.5 uppercase tracking-wider border ${
                subMode === mode
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{mode === 'motor' ? 'Motores' : 'Controles'}</span>
            </button>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-end text-xs text-muted-foreground">
          {(modelo || nf || serie) && (
            <Button variant="ghost" size="sm" onClick={resetFields} className="h-7 rounded-md text-[10px] font-medium text-destructive/70 hover:bg-destructive/10 hover:text-destructive px-2">
              Limpar campos
            </Button>
          )}
        </div>

        {/* Motor: caixa toggle */}
        {subMode === 'motor' && (
          <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-card border border-border/50">
            <Switch checked={temCaixa} onCheckedChange={setTemCaixa} className="data-[state=checked]:bg-primary flex-shrink-0" />
            <span className="text-[10px] sm:text-xs font-medium text-foreground">Armazenado em Caixa</span>
            <div className="flex items-center gap-1.5 sm:gap-2 ml-auto bg-primary/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-primary/20">
              {temCaixa ? (
                <>
                  <span className="text-[10px] font-semibold text-primary uppercase">Nº Caixa:</span>
                  <input
                    type="text" inputMode="numeric" value={caixaNum}
                    onChange={e => { const v = e.target.value.replace(/\D/g, ''); setCaixaNum(v); }}
                    className="w-10 bg-background border border-border/60 rounded-md text-center text-primary font-bold text-sm outline-none py-1 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer hover:border-primary/50 transition-colors"
                    title="Clique para alterar o número da caixa"
                  />
                  <Badge className="bg-primary text-primary-foreground font-bold text-[10px] rounded">CX{caixaNum.padStart(2, '0')}</Badge>
                </>
              ) : (
                <Badge className="bg-muted text-muted-foreground font-bold text-[10px] rounded border border-border/40">S/CX</Badge>
              )}
            </div>
          </div>
        )}

        {/* Form fields */}
        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Modelo / Marca</label>
              <button 
                onClick={() => setLockMotorModelo(!lockMotorModelo)}
                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                  lockMotorModelo 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                    : 'text-muted-foreground/40 hover:text-muted-foreground'
                }`}
              >
                {lockMotorModelo ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                {lockMotorModelo ? 'TRAVADO' : 'TRAVAR'}
              </button>
            </div>
            <div className="relative">
              <input
                ref={modeloRef}
                value={modelo}
                onChange={e => setModelo(sanitize(e.target.value))}
                onBlur={handleModeloBlur}
                placeholder={subMode === 'motor' ? 'Ex: SOMFY, DOOYA...' : 'Ex: 1870405, SI 1 PU...'}
                className={`w-full h-10 sm:h-11 rounded-lg border bg-muted/20 px-3 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-primary/10 transition-colors ${
                  lockMotorModelo 
                    ? 'border-amber-500/30 text-amber-700 dark:text-amber-300' 
                    : 'border-border/50'
                }`}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Nota Fiscal (NFe) <span className="text-muted-foreground/50 lowercase">— opcional</span></label>
              <button 
                onClick={() => setLockMotorNf(!lockMotorNf)}
                className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${
                  lockMotorNf 
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' 
                    : 'text-muted-foreground/40 hover:text-muted-foreground'
                }`}
              >
                {lockMotorNf ? <Lock className="w-2.5 h-2.5" /> : <Unlock className="w-2.5 h-2.5" />}
                {lockMotorNf ? 'TRAVADO' : 'TRAVAR'}
              </button>
            </div>
            <input
              value={nf}
              onChange={e => setNf(sanitize(e.target.value))}
              placeholder="Ex: 146842"
              className={`w-full h-10 sm:h-11 rounded-lg border bg-muted/20 px-3 text-xs sm:text-sm font-mono focus:ring-2 focus:ring-primary/10 transition-colors ${
                lockMotorNf 
                  ? 'border-amber-500/30 text-amber-700 dark:text-amber-300' 
                  : 'border-border/50'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Número de Série (S/N)</label>
            <div className="relative">
              <input
                ref={serieRef}
                value={serie}
                onChange={e => setSerie(e.target.value)}
                onKeyDown={handleSerieKeyDown}
                placeholder="Bipe o código agora..."
                className="w-full h-10 sm:h-11 rounded-lg border border-border/50 bg-muted/20 px-3 pr-10 text-xs sm:text-sm font-mono focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors placeholder:text-muted-foreground/30"
              />
              <ScanBarcode className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/30" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-2 pb-4">
          <Button
            onClick={subMode === 'motor' ? handleAddMotor : handleAddControle}
            className="w-full h-11 sm:h-12 rounded-xl font-semibold text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar {subMode === 'motor' ? 'Motor' : 'Controle'}
          </Button>

          {/* Preview table */}
          {currentCount > 0 && (
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-muted/90 z-10">
                    <tr>
                      {subMode === 'motor' && <th className="px-3 py-2 text-left font-medium text-muted-foreground">Caixa</th>}
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Modelo</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">NF</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Série</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Lote Final</th>
                      {subMode === 'controle' && <th className="px-3 py-2 text-left font-medium text-muted-foreground">Seq</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {currentItems.slice(-5).reverse().map(r => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        {subMode === 'motor' && (
                          <td className="px-3 py-2 font-mono text-primary/80">
                            {r.quantidade ? `CX${String(r.quantidade).padStart(2, '0')}` : 'S/CX'}
                          </td>
                        )}
                        <td className="px-3 py-2 font-medium">{r.item}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{r.nf || '—'}</td>
                        <td className="px-3 py-2 font-mono text-primary/80">{r.lote}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground text-[10px] truncate max-w-[140px]">{r.loteSistema}</td>
                        {subMode === 'controle' && (
                          <td className="px-3 py-2">
                            <Badge variant="outline" className="font-mono border-primary/20 text-primary bg-primary/5 text-[10px]">#{r.quantidade}</Badge>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
