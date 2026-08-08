import { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { Plus, Settings2, ScanBarcode, X, Eye, Sparkles, Lock, Unlock, Package, Hash, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePerformance } from '@/hooks/use-performance';
import FormPageLayout from '@/components/FormPageLayout';
import { parseCoulisseString } from '@/lib/app-utils';
import { printMotorLabel } from '@/services/printService';
import { itensCadastroService } from '@/services/itensCadastroService';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

type SubMode = 'motor' | 'controle' | 'coulisse';

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
  useDocumentTitle('Motor / Controle');
  const { registros, history, addRegistro, setMode, formData, setFormData, resetMotorFormData, lockMotorModelo, setLockMotorModelo, lockMotorNf, setLockMotorNf, labelSettings } = useAppStore();
  const { isLow } = usePerformance();
  
  useEffect(() => {
    setFormData({ activeTab: 'motor' });
    setMode(formData.motorSubMode === 'coulisse' ? 'motor' : (formData.motorSubMode || 'motor'));
  }, [setFormData, setMode, formData.motorSubMode]);

  const subMode = (formData.motorSubMode as SubMode) || 'motor';
  const modelo = formData.motorModelo || '';
  const nf = formData.motorNf || '';
  const serie = formData.motorSerie || '';
  const temCaixa = !!formData.motorTemCaixa;
  const caixaNum = formData.motorCaixaNum || '1';
  const coulisseModeloProcCx = formData.coulisseModeloProcCx || '';
  const coulisseLote = formData.coulisseLote || '';

  const setSubMode = useCallback((val: SubMode) => setFormData({ motorSubMode: val }), [setFormData]);
  const setModelo = useCallback((val: string) => setFormData({ motorModelo: val }), [setFormData]);
  const setNf = useCallback((val: string) => setFormData({ motorNf: val }), [setFormData]);
  const setSerie = useCallback((val: string) => setFormData({ motorSerie: val }), [setFormData]);
  const setTemCaixa = useCallback((val: boolean) => setFormData({ motorTemCaixa: val }), [setFormData]);
  const setCaixaNum = useCallback((val: string) => setFormData({ motorCaixaNum: val }), [setFormData]);
  const setCoulisseModeloProcCx = useCallback((val: string) => setFormData({ coulisseModeloProcCx: val }), [setFormData]);
  const setCoulisseLote = useCallback((val: string) => setFormData({ coulisseLote: val }), [setFormData]);

  const serieRef = useRef<HTMLInputElement>(null);

  const handleSubModeChange = useCallback((mode: SubMode) => {
    setSubMode(mode);
    setMode(mode === 'coulisse' ? 'motor' : mode);
  }, [setSubMode, setMode]);

  const resetFields = useCallback(() => resetMotorFormData(), [resetMotorFormData]);

  const cleanMotorSerie = useCallback((raw: string, mod: string): string => {
    let cleaned = raw.trim().replace(/\s+/g, ' ');
    if (mod) {
      const idx = cleaned.toLowerCase().lastIndexOf(mod.toLowerCase());
      if (idx !== -1) cleaned = cleaned.slice(idx + mod.length).trim();
    }
    const tokens = cleaned.split(/\s+/).filter(Boolean);
    return tokens.length > 0 ? tokens[tokens.length - 1] : cleaned.trim();
  }, []);

  const cleanControleSerie = useCallback((raw: string): string => {
    let cleaned = raw.trim();
    const dashIdx = cleaned.lastIndexOf('-');
    if (dashIdx !== -1) cleaned = cleaned.slice(dashIdx + 1).trim();
    const ffIdx = cleaned.toUpperCase().indexOf('FF');
    if (ffIdx !== -1) cleaned = cleaned.slice(0, ffIdx).trim();
    return cleaned;
  }, []);

  const { allSeriesSet, maxSequencial } = useMemo(() => {
    const set = new Set<string>();
    let max = 0;
    const currentModelo = subMode === 'controle' ? mapModelo(modelo) : null;
    const currentNf = nf.trim();
    
    const processReg = (r: any) => {
      if (!r) return;
      if ((r.modoOrigem === 'motor' || r.modoOrigem === 'controle') && r.lote) set.add(String(r.lote).trim().toLowerCase());
      if (r.modoOrigem === 'controle' && r.loteSistema) {
        if (currentModelo && r.item !== currentModelo) return;
        if (currentNf && r.nf !== currentNf) return;
        const lastPart = String(r.loteSistema).split('*').pop();
        const num = parseInt(lastPart || '', 10);
        if (!isNaN(num) && num > max) max = num;
      }
    };
    
    registros?.forEach(processReg);
    history?.forEach(conf => conf.registros?.forEach(processReg));
    return { allSeriesSet: set, maxSequencial: max };
  }, [registros, history, modelo, subMode, nf]);

  const isDuplicate = useCallback((cleanedSerie: string): boolean => allSeriesSet.has(cleanedSerie.trim().toLowerCase()), [allSeriesSet]);

  const handleAddMotor = useCallback(async () => {
    if (!modelo.trim()) { toast.warning('Preencha o Modelo'); return; }
    if (!serie.trim()) { toast.warning('Bipe a Série'); return; }

    const cleanedModelo = modelo.trim().replace(/[a-zA-Z]$/, '').trim();
    const cleaned = cleanMotorSerie(serie, cleanedModelo);
    if (!cleaned) { toast.warning('Série inválida'); return; }
    if (isDuplicate(cleaned)) { toast.warning('Série já cadastrada!'); setSerie(''); return; }

    // Converte código fornecedor → código interno
    const resolvedCad = await itensCadastroService.resolveItemFromScan(cleanedModelo, 'Motor');
    if (resolvedCad.source === 'fornecedor') {
      toast.success(`Fornecedor "${cleanedModelo}" → ${resolvedCad.codigoInterno}`);
    }

    const reg = {
      id: crypto.randomUUID(),
      item: resolvedCad.codigoInterno,
      nf: nf.trim(),
      lote: cleaned,
      loteSistema: [temCaixa ? `CX${caixaNum.padStart(2, '0')}` : 'S/CX', nf.trim() ? `NF ${nf.trim()}` : '', cleaned].filter(Boolean).join(' '),
      quantidade: temCaixa ? parseInt(caixaNum, 10) || 0 : null,
      tipoTecido: 'Motor',
      modoOrigem: 'motor',
      isNew: true,
      processo: '',
      endereco: '',
      m2: 0,
      mLinear: 0,
      largura: 0,
    };
    if (labelSettings.autoPrint) printMotorLabel({ 
      item: reg.item, 
      descricao: 'Motor', 
      lote: reg.lote, 
      loteSistema: reg.loteSistema, 
      nf: reg.nf, 
      cx: temCaixa ? (parseInt(caixaNum, 10) || 0) : null
    }, labelSettings);
    addRegistro(reg);
    toast.success(`Motor adicionado: ${cleaned}`);
    resetMotorFormData();
    serieRef.current?.focus();
  }, [modelo, serie, nf, temCaixa, caixaNum, cleanMotorSerie, isDuplicate, addRegistro, resetMotorFormData, labelSettings]);

  const handleAddControle = useCallback(async () => {
    const resolvedModelo = mapModelo(modelo);
    if (!resolvedModelo.trim()) { toast.warning('Preencha o Modelo'); return; }
    if (!serie.trim()) { toast.warning('Bipe a Série'); return; }

    const cleaned = cleanControleSerie(serie);
    if (!cleaned) { toast.warning('Série inválida'); return; }
    if (isDuplicate(cleaned)) { toast.warning('Série já cadastrada!'); setSerie(''); return; }

    // Converte código fornecedor → código interno
    const resolvedCad = await itensCadastroService.resolveItemFromScan(resolvedModelo.trim(), 'Controle');
    if (resolvedCad.source === 'fornecedor') {
      toast.success(`Fornecedor "${resolvedModelo.trim()}" → ${resolvedCad.codigoInterno}`);
    }
    const itemFinal = resolvedCad.codigoInterno;

    const seq = maxSequencial + 1;
    const reg = {
      id: crypto.randomUUID(),
      item: itemFinal,
      nf: nf.trim(),
      lote: cleaned,
      loteSistema: nf.trim() ? `${itemFinal} NFe ${nf.trim()} ${cleaned}*${seq}` : `${itemFinal} ${cleaned}*${seq}`,
      quantidade: seq,
      tipoTecido: 'Controle',
      modoOrigem: 'controle',
      isNew: true,
      processo: '',
      endereco: '',
      m2: 0,
      mLinear: 0,
      largura: 0,
    };
    if (labelSettings.autoPrint) printMotorLabel({ 
      item: reg.item, 
      descricao: 'Controle', 
      lote: reg.lote, 
      loteSistema: reg.loteSistema, 
      nf: reg.nf, 
      sequencial: seq, 
      cx: null
    }, labelSettings);
    addRegistro(reg);
    toast.success(`Controle #${seq} adicionado`);
    resetMotorFormData();
    serieRef.current?.focus();
  }, [modelo, serie, nf, cleanControleSerie, isDuplicate, maxSequencial, addRegistro, resetMotorFormData, labelSettings]);

  const handleAddCoulisse = useCallback(async () => {
    if (!coulisseModeloProcCx.trim()) { toast.warning('Preencha o Modelo/Proc/Cx'); return; }
    if (!coulisseLote.trim()) { toast.warning('Bipe o Lote'); return; }
    if (isDuplicate(coulisseLote)) { toast.warning('Lote já cadastrado!'); setCoulisseLote(''); return; }

    const parsed = parseCoulisseString(coulisseModeloProcCx);
    const modeloRaw = parsed.modelo || coulisseModeloProcCx.trim();
    // Converte código fornecedor → código interno
    const resolvedCad = await itensCadastroService.resolveItemFromScan(modeloRaw, 'Coulisse');
    if (resolvedCad.source === 'fornecedor') {
      toast.success(`Fornecedor "${modeloRaw}" → ${resolvedCad.codigoInterno}`);
    }

    const reg = {
      id: crypto.randomUUID(),
      item: resolvedCad.codigoInterno,
      processo: parsed.processo || '',
      nf: '',
      lote: coulisseLote.trim(),
      loteSistema: `${coulisseModeloProcCx.trim()} ${coulisseLote.trim()}`,
      quantidade: parsed.cx || 0,
      tipoTecido: 'Coulisse',
      modoOrigem: 'motor',
      isNew: true,
      endereco: '',
      m2: 0,
      mLinear: 0,
      largura: 0,
    };
    if (labelSettings.autoPrint) printMotorLabel({ 
      item: reg.item, 
      descricao: 'Coulisse', 
      lote: reg.lote, 
      loteSistema: reg.loteSistema, 
      cx: parsed.cx || null
    }, labelSettings);
    addRegistro(reg);
    toast.success(`Coulisse adicionado: ${coulisseLote}`);
    resetMotorFormData();
    serieRef.current?.focus();
  }, [coulisseModeloProcCx, coulisseLote, isDuplicate, addRegistro, resetMotorFormData, labelSettings]);

  return (
    <FormPageLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col min-h-screen bg-background pt-3 sm:pt-4">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 sm:p-5 space-y-4 sm:space-y-5 pb-24">
          <div className="flex bg-card/50 p-1.5 rounded-[2rem] border border-white/5 shadow-inner">
            {(['motor', 'controle', 'coulisse'] as SubMode[]).map(mode => (
              <button 
                key={mode} 
                onClick={() => handleSubModeChange(mode)} 
                className={`flex-1 py-2 sm:py-3.5 rounded-full text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.1em] transition-all duration-300 relative ${
                  subMode === mode 
                    ? 'text-primary-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {subMode === mode && (
                  <motion.div 
                    layoutId="activeSubMode" 
                    className="absolute inset-0 bg-primary rounded-full shadow-lg shadow-primary/30" 
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{mode === 'motor' ? 'Motores' : mode === 'controle' ? 'Controles' : 'Coulisse'}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={subMode}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {subMode === 'motor' && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-4 p-4 rounded-md bg-primary/5 border border-primary/10 shadow-sm"
                >
                  <Switch 
                    checked={temCaixa} 
                    onCheckedChange={setTemCaixa} 
                    className="data-[state=checked]:bg-primary"
                  />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-foreground uppercase tracking-wider">Armazenado em Caixa</p>
                    <p className="text-[10px] text-muted-foreground font-medium">Habilitar controle por caixa</p>
                  </div>
                  {temCaixa && (
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-2 bg-background/80 p-1.5 rounded-md border border-primary/20"
                    >
                      <span className="text-[10px] font-semibold text-primary px-2">Nº</span>
                      <input
                        type="text" inputMode="numeric" value={caixaNum}
                        onChange={e => setCaixaNum(e.target.value.replace(/\D/g, ''))}
                        className="w-12 bg-transparent text-center text-sm font-semibold text-primary outline-none"
                      />
                    </motion.div>
                  )}
                </motion.div>
              )}

              <div className="grid gap-3">
                {subMode === 'coulisse' ? (
                  <>
                    <div className="group space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">Modelo / Proc / Cx</label>
                        <button onClick={() => setLockMotorModelo(!lockMotorModelo)} className={`p-1 rounded-md transition-colors ${lockMotorModelo ? 'text-warning bg-amber-500/10' : 'text-muted-foreground/30'}`}>
                          {lockMotorModelo ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <input 
                        value={coulisseModeloProcCx} 
                        onChange={e => setCoulisseModeloProcCx(sanitize(e.target.value))} 
                        placeholder="Ex: MOTION CM-01 PROC 1234 CX01" 
                        className={`w-full h-12 sm:h-14 px-4 sm:px-5 rounded-md border bg-card/50 text-xs sm:text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all ${lockMotorModelo ? 'border-amber-500/30 text-warning' : 'border-white/5'}`} 

                      />
                    </div>
                    {coulisseModeloProcCx.trim() && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-md bg-primary/5 border border-primary/10 grid grid-cols-1 sm:grid-cols-3 gap-3 shadow-inner">
                        {(() => {
                          const p = parseCoulisseString(coulisseModeloProcCx);
                          return [
                            { label: 'Modelo', val: p.modelo, icon: <Package className="w-3 h-3" /> },
                            { label: 'Proc', val: p.processo, icon: <Hash className="w-3 h-3" /> },
                            { label: 'Cx', val: p.cx, icon: <Info className="w-3 h-3" /> }
                          ].map((item, i) => (
                            <div key={i} className="bg-background/40 p-2 rounded-md border border-white/5">
                              <div className="flex items-center gap-1.5 text-[8px] font-semibold text-muted-foreground/60 uppercase mb-1">
                                {item.icon} {item.label}
                              </div>
                              <div className="text-[11px] font-semibold text-foreground truncate">{item.val || '-'}</div>
                            </div>
                          ));
                        })()}
                      </motion.div>
                    )}
                    <div className="group space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 px-1">Lote</label>
                      <input 
                        ref={serieRef} 
                        value={coulisseLote} 
                        onChange={e => setCoulisseLote(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCoulisse()} 
                        placeholder="Bipe o lote agora..." 
                        className="w-full h-14 px-5 rounded-md border border-white/5 bg-card text-sm font-mono font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/20" 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="group space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">Modelo / Marca</label>
                        <button onClick={() => setLockMotorModelo(!lockMotorModelo)} className={`p-1 rounded-md transition-colors ${lockMotorModelo ? 'text-warning bg-amber-500/10' : 'text-muted-foreground/30'}`}>
                          {lockMotorModelo ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <input 
                        value={modelo} 
                        onChange={e => setModelo(sanitize(e.target.value))} 
                        placeholder={subMode === 'motor' ? 'Ex: SOMFY, DOOYA...' : 'Ex: 1870405, SI 1 PU...'} 
                        className={`w-full h-14 px-5 rounded-md border bg-card/50 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all ${lockMotorModelo ? 'border-amber-500/30 text-warning' : 'border-white/5'}`} 
                      />
                    </div>
                    <div className="group space-y-1.5">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">Nota Fiscal (NFe)</label>
                        <button onClick={() => setLockMotorNf(!lockMotorNf)} className={`p-1 rounded-md transition-colors ${lockMotorNf ? 'text-warning bg-amber-500/10' : 'text-muted-foreground/30'}`}>
                          {lockMotorNf ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <input 
                        value={nf} 
                        onChange={e => setNf(sanitize(e.target.value))} 
                        placeholder="Ex: 146842" 
                        className={`w-full h-14 px-5 rounded-md border bg-card/50 text-sm font-mono font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all ${lockMotorNf ? 'border-amber-500/30 text-warning' : 'border-white/5'}`} 
                      />
                    </div>
                    <div className="group space-y-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60 px-1">Série (S/N)</label>
                      <input 
                        ref={serieRef} 
                        value={serie} 
                        onChange={e => setSerie(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && (subMode === 'motor' ? handleAddMotor() : handleAddControle())} 
                        placeholder="Bipe a série..." 
                        className="w-full h-14 px-5 rounded-md border border-white/5 bg-card text-sm font-mono font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-muted-foreground/20" 
                      />
                    </div>
                  </>
                )}
              </div>
              
              <motion.div whileTap={{ scale: 0.98 }} className="pt-4">
                <Button 
                  onClick={subMode === 'motor' ? handleAddMotor : subMode === 'controle' ? handleAddControle : handleAddCoulisse} 
                  className="w-full h-16 rounded-[2rem] text-sm font-semibold tracking-[0.2em] shadow-2xl shadow-primary/40 hover:shadow-primary/50 transition-all border-t border-white/20"
                >
                  <Plus className="w-5 h-5 mr-3" strokeWidth={3} /> ADICIONAR {subMode}
                </Button>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </FormPageLayout>
  );
}
