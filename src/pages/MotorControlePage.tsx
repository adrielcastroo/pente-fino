import { useState, useRef, useMemo, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { toast } from 'sonner';
import { Plus, Settings2, ScanBarcode, X, Eye, Sparkles } from 'lucide-react';
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
  const addRegistro = useAppStore(s => s.addRegistro);
  const setMode = useAppStore(s => s.setMode);
  const formData = useAppStore(s => s.formData);
  const setFormData = useAppStore(s => s.setFormData);
  const resetMotorFormData = useAppStore(s => s.resetMotorFormData);
  const { isLow } = usePerformance();

  
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
    let cleaned = raw.trim();
    if (mod && cleaned.toLowerCase().startsWith(mod.toLowerCase())) {
      cleaned = cleaned.slice(mod.length).trim();
    }
    return cleaned.trim();
  }, []);

  const cleanControleSerie = useCallback((raw: string): string => {
    const idx = raw.toUpperCase().indexOf('FF');
    if (idx !== -1) return raw.slice(0, idx).trim();
    return raw.trim();
  }, []);

  const { allSeriesSet, maxSequencial } = useMemo(() => {
    const set = new Set<string>();
    let max = 0;
    const currentModelo = subMode === 'controle' ? mapModelo(modelo) : null;
    const currentNf = nf.trim();
    
    // 1. Process current session
    for (let i = 0, len = registros.length; i < len; i++) {
      const r = registros[i];
      if ((r.modoOrigem === 'motor' || r.modoOrigem === 'controle') && r.lote) {
        set.add(`${r.lote}|${(r.nf || '').trim()}`);
      }
      if (r.modoOrigem === 'controle' && r.loteSistema) {
        if (currentModelo && r.item !== currentModelo) continue;
        if (currentNf && r.nf !== currentNf) continue;

        const lastPart = r.loteSistema.split('*').pop();
        if (lastPart) {
          const num = parseInt(lastPart, 10);
          if (!isNaN(num) && num > max) max = num;
        }
      }
    }

    // 2. Process history
    const history = useAppStore.getState().history;
    for (let i = 0, len = history.length; i < len; i++) {
      const conf = history[i];
      const regs = conf.registros;
      for (let j = 0, rLen = regs.length; j < rLen; j++) {
        const r = regs[j];
        if ((r.modoOrigem === 'motor' || r.modoOrigem === 'controle') && r.lote) {
          set.add(`${r.lote}|${(r.nf || '').trim()}`);
        }
        if (r.modoOrigem === 'controle' && r.loteSistema) {
          if (currentModelo && r.item !== currentModelo) continue;
          if (currentNf && r.nf !== currentNf) continue;

          const lastPart = r.loteSistema.split('*').pop();
          if (lastPart) {
            const num = parseInt(lastPart, 10);
            if (!isNaN(num) && num > max) max = num;
          }
        }
      }
    }
    
    return { allSeriesSet: set, maxSequencial: max };
  }, [registros, modelo, subMode, nf]);

  const isDuplicate = useCallback((cleanedSerie: string): boolean => {
    return allSeriesSet.has(`${cleanedSerie}|${nf.trim()}`);
  }, [allSeriesSet, nf]);

  const getSequencial = useCallback((): number => {
    return maxSequencial + 1;
  }, [maxSequencial]);

  const handleModeloBlur = useCallback(() => {
    if (subMode === 'controle') {
      setModelo(mapModelo(modelo));
    }
  }, [subMode, modelo, setModelo]);

  const handleAddMotor = useCallback(() => {
    if (!modelo.trim()) { toast.warning('Preencha o Modelo'); return; }
    if (!serie.trim()) { toast.warning('Bipe a Série'); return; }

    const cleaned = cleanMotorSerie(serie, modelo);
    if (!cleaned) { toast.warning('Série inválida'); return; }
    if (isDuplicate(cleaned)) { toast.warning('Série já cadastrada!'); setSerie(''); return; }

    const cxLabel = temCaixa ? `CX${caixaNum.padStart(2, '0')}` : 'S/CX';
    const loteSistema = nf.trim()
      ? `${cxLabel} NF ${nf.trim()} série ${cleaned}`
      : `${cxLabel} série ${cleaned}`;

    addRegistro({
      id: crypto.randomUUID(),
      item: modelo.trim(),
      processo: '',
      nf: nf.trim(),
      endereco: '',
      m2: 0,
      mLinear: 0,
      largura: 0,
      lote: cleaned,
      loteSistema,
      quantidade: 1,
      tipoTecido: 'Motor',
      modoOrigem: 'motor',
      isNew: true,
    });

    toast.success(`Motor adicionado: ${cleaned}`);
    setSerie('');
    serieRef.current?.focus();
  }, [modelo, serie, nf, temCaixa, caixaNum, cleanMotorSerie, isDuplicate, addRegistro, setSerie]);

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
      quantidade: 1,
      tipoTecido: 'Controle',
      modoOrigem: 'controle',
      isNew: true,
    });

    toast.success(`Controle #${seq} adicionado: ${cleaned}`);
    setSerie('');
    serieRef.current?.focus();
  }, [modelo, serie, nf, cleanControleSerie, isDuplicate, getSequencial, addRegistro, setModelo, setSerie]);

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
    <div
      className="bg-background/40 xl:border-r border-border/40 overflow-hidden flex flex-col h-full shadow-[20px_0_50px_-20px_rgba(0,0,0,0.1)] transition-all duration-300"
    >
      <div className="p-3 sm:p-5 xl:p-8 flex-1 overflow-y-auto space-y-4 sm:space-y-6 xl:space-y-8 custom-scrollbar relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

        {/* Subtoggle */}
        <div className="flex bg-muted/40 border border-border/40 rounded-[1.5rem] p-1.5 gap-2 shadow-inner relative z-10 backdrop-blur-md">
          {(['motor', 'controle'] as SubMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => handleSubModeChange(mode)}
              className={`flex-1 py-4 rounded-[1.2rem] text-[10px] sm:text-xs font-black transition-all duration-300 flex items-center justify-center gap-2.5 uppercase tracking-[0.15em] relative overflow-hidden group/mode ${
                subMode === mode
                  ? 'bg-primary text-white shadow-xl shadow-primary/30'
                  : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/50 dark:hover:bg-black/20'
              }`}
            >
              {subMode === mode && <div className="absolute inset-0 bg-primary shadow-xl shadow-primary/30 z-0" />}
              <Settings2 className={`w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-300 ${subMode === mode ? 'rotate-0' : '-rotate-12 group-hover/mode:rotate-0'}`} />
              <span className="relative z-10">{mode === 'motor' ? 'Motores' : 'Controles'}</span>
            </button>
          ))}
        </div>

        {/* Tip bar */}
        <div
          className="p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-primary/5 border border-primary/20 text-xs leading-relaxed flex items-center justify-between gap-2 group/tip shadow-lg relative overflow-hidden z-10"
        >
          <div className="flex items-center gap-3 sm:gap-4 font-bold text-primary/70 relative z-10 min-w-0">
            <div className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-primary/10 flex-shrink-0 group-hover/tip:scale-110 transition-all duration-300 shadow-sm border border-primary/10">
              <ScanBarcode className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[9px] uppercase tracking-widest opacity-60">Assistente de Registro</span>
              <span className="text-foreground/80 font-black text-[11px] sm:text-xs">
                {subMode === 'motor'
                  ? <>Leitor configurado com <kbd className="kbd px-1 sm:px-1.5 py-0.5 rounded-lg bg-background text-primary border-b-4 border-primary/20 font-black text-[10px]">Enter</kbd> automático.</>
                  : <>Extração automática antes de "FF". Sequência atual: <span className="text-primary">#{getSequencial()}</span></>
                }
              </span>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0 relative z-10">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={resetFields} className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-border/40 hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-destructive/30">
                  <X className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="font-bold rounded-xl shadow-2xl p-3 bg-popover/95">Limpar campos</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Motor: caixa toggle */}
        {subMode === 'motor' && (
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 p-3 sm:p-5 rounded-3xl bg-card/30 border border-border/40 shadow-sm relative z-10 backdrop-blur-md transition-all hover:border-primary/20">
            <Switch checked={temCaixa} onCheckedChange={setTemCaixa} className="data-[state=checked]:bg-primary flex-shrink-0" />
            <div className="flex flex-col min-w-0">
               <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Logística</span>
               <span className="text-xs font-black text-foreground">Motor Armazenado em Caixa</span>
            </div>
            {temCaixa && (
              <div className="flex items-center gap-2 sm:gap-3 ml-auto bg-primary/10 px-3 sm:px-4 py-2 rounded-2xl border border-primary/20 flex-shrink-0">
                <span className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-widest whitespace-nowrap">Nº Caixa:</span>
                <input
                  type="number"
                  min="1"
                  value={caixaNum}
                  onChange={e => setCaixaNum(e.target.value)}
                  className="w-10 sm:w-12 bg-transparent border-none text-primary font-black text-sm outline-none p-0 focus:ring-0"
                />
                <Badge className="bg-primary text-white font-black text-[10px] rounded-lg whitespace-nowrap">CX{caixaNum.padStart(2, '0')}</Badge>
              </div>
            )}
          </div>
        )}

        <div className="space-y-6 relative z-10">
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2 opacity-50 ml-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Atributos do Componente
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8">
            {/* Modelo */}
            <div className="space-y-3 group/field">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 group-focus-within/field:text-primary transition-colors">Modelo / Marca</label>
              <input
                ref={modeloRef}
              value={modelo}
                onChange={e => setModelo(sanitize(e.target.value))}
                onBlur={handleModeloBlur}
                placeholder={subMode === 'motor' ? 'Ex: SOMFY, DOOYA...' : 'Ex: 1870405, SI 1 PU...'}
                className="w-full h-12 sm:h-16 rounded-2xl sm:rounded-3xl border-2 border-border/40 bg-card/30 px-4 sm:px-6 text-sm font-bold focus:border-primary focus:bg-background focus:ring-8 focus:ring-primary/5 transition-all duration-500 shadow-sm"
              />
            </div>

            {/* Nota Fiscal */}
            <div className="space-y-3 group/field">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 group-focus-within/field:text-primary transition-colors">Nota Fiscal (NFe) <span className="text-[10px] opacity-40 lowercase">— opcional</span></label>
              <input
                value={nf}
                onChange={e => setNf(sanitize(e.target.value))}
                placeholder="Ex: 146842"
                className="w-full h-12 sm:h-16 rounded-2xl sm:rounded-3xl border-2 border-border/40 bg-card/30 px-4 sm:px-6 text-sm font-bold focus:border-primary focus:bg-background focus:ring-8 focus:ring-primary/5 transition-all duration-500 shadow-sm font-mono"
              />
            </div>

            {/* Série */}
            <div className="space-y-3 group/field">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 group-focus-within/field:text-primary transition-colors">Número de Série (S/N)</label>
              <div className="relative">
                <input
                  ref={serieRef}
                  value={serie}
                  onChange={e => setSerie(e.target.value)}
                  onKeyDown={handleSerieKeyDown}
                  placeholder="Bipe o código agora..."
                  className="w-full h-12 sm:h-16 rounded-2xl sm:rounded-3xl border-2 border-border/40 bg-card/30 px-4 sm:px-6 text-sm font-black focus:border-primary focus:bg-background focus:ring-8 focus:ring-primary/5 transition-all duration-500 shadow-sm font-mono placeholder:opacity-30"
                />
                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/40"><ScanBarcode className="w-5 h-5" /></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 relative z-10">
          <Button
            onClick={subMode === 'motor' ? handleAddMotor : handleAddControle}
            className="w-full h-14 sm:h-16 rounded-2xl sm:rounded-[1.8rem] bg-primary text-white font-black text-sm sm:text-lg uppercase tracking-[0.15em] sm:tracking-[0.25em] shadow-[0_20px_40px_-10px_rgba(var(--primary),0.3)] transition-all hover:-translate-y-1 active:translate-y-0.5 group/add relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/add:translate-y-0 transition-transform duration-500" />
            <div className="relative z-10 flex items-center justify-center gap-3">
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 group-hover/add:rotate-90 transition-transform duration-700" />
              <span>Adicionar {subMode === 'motor' ? 'Motor' : 'Controle'}</span>
            </div>
          </Button>
        </div>

        {/* Preview table - Adaptive for mobile */}
        {currentCount > 0 && (
          <div 
            className="overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border-2 border-primary/10 bg-card/60 shadow-2xl mt-4 sm:mt-8 relative z-10"
          >
            <div className="p-4 sm:p-5 border-b border-border/10 bg-primary/5 flex items-center justify-between">
               <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-primary/10 text-primary"><Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" /></div>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em] text-primary/80">Recém Cadastrados</span>
               </div>
               <Badge className="bg-primary text-white font-black px-2 sm:px-2.5 h-5 sm:h-6 rounded-lg text-[9px] sm:text-[10px]">{currentCount} Itens</Badge>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-[11px] border-separate border-spacing-0">
                <thead>
                  <tr className="bg-background/90 backdrop-blur-md">
                    {subMode === 'motor' && <th className="px-5 py-4 text-left font-black uppercase tracking-[0.1em] opacity-40 border-b border-border/10">Caixa</th>}
                    <th className="px-5 py-4 text-left font-black uppercase tracking-[0.1em] opacity-40 border-b border-border/10">Modelo</th>
                    <th className="px-5 py-4 text-left font-black uppercase tracking-[0.1em] opacity-40 border-b border-border/10">NF</th>
                    <th className="px-5 py-4 text-left font-black uppercase tracking-[0.1em] opacity-40 border-b border-border/10">Série</th>
                    <th className="px-5 py-4 text-left font-black uppercase tracking-[0.1em] opacity-40 border-b border-border/10">Lote Final</th>
                    {subMode === 'controle' && <th className="px-5 py-4 text-left font-black uppercase tracking-[0.1em] opacity-40 border-b border-border/10">Seq</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/10">
                  {currentItems
                    .slice(-5)
                    .reverse()
                    .map(r => (
                      <tr key={r.id} className="group/row hover:bg-primary/5 transition-all duration-300">
                        {subMode === 'motor' && (
                          <td className="px-5 py-4 font-mono font-black text-primary/80">
                            {r.quantidade ? `CX${String(r.quantidade).padStart(2, '0')}` : 'S/CX'}
                          </td>
                        )}
                        <td className="px-5 py-4 font-black tracking-tight text-foreground/80">{r.item}</td>
                        <td className="px-5 py-4 font-mono font-bold opacity-50">{r.nf || '—'}</td>
                        <td className="px-5 py-4 font-mono font-black text-primary/70">{r.lote}</td>
                        <td className="px-5 py-4 font-mono font-bold text-[10px] opacity-40 truncate max-w-[140px]">{r.loteSistema}</td>
                        {subMode === 'controle' && (
                          <td className="px-5 py-4">
                             <Badge variant="outline" className="font-black font-mono border-primary/20 text-primary bg-primary/5">#{r.quantidade}</Badge>
                          </td>
                        )}
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-muted/20 border-t border-border/10 text-center">
               <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Exibindo os últimos 5 itens registrados</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

