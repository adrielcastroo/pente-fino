import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { extractLarguraFromItem, formatML, generateLoteSistema, generateLoteSistemaCaixa, ENDERECO_REGEX } from '@/lib/app-utils';
import { Registro, FormData } from '@/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Image, Video, Download, X, Undo2, ScanBarcode,
  Plus, Zap, SquarePen, Layers3, Lock, Unlock, Package, Eye, EyeOff,
  Trash2, CheckCircle2, AlertTriangle, LayoutGrid, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';



const VISION_PROMPT = `Você é um especialista em leitura de etiquetas de rolos de tecido. Analise a imagem e extraia:

ITEM (código do tecido): Item, Ref, Item No, Description, Artigo, Part No
M² (metragem quadrada): QUANTITY, Q'TY, Quantity, Qty
LARGURA (largura do tecido): WIDTH, Width, Largura

Retorne SOMENTE JSON: {"item":"<código>","m2":<número float ou null>,"width":<número inteiro ou null>}`;

export default function LeftPanel() {
  const currentMode = useAppStore(s => s.currentMode);
  const setMode = useAppStore(s => s.setMode);
  const processo = useAppStore(s => s.processo);
  const setProcesso = useAppStore(s => s.setProcesso);
  const registros = useAppStore(s => s.registros);
  const addRegistro = useAppStore(s => s.addRegistro);
  const undoAction = useAppStore(s => s.undo);
  const undoStack = useAppStore(s => s.undoStack);
  const lockProcesso = useAppStore(s => s.lockProcesso);
  const setLockProcesso = useAppStore(s => s.setLockProcesso);
  const lockedProcesso = useAppStore(s => s.lockedProcesso);
  const setLockedProcesso = useAppStore(s => s.setLockedProcesso);
  const lockNf = useAppStore(s => s.lockNf);
  const setLockNf = useAppStore(s => s.setLockNf);
  const lockedNf = useAppStore(s => s.lockedNf);
  const setLockedNf = useAppStore(s => s.setLockedNf);
  const lockEndereco = useAppStore(s => s.lockEndereco);
  const setLockEndereco = useAppStore(s => s.setLockEndereco);
  const lockedEndereco = useAppStore(s => s.lockedEndereco);
  const setLockedEndereco = useAppStore(s => s.setLockedEndereco);
  const formData = useAppStore(s => s.formData);
  const setFormData = useAppStore(s => s.setFormData);
  const resetFormData = useAppStore(s => s.resetFormData);
  

  const {
    item, nf, m2, lote, endereco, aiLargura, aiMLinear, diversosTipo, diversosMLinear,
    manualLargura, coulisseMetragem, lockMetragem, madeiraTipo, quantidade
  } = formData;

  const [fotoB64, setFotoB64] = useState<string | null>(null);
  const [fotoMime, setFotoMime] = useState('image/jpeg');
  const [preview, setPreview] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [progress, setProgress] = useState(0);
  const [enderecoError, setEnderecoError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  const itemRef = useRef<HTMLInputElement>(null);
  const nfRef = useRef<HTMLInputElement>(null);
  const m2Ref = useRef<HTMLInputElement>(null);
  const larguraRef = useRef<HTMLInputElement>(null);
  const loteRef = useRef<HTMLInputElement>(null);
  const enderecoRef = useRef<HTMLInputElement>(null);

  const [showPreview, setShowPreview] = useState(false);
  const quantidadeRef = useRef<HTMLInputElement>(null);
  const manualLarguraRef = useRef<HTMLInputElement>(null);

  // Helper setters for compatibility with existing code
  const setItem = (val: string) => setFormData({ item: val });
  const setNf = (val: string) => setFormData({ nf: val });
  const setM2 = (val: string) => setFormData({ m2: val });
  const setLote = (val: string) => setFormData({ lote: val });
  const setEndereco = (val: string) => setFormData({ endereco: val });
  const setAiLargura = (val: string) => setFormData({ aiLargura: val });
  const setAiMLinear = (val: string) => setFormData({ aiMLinear: val });
  const setDiversosTipo = (val: FormData['diversosTipo']) => setFormData({ diversosTipo: val });
  const setDiversosMLinear = (val: string) => setFormData({ diversosMLinear: val });
  const setManualLargura = (val: string) => setFormData({ manualLargura: val });
  const setCoulisseMetragem = (val: 'm2' | 'mlinear') => setFormData({ coulisseMetragem: val });
  const setLockMetragem = (val: boolean) => setFormData({ lockMetragem: val });
  const setMadeiraTipo = (val: FormData['madeiraTipo']) => setFormData({ madeiraTipo: val });
  const setQuantidade = (val: string) => setFormData({ quantidade: val });

  const m2Num = useMemo(() => parseFloat(m2) || 0, [m2]);
  const aiLarguraNum = useMemo(() => parseFloat(aiLargura) || 0, [aiLargura]);
  const aiMLinearNum = useMemo(() => parseFloat(aiMLinear) || 0, [aiMLinear]);
  const diversosMLinearNum = useMemo(() => parseFloat(diversosMLinear) || 0, [diversosMLinear]);
  const manualLarguraNum = useMemo(() => parseFloat(manualLargura) || 0, [manualLargura]);
  const isAI = currentMode === 'openrouter';
  const isDiversos = currentMode === 'diversos';
  const isMadeira = currentMode === 'madeira';
  const isPVT = isDiversos && diversosTipo === 'PVT';
  const isCelular = isDiversos && diversosTipo === 'Celular';
  const isRolo = isDiversos && diversosTipo === 'Rolo';
  const isCortina = isDiversos && diversosTipo === 'Cortina';
  const isHC45 = isCelular && item.toUpperCase().startsWith('HC-45');
  const celularDivisor = isHC45 ? 3.66 : 3.05;

  // Celular uses PROC instead of NF
  const requiresProcesso = isMadeira || (!isDiversos || isCelular);
  const requiresNF = isDiversos && !isCelular;
  const isCoulisse = currentMode === 'manual';
  const coulisseUsesM2 = isCoulisse && coulisseMetragem === 'm2';
  const coulisseUsesMLinear = isCoulisse && coulisseMetragem === 'mlinear';
  const usesM2Input = !isMadeira && !isAI && !isPVT && !coulisseUsesMLinear && (isRolo || isCortina || isCoulisse || isCelular);
  const usesLarguraFromItem = !isAI && (isRolo || isCortina);
  const requiresEndereco = !isMadeira && !isPVT && !isCelular;

  const madeiraDefaults: Record<string, number> = { 'Lâmina': 100, 'Base': 24, 'Bandô': 24 };

  const largura = useMemo(() => 
    isAI ? aiLarguraNum
    : isMadeira ? 0
    : isCoulisse ? (manualLarguraNum || extractLarguraFromItem(item))
    : isCelular ? celularDivisor
    : usesLarguraFromItem ? extractLarguraFromItem(item)
    : 0,
    [isAI, aiLarguraNum, isMadeira, isCoulisse, manualLarguraNum, item, isCelular, celularDivisor, usesLarguraFromItem]
  );

  const mLinear = useMemo(() => 
    isAI ? aiMLinearNum
    : isMadeira ? 0
    : (isPVT || coulisseUsesMLinear) ? diversosMLinearNum
    : isCelular ? (m2Num > 0 ? m2Num / celularDivisor : 0)
    : (largura > 0 ? m2Num / largura : 0),
    [isAI, aiMLinearNum, isMadeira, isPVT, coulisseUsesMLinear, diversosMLinearNum, isCelular, m2Num, celularDivisor, largura]
  );
  
  const isDuplicate = useMemo(() => 
    !isMadeira && item && registros.some(r => r.item.toLowerCase() === item.toLowerCase()),
    [isMadeira, item, registros]
  );

  

  const formatEndereco = (val: string): string => {
    const clean = val.toUpperCase().replace(/\./g, '');
    if (clean.length <= 5) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 5)}.${clean.slice(5)}`;
    return `${clean.slice(0, 5)}.${clean.slice(5, 6)}.${clean.slice(6)}`;
  };

  const validateEndereco = (val: string) => {
    if (!val) { setEnderecoError(''); return; }
    setEnderecoError(ENDERECO_REGEX.test(val) ? '' : 'Padrão: TEC01.A.N03');
  };

  // Sync locked endereco
  useEffect(() => {
    if (lockEndereco && lockedEndereco) {
      setEndereco(lockedEndereco);
    }
  }, [lockEndereco, lockedEndereco]);

  useEffect(() => {
    if (lockProcesso && lockedProcesso && processo !== lockedProcesso) {
      setProcesso(lockedProcesso);
    }
  }, [lockProcesso, lockedProcesso, processo, setProcesso]);

  useEffect(() => {
    if (lockNf && lockedNf) {
      setNf(lockedNf);
    }
  }, [lockNf, lockedNf]);

  const getPhotoFileName = useCallback(() => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const time = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const safeItem = (item || 'rolo').trim().replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 24);
    return `conferencia_${date}_${safeItem}_${time}.jpg`;
  }, [item]);

  const downloadDataUrl = useCallback((dataUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const autoSaveCapturedPhoto = useCallback((dataUrl: string) => {
    downloadDataUrl(dataUrl, getPhotoFileName());
    toast.success('Foto salva automaticamente');
  }, [downloadDataUrl, getPhotoFileName]);

  const resetForm = () => {
    resetFormData();
    setAiStatus(null); setProgress(0);
    setEnderecoError('');
    stopCamera();
    setTimeout(() => itemRef.current?.focus(), 50);
  };

  const loadFile = useCallback((file: File, options?: { autoSave?: boolean }) => {
    setFotoMime(file.type || 'image/jpeg');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setFotoB64(result.split(',')[1]);
      setPreview(result);
      if (options?.autoSave) autoSaveCapturedPhoto(result);
    };
    reader.readAsDataURL(file);
  }, [autoSaveCapturedPhoto]);

  const openNativeCamera = () => { cameraInputRef.current?.click(); };

  const openLiveCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      openNativeCamera();
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const snapPhoto = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth || 1280;
    c.height = v.videoHeight || 720;
    c.getContext('2d')?.drawImage(v, 0, 0, c.width, c.height);
    const url = c.toDataURL('image/jpeg', 0.85);
    setFotoB64(url.split(',')[1]);
    setFotoMime('image/jpeg');
    setPreview(url);
    autoSaveCapturedPhoto(url);
    stopCamera();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) loadFile(f);
  };

  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const it of items) {
      if (it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) { loadFile(f); toast.success('Imagem colada'); }
        break;
      }
    }
  }, [loadFile]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste as any);
    return () => document.removeEventListener('paste', handlePaste as any);
  }, [handlePaste]);

  const handleFieldKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement> | null) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
        nextRef.current.select();
      } else {
        handleAdd();
      }
    }
  };

  const handleEnderecoChange = (val: string) => {
    const normalized = val.replace(/[''`]/g, '-');
    const formatted = formatEndereco(normalized);
    setEndereco(formatted);
    validateEndereco(formatted);
    if (lockEndereco) setLockedEndereco(formatted);
  };

  const toggleLockEndereco = () => {
    if (!lockEndereco) {
      setLockedEndereco(endereco);
      setLockEndereco(true);
      toast.success('Endereço travado');
    } else {
      setLockEndereco(false);
      toast.success('Endereço destravado');
    }
  };

  const handleProcessoChange = (val: string) => {
    const normalized = val.replace(/[''`]/g, '-');
    setProcesso(normalized);
    if (lockProcesso) setLockedProcesso(normalized);
  };

  const handleNfChange = (val: string) => {
    const normalized = val.replace(/[''`]/g, '-');
    setNf(normalized);
    if (lockNf) setLockedNf(normalized);
  };

  const normalizeScannerInput = (val: string) => val.replace(/[''`]/g, '-');

  const handleItemChange = (val: string) => {
    setItem(normalizeScannerInput(val));
  };

  const toggleLockProcesso = () => {
    if (!lockProcesso) {
      setLockedProcesso(processo);
      setLockProcesso(true);
      toast.success('PROC travado');
    } else {
      setLockProcesso(false);
      toast.success('PROC destravado');
    }
  };

  const toggleLockNf = () => {
    if (!lockNf) {
      setLockedNf(nf);
      setLockNf(true);
      toast.success('NF travada');
    } else {
      setLockNf(false);
      toast.success('NF destravada');
    }
  };

  const applyResult = (parsed: any, provider: string) => {
    if (parsed.item) setItem(parsed.item);
    if (parsed.width) {
      const widthNum = parseInt(parsed.width, 10);
      if (widthNum > 0) {
        const larguraM = widthNum / 100;
        setAiLargura(larguraM.toFixed(2));
      }
    }
    if (parsed.m2) {
      const m2Val = parseFloat(parsed.m2);
      setM2(m2Val.toFixed(1));
      const widthNum = parsed.width ? parseInt(parsed.width, 10) / 100 : 0;
      if (widthNum > 0 && m2Val > 0) {
        setAiMLinear((m2Val / widthNum).toFixed(1));
      }
    }
    const widthInfo = parsed.width ? ` · Larg ${(parseInt(parsed.width, 10) / 100).toFixed(2)}m` : '';
    return `✓ ${provider}: ${parsed.item || '—'} · M² ${parsed.m2 || '—'}${widthInfo}`;
  };

  const processOpenRouter = async () => {
    if (!fotoB64) { toast.warning('Adicione uma foto primeiro.'); return; }
    const key = localStorage.getItem('cft4_or_key') || '';
    if (!key) { toast.warning('Configure a chave OpenRouter em ⚙️ API.'); return; }
    const model = localStorage.getItem('cft4_or_model') || 'anthropic/claude-3-haiku';
    setAiLoading(true); setProgress(30); setAiStatus(null);
    try {
      const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: [{ type: 'image_url', image_url: { url: 'data:' + fotoMime + ';base64,' + fotoB64 } }, { type: 'text', text: VISION_PROMPT }] }], max_tokens: 300, temperature: 0.1 })
      });
      setProgress(80);
      if (!resp.ok) { const e = await resp.json().catch(() => ({})); throw new Error(e.error?.message || `HTTP ${resp.status}`); }
      const data = await resp.json();
      const raw = (data.choices?.[0]?.message?.content || '').replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(raw);
      const summary = applyResult(parsed, model.split('/').pop() || 'OpenRouter');
      setProgress(100); setTimeout(() => setProgress(0), 700);
      setAiStatus({ msg: summary, type: 'ok' });
      toast.success('OpenRouter processou com sucesso');
    } catch (e: any) {
      setProgress(0);
      setAiStatus({ msg: '❌ ' + e.message, type: 'err' });
      toast.error('Erro OpenRouter: ' + e.message);
    }
    setAiLoading(false);
  };

  const handleAdd = () => {
    const state = useAppStore.getState();
    const proc = state.processo.trim();
    const conf = state.conferente;
    if (requiresProcesso && !proc) { toast.warning('Preencha o campo PROCESSO.'); return; }
    if (!conf) { toast.warning('Preencha o campo CONFERENTE.'); return; }
    if (!item) { toast.warning('Preencha o campo Item.'); return; }
    if (requiresNF && !nf.trim()) { toast.warning('Preencha o campo NF.'); return; }

    if (isMadeira) {
      const qtd = parseInt(quantidade) || madeiraDefaults[madeiraTipo];
      const loteSistema = generateLoteSistemaCaixa(proc, item, 0, registros);
      const reg = {
        id: crypto.randomUUID(),
        item,
        processo: proc,
        nf: '',
        endereco: '',
        m2: 0,
        mLinear: 0,
        largura: 0,
        lote: lote || '',
        loteSistema,
        quantidade: qtd,
        tipoTecido: madeiraTipo,
        modoOrigem: 'madeira' as const,
        isNew: true,
      };
      addRegistro(reg);
      toast.success(`✓ ${item} — ${madeiraTipo} CX${(registros.filter(r => r.item.trim().toLowerCase() === item.trim().toLowerCase()).length + 1).toString().padStart(2, '0')}`);
      resetForm();
      setQuantidade(madeiraDefaults[madeiraTipo].toString());
      setTimeout(() => { reg.isNew = false; }, 400);
      return;
    }

    if (isAI && aiLarguraNum <= 0) { toast.warning('Preencha a Largura.'); return; }
    if (usesM2Input && m2Num > 0 && largura <= 0) { toast.warning('Largura não detectada no item. Verifique o código ou preencha manualmente.'); return; }
    if (mLinear <= 0) { toast.warning(`Preencha o campo ${(isPVT || isAI || coulisseUsesMLinear) ? 'M Linear' : 'M²'}.`); return; }
    if (requiresEndereco && !endereco) { toast.warning('Preencha o Endereço.'); return; }
    if (requiresEndereco && !ENDERECO_REGEX.test(endereco)) { toast.warning('Endereço inválido. Use: TEC01.A.N03'); return; }

    const resolvedEndereco = requiresEndereco ? endereco : '';
    const resolvedM2 = isAI ? (aiMLinearNum * aiLarguraNum) : (isPVT || coulisseUsesMLinear) ? 0 : m2Num;
    const resolvedLargura = isAI ? aiLarguraNum : isPVT ? 0 : isCelular ? celularDivisor : largura;

    // Celular uses processo, other Diversos use NF
    const resolvedProcesso = (isDiversos && !isCelular) ? '' : proc;
    const resolvedNf = (isDiversos && !isCelular) ? nf.trim() : '';

    // Celular uses box numbering
    const loteSistema = isCelular
      ? generateLoteSistemaCaixa(resolvedProcesso, item, mLinear, registros)
      : generateLoteSistema(resolvedProcesso, resolvedEndereco, mLinear, registros, resolvedNf, item);

    const reg = {
      id: crypto.randomUUID(),
      item,
      processo: resolvedProcesso,
      nf: resolvedNf,
      endereco: resolvedEndereco,
      m2: resolvedM2,
      mLinear,
      largura: resolvedLargura,
      lote: lote || '',
      loteSistema,
      tipoTecido: isDiversos ? diversosTipo : '',
      modoOrigem: isAI ? 'openrouter' : isDiversos ? 'diversos' : 'manual',
      isNew: true,
    };
    addRegistro(reg);
    toast.success(`✓ ${item} adicionado (${registros.length + 1} rolos)`);
    resetForm();
    setTimeout(() => { reg.isNew = false; }, 400);
  };

  const handleUndo = () => {
    const restored = undoAction();
    if (restored) toast.success('Rolo restaurado');
  };

  const tecidoModes = [
    { key: 'manual' as const, label: 'Coulisse', icon: SquarePen },
    { key: 'diversos' as const, label: 'Diversos', icon: Layers3 },
  ];

  const showDropzone = currentMode === 'openrouter';

  // Determine next ref after item based on mode
  const getNextRefAfterItem = () => {
    if (isMadeira) return loteRef;
    if (isCoulisse) return manualLarguraRef; // always go to optional largura field
    if (isDiversos && !isCelular) return lockNf ? m2Ref : nfRef;
    return m2Ref;
  };

  // Determine next ref after NF
  const getNextRefAfterNf = () => {
    if (isRolo || isCortina) return m2Ref; // largura is auto-calculated
    return m2Ref;
  };

  // For computed card preview
  const previewLoteSistema = (() => {
    const proc = processo.trim();
    if (isMadeira) {
      if (proc && item) return generateLoteSistemaCaixa(proc, item, 0, registros);
      return '—';
    }
    const resolvedProc = (isDiversos && !isCelular) ? '' : proc;
    const resolvedNfVal = (isDiversos && !isCelular) ? nf.trim() : '';
    const resolvedEnd = requiresEndereco ? endereco : '';
    if (isCelular && proc && item) {
      return generateLoteSistemaCaixa(resolvedProc, item, mLinear, registros);
    }
    if (mLinear > 0 && (resolvedProc || resolvedNfVal || resolvedEnd)) {
      return generateLoteSistema(resolvedProc, resolvedEnd, mLinear, registros, resolvedNfVal, item);
    }
    return '—';
  })();

  // Set default quantidade when madeiraTipo changes
  useEffect(() => {
    if (isMadeira) {
      setQuantidade(madeiraDefaults[madeiraTipo].toString());
    }
  }, [madeiraTipo, isMadeira]);

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="bg-background/40 backdrop-blur-xl lg:border-r border-border/40 overflow-hidden flex flex-col h-full shadow-[20px_0_50px_-20px_rgba(0,0,0,0.1)] transition-all duration-500"
    >
      <div className="p-4 sm:p-8 lg:p-10 flex-1 overflow-y-auto space-y-6 sm:space-y-10 custom-scrollbar relative">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        
        {/* Mode Toggle — only for Tecido (not Madeira) */}
        {!isMadeira && (
          <div className="flex bg-muted/40 border border-border/40 rounded-3xl p-1.5 gap-2 shadow-inner relative z-10 backdrop-blur-md">
            {tecidoModes.map(m => {
              const Icon = m.icon;
              const isActive = currentMode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`flex-1 py-4 rounded-2xl text-[10px] sm:text-xs font-black transition-all duration-500 flex items-center justify-center gap-2.5 uppercase tracking-[0.15em] relative overflow-hidden group/mode ${
                    isActive
                      ? 'bg-primary text-white shadow-xl shadow-primary/30 scale-100'
                      : 'text-muted-foreground/60 hover:text-foreground hover:bg-white/50 dark:hover:bg-black/20 scale-[0.98]'
                  }`}
                  aria-pressed={isActive}
                >
                  {isActive && <motion.div layoutId="mode-bg" className="absolute inset-0 bg-primary shadow-xl shadow-primary/30 z-0" />}
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 relative z-10 transition-transform duration-700 ${isActive ? 'rotate-0' : '-rotate-12 group-hover/mode:rotate-0 group-hover/mode:scale-110'}`} />
                  <span className="relative z-10">{m.label}</span>
                </button>
              );
            })}
          </div>
        )}


        {/* Manual tip */}
        <AnimatePresence mode="wait">
          {!isAI && (
            <motion.div
              key={currentMode + diversosTipo}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="p-5 rounded-3xl bg-primary/5 border border-primary/20 text-xs leading-relaxed flex items-center justify-between group/tip shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full -mr-12 -mt-12 blur-2xl group-hover/tip:bg-primary/10 transition-colors duration-1000" />
              <div className="flex items-center gap-4 font-bold text-primary/70 relative z-10">
                <div className="p-2.5 rounded-2xl bg-primary/10 group-hover/tip:scale-110 group-hover/tip:rotate-12 transition-all duration-700 shadow-sm border border-primary/10">
                  <ScanBarcode className="w-5 h-5 text-primary" />
                </div>
                <div className="flex flex-col">
                   <span className="text-[9px] uppercase tracking-widest opacity-60">Instruções de Registro</span>
                   <span className="text-foreground/80 font-black">
                    {isMadeira ? (
                      <><span className="text-primary">{madeiraTipo}:</span> Item + Lote + Qtd</>
                    ) : isDiversos ? (
                      <><span className="text-primary">{diversosTipo}:</span> Preencha os campos destacados</>
                    ) : (
                      <>Bipe cada campo — avance com <kbd className="kbd ml-1 px-2 py-0.5 rounded-lg bg-background text-primary border-b-4 border-primary/20 font-black text-xs">Enter</kbd></>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0 ml-4 relative z-10">
                {undoStack.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleUndo} className="h-9 w-9 rounded-xl border border-border/40 hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-primary/30">
                        <Undo2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="font-bold rounded-xl shadow-2xl p-3 bg-popover/95">Desfazer última ação</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={resetForm} className="h-9 w-9 rounded-xl border border-border/40 hover:bg-destructive hover:text-white transition-all shadow-sm hover:shadow-destructive/30">
                        <X className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="font-bold rounded-xl shadow-2xl p-3 bg-popover/95">Limpar campos</TooltipContent>
                  </Tooltip>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isDiversos && (
          <div className="space-y-4">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-2 opacity-50 flex items-center gap-2">
              <Layers3 className="w-3.5 h-3.5" /> Categorias Disponíveis
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {(['Rolo', 'PVT', 'Cortina', 'Celular'] as const).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setDiversosTipo(tipo)}
                  className={`rounded-[1.5rem] border-2 px-3 py-5 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 transform active:scale-95 group/cat relative overflow-hidden ${
                    diversosTipo === tipo
                      ? 'border-primary bg-primary/5 text-primary shadow-xl shadow-primary/10'
                      : 'border-border/40 bg-card/20 text-muted-foreground/60 hover:text-primary hover:bg-primary/5 hover:border-primary/20'
                  }`}
                >
                  <span className="relative z-10">{tipo}</span>
                  <div className={`absolute bottom-0 left-0 w-full h-1 bg-primary transition-transform duration-700 ${diversosTipo === tipo ? 'scale-x-100' : 'scale-x-0'}`} />
                </button>
              ))}
            </div>
          </div>
        )}

        {isMadeira && (
          <div className="space-y-4">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-2 opacity-50 flex items-center gap-2">
              <LayoutGrid className="w-3.5 h-3.5" /> Subtipos de Material
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {(['Lâmina', 'Base', 'Bandô'] as const).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setMadeiraTipo(tipo)}
                  className={`rounded-[1.5rem] border-2 px-3 py-5 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all duration-500 transform active:scale-95 group/cat relative overflow-hidden ${
                    madeiraTipo === tipo
                      ? 'border-primary bg-primary/5 text-primary shadow-xl shadow-primary/10'
                      : 'border-border/40 bg-card/20 text-muted-foreground/60 hover:text-primary hover:bg-primary/5 hover:border-primary/20'
                  }`}
                >
                  <span className="relative z-10">{tipo}</span>
                  <div className={`absolute bottom-0 left-0 w-full h-1 bg-primary transition-transform duration-700 ${madeiraTipo === tipo ? 'scale-x-100' : 'scale-x-0'}`} />
                </button>
              ))}
            </div>
          </div>
        )}


        {/* Dropzone for AI modes */}
        <AnimatePresence mode="wait">
          {showDropzone && (
            <motion.div
              key="dropzone"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] text-center opacity-80 flex items-center justify-center gap-3">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/20" />
                <span>Marina Vision IA</span>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/20" />
              </div>
              
              <div
                className={`dropzone group/dz border-2 rounded-3xl transition-all duration-500 overflow-hidden relative ${preview ? 'border-primary shadow-2xl shadow-primary/10' : 'border-border/40 hover:border-primary/40 hover:bg-primary/5 shadow-inner'}`}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                style={{ height: preview || cameraActive ? 240 : 180 }}
              >
                {cameraActive && (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover absolute inset-0 transition-opacity duration-1000" />
                )}
                {preview && !cameraActive && (
                  <motion.img initial={{ scale: 1.1 }} animate={{ scale: 1 }} src={preview} alt="Etiqueta Capturada" className="w-full h-full object-cover" />
                )}
                {!preview && !cameraActive && (
                  <div className="text-center p-6 select-none flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-primary/5 text-primary group-hover/dz:scale-110 group-hover/dz:rotate-6 transition-all duration-500">
                      <Camera className="w-10 h-10 opacity-30 group-hover/dz:opacity-100" />
                    </div>
                    <div className="space-y-1">
                       <p className="text-sm font-black text-foreground">Capturar Etiqueta</p>
                       <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Arraste uma foto ou use a câmera</p>
                    </div>
                    <div className="flex gap-2">
                       <Button variant="secondary" onClick={(e) => { e.stopPropagation(); openNativeCamera(); }} className="rounded-xl h-10 px-4 font-bold border-border/50 shadow-sm"><Camera className="w-4 h-4 mr-2" /> Câmera</Button>
                       <Button variant="secondary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="rounded-xl h-10 px-4 font-bold border-border/50 shadow-sm"><Image className="w-4 h-4 mr-2" /> Galeria</Button>
                    </div>
                  </div>
                )}
              </div>

              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f, { autoSave: true }); e.target.value = ''; }} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ''; }} />
              <canvas ref={canvasRef} className="hidden" />

              {(preview || cameraActive) && (
                <div className="flex gap-2.5">
                  {cameraActive ? (
                    <>
                      <Button className="flex-1 rounded-2xl h-12 font-black uppercase tracking-widest shadow-lg shadow-primary/20" onClick={snapPhoto}>
                        <Camera className="w-5 h-5 mr-2" /> Capturar Foto
                      </Button>
                      <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-border/60" onClick={stopCamera}>
                        <X className="w-5 h-5" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" className="flex-1 rounded-2xl h-12 border-border/50 font-bold hover:bg-primary/5 hover:text-primary transition-all" onClick={openNativeCamera}><Camera className="w-5 h-5" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Retirar Foto</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="outline" className="flex-1 rounded-2xl h-12 border-border/50 font-bold hover:bg-primary/5 hover:text-primary transition-all" onClick={() => fileInputRef.current?.click()}><Image className="w-5 h-5" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Abrir Galeria</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="outline" className="flex-1 rounded-2xl h-12 border-border/50 font-bold hover:bg-primary/5 hover:text-primary transition-all" onClick={openLiveCamera}><Video className="w-5 h-5" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Câmera ao Vivo</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                           <Button variant="outline" className="flex-1 rounded-2xl h-12 border-primary/20 bg-primary/5 text-primary font-bold hover:bg-primary hover:text-white transition-all" onClick={() => { if (preview) { downloadDataUrl(preview, getPhotoFileName()); toast.success('A foto foi salva com sucesso no dispositivo.'); } }}><Download className="w-5 h-5" /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Baixar Foto</TooltipContent>
                      </Tooltip>
                      <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-muted-foreground hover:bg-destructive/5 hover:text-destructive transition-all" onClick={() => { setFotoB64(null); setPreview(null); setAiStatus(null); setProgress(0); }}><Trash2 className="w-5 h-5" /></Button>
                    </>
                  )}
                </div>
              )}

              <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden shadow-inner">
                 <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
              </div>

              {preview && !cameraActive && (
                <Button onClick={processOpenRouter} disabled={aiLoading} className="w-full h-14 rounded-[1.5rem] font-black uppercase tracking-[0.15em] shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50">
                  {aiLoading ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin-fast mr-2" /> : <Zap className="w-5 h-5 mr-2 animate-pulse text-yellow-300 fill-yellow-300" />}
                  <span>{aiLoading ? 'Processando...' : 'Analisar com Marina Vision IA'}</span>
                </Button>
              )}

              <AnimatePresence>
                {aiStatus && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className={`p-4 rounded-2xl border-2 text-xs font-bold leading-relaxed shadow-lg ${aiStatus.type === 'ok' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}>
                    <div className="flex items-center gap-2 mb-1">
                       {aiStatus.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                       <span className="uppercase tracking-widest">{aiStatus.type === 'ok' ? 'Análise Concluída' : 'Erro na Análise'}</span>
                    </div>
                    {aiStatus.msg}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Fields */}
        <div className="space-y-6">
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2 opacity-60 ml-1">
            <ScanBarcode className="w-3.5 h-3.5" /> {isMadeira ? 'Especificações da Madeira' : 'Especificações do Material'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* PROC field — Coulisse, IA, and Celular */}
            {requiresProcesso && (
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between px-1">
                  <label htmlFor="proc-input" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Processo (PROC)</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLockProcesso}
                    className={`h-7 px-3 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
                      lockProcesso
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {lockProcesso ? <Lock className="w-3 h-3 mr-1.5" /> : <Unlock className="w-3 h-3 mr-1.5" />}
                    {lockProcesso ? 'Travado' : 'Travar'}
                  </Button>
                </div>
                <input
                  id="proc-input"
                  value={processo}
                  onChange={e => handleProcessoChange(e.target.value)}
                  onKeyDown={e => handleFieldKeyDown(e, itemRef)}
                  className={`w-full h-14 rounded-2xl border-2 px-4 text-sm font-mono font-bold transition-all ${
                    lockProcesso ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-card/40 border-border/40 focus:border-primary/50 focus:bg-background'
                  }`}
                  placeholder="Número do Processo..."
                  autoComplete="off"
                  readOnly={lockProcesso && !!lockedProcesso}
                />
              </div>
            )}

            {/* Item / Referência */}
            <div className="space-y-2 sm:col-span-2">
              <label htmlFor="item-input" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Item / Referência</label>
              <input
                id="item-input"
                ref={itemRef}
                value={item}
                onChange={e => handleItemChange(e.target.value)}
                onKeyDown={e => handleFieldKeyDown(e, getNextRefAfterItem())}
                className="w-full h-14 rounded-2xl border-2 border-border/40 bg-card/40 px-4 text-sm font-mono font-bold focus:border-primary/50 focus:bg-background transition-all"
                placeholder="Ex: SRC-3003-05-30..." 
                autoComplete="off"
              />
              {usesLarguraFromItem && largura > 0 && (
                <Badge variant="secondary" className="mt-1 ml-1 bg-primary/10 text-primary border-none font-bold">Largura Detectada: {largura.toFixed(2)}m</Badge>
              )}
            </div>

            {/* Coulisse: optional manual largura */}
            {isCoulisse && (
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="largura-manual" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Largura (Opcional)</label>
                <input
                  id="largura-manual"
                  ref={manualLarguraRef}
                  type="number" step="0.01" value={manualLargura}
                  onChange={e => setManualLargura(e.target.value)}
                  onKeyDown={e => handleFieldKeyDown(e, m2Ref)}
                  className="w-full h-14 rounded-2xl border-2 border-border/40 bg-card/40 px-4 text-sm font-bold focus:border-primary/50 focus:bg-background transition-all"
                  placeholder="2.80" autoComplete="off" inputMode="decimal"
                />
              </div>
            )}

            {/* NF field — Diversos except Celular */}
            {requiresNF && (
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between px-1">
                  <label htmlFor="nf-input" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nota Fiscal (NF)</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLockNf}
                    className={`h-7 px-3 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
                      lockNf
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {lockNf ? <Lock className="w-3 h-3 mr-1.5" /> : <Unlock className="w-3 h-3 mr-1.5" />}
                    {lockNf ? 'Travado' : 'Travar'}
                  </Button>
                </div>
                <input
                  id="nf-input"
                  ref={nfRef}
                  value={nf}
                  onChange={e => handleNfChange(e.target.value)}
                  onKeyDown={e => handleFieldKeyDown(e, getNextRefAfterNf())}
                  className={`w-full h-14 rounded-2xl border-2 px-4 text-sm font-mono font-bold transition-all ${
                    lockNf ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-card/40 border-border/40 focus:border-primary/50 focus:bg-background'
                  }`}
                  placeholder="Número da NF..."
                  autoComplete="off"
                  readOnly={lockNf && !!lockedNf}
                />
              </div>
            )}

            {/* Madeira: Lote + Qtd */}
            {isMadeira && (
              <>
                <div className="space-y-2">
                  <label htmlFor="lote-input" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Lote / Batch</label>
                  <input
                    id="lote-input"
                    ref={loteRef}
                    value={lote}
                    onChange={e => setLote(e.target.value.replace(/[''`]/g, '-'))}
                    onKeyDown={e => handleFieldKeyDown(e, quantidadeRef)}
                    className="w-full h-14 rounded-2xl border-2 border-border/40 bg-card/40 px-4 text-sm font-mono font-bold focus:border-primary/50 focus:bg-background transition-all"
                    placeholder="Lote..." autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="qtd-input" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Qtd por Caixa</label>
                  <input
                    id="qtd-input"
                    ref={quantidadeRef}
                    type="number" step="1" value={quantidade}
                    onChange={e => setQuantidade(e.target.value)}
                    onKeyDown={e => handleFieldKeyDown(e, null)}
                    className="w-full h-14 rounded-2xl border-2 border-border/40 bg-card/40 px-4 text-sm font-bold focus:border-primary/50 focus:bg-background transition-all"
                    placeholder={madeiraDefaults[madeiraTipo].toString()} autoComplete="off" inputMode="numeric"
                  />
                </div>
              </>
            )}

            {/* Metragem Fields */}
            {!isMadeira && (
              <>
                <div className="space-y-2">
                  <label htmlFor="metragem-input" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    {isAI || isPVT || coulisseUsesMLinear ? 'M Linear' : 'Metragem (M²)'}
                  </label>
                  <input
                    id="metragem-input"
                    ref={m2Ref}
                    type="number" step="0.1" 
                    value={isAI ? aiMLinear : (isPVT || coulisseUsesMLinear) ? diversosMLinear : m2}
                    onChange={e => isAI ? setAiMLinear(e.target.value) : (isPVT || coulisseUsesMLinear) ? setDiversosMLinear(e.target.value) : setM2(e.target.value)}
                    onKeyDown={e => handleFieldKeyDown(e, isAI ? larguraRef : loteRef)}
                    className="w-full h-14 rounded-2xl border-2 border-border/40 bg-card/40 px-4 text-sm font-bold focus:border-primary/50 focus:bg-background transition-all"
                    placeholder="0.0" autoComplete="off" inputMode="decimal"
                  />
                  {mLinear > 0 && !isAI && !isPVT && !coulisseUsesMLinear && (
                    <Badge variant="outline" className="mt-1 ml-1 border-primary/30 text-primary font-black">Linear: {formatML(mLinear)}</Badge>
                  )}
                </div>

                {isAI ? (
                  <div className="space-y-2">
                    <label htmlFor="largura-ai" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Largura (m)</label>
                    <input
                      id="largura-ai"
                      ref={larguraRef}
                      type="number" step="0.01" value={aiLargura}
                      onChange={e => setAiLargura(e.target.value)}
                      onKeyDown={e => handleFieldKeyDown(e, lockEndereco ? null : enderecoRef)}
                      className="w-full h-14 rounded-2xl border-2 border-border/40 bg-card/40 px-4 text-sm font-bold focus:border-primary/50 focus:bg-background transition-all"
                      placeholder="2.80" autoComplete="off" inputMode="decimal"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label htmlFor="lote-material" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Lote / Batch</label>
                    <input
                      id="lote-material"
                      ref={loteRef}
                      value={lote}
                      onChange={e => setLote(e.target.value.replace(/[''`]/g, '-'))}
                      onKeyDown={e => handleFieldKeyDown(e, requiresEndereco && !lockEndereco ? enderecoRef : null)}
                      className="w-full h-14 rounded-2xl border-2 border-border/40 bg-card/40 px-4 text-sm font-mono font-bold focus:border-primary/50 focus:bg-background transition-all"
                      placeholder="Lote..." autoComplete="off"
                    />
                  </div>
                )}
              </>
            )}

            {/* Endereço */}
            {requiresEndereco && (
              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center justify-between px-1">
                  <label htmlFor="endereco-input" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Endereço (TEC01.A.N03)</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLockEndereco}
                    className={`h-7 px-3 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
                      lockEndereco
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {lockEndereco ? <Lock className="w-3 h-3 mr-1.5" /> : <Unlock className="w-3 h-3 mr-1.5" />}
                    {lockEndereco ? 'Travado' : 'Travar'}
                  </Button>
                </div>
                <input
                  id="endereco-input"
                  ref={enderecoRef}
                  value={endereco}
                  onChange={e => handleEnderecoChange(e.target.value)}
                  onKeyDown={e => handleFieldKeyDown(e, null)}
                  className={`w-full h-14 rounded-2xl border-2 px-4 text-sm font-mono font-bold transition-all uppercase ${
                    lockEndereco ? 'bg-primary/5 border-primary/30 text-primary' : (enderecoError ? 'border-destructive/40 bg-destructive/5' : 'bg-card/40 border-border/40 focus:border-primary/50 focus:bg-background')
                  }`}
                  placeholder="TEC01.A.N03" autoComplete="off"
                  readOnly={lockEndereco && !!lockedEndereco}
                />
                {enderecoError && <p className="text-[10px] text-destructive font-black uppercase tracking-wider ml-1">{enderecoError}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Computed Preview Card */}
        <div className="p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-navy text-white shadow-2xl relative overflow-hidden group/card transition-all hover:scale-[1.01]">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/card:scale-150 transition-transform duration-1000 hidden xs:block">
             <Package className="w-32 h-32" />
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-8 relative z-10">
            {isMadeira ? (
              <>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Subtipo</p>
                  <p className="text-xl font-black">{madeiraTipo}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Qtd</p>
                  <p className="text-xl font-black">{quantidade || madeiraDefaults[madeiraTipo]}</p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Largura</p>
                  <p className="text-xl font-black">{largura > 0 ? largura.toFixed(2) + 'm' : '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-50">M Linear</p>
                  <p className="text-xl font-black">{mLinear > 0 ? formatML(mLinear) : '—'}</p>
                </div>
              </>
            )}
            <div className="col-span-2 space-y-2 border-t border-white/10 pt-4">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Lote Sistema Gerado</p>
              <div className="p-3 rounded-xl bg-white/5 font-mono text-xs font-bold text-primary-foreground/90 truncate border border-white/5">
                {previewLoteSistema}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2 pb-8">
          <Button
            onClick={handleAdd}
            className="w-full h-16 rounded-[1.5rem] bg-primary text-white font-black text-base uppercase tracking-[0.2em] shadow-xl shadow-primary/20 transition-all hover:-translate-y-1 active:translate-y-0 group"
          >
            <Plus className="w-6 h-6 mr-2 group-hover:rotate-90 transition-transform duration-500" />
            Adicionar Registro
          </Button>

          {registros.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className={`w-full h-14 rounded-[1.5rem] font-black uppercase tracking-widest transition-all duration-500 ${
                showPreview 
                  ? 'bg-primary/10 border-primary text-primary shadow-inner' 
                  : 'border-border/60 hover:border-primary/40 hover:bg-primary/5'
              }`}
            >
              {showPreview ? <EyeOff className="w-5 h-5 mr-3" /> : <Eye className="w-5 h-5 mr-3" />}
              {showPreview ? 'Ocultar Detalhes' : `Ver Tabela Atual (${registros.length})`}
            </Button>
          )}

          <AnimatePresence>
            {showPreview && registros.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, height: 0 }}
                animate={{ opacity: 1, scale: 1, height: 'auto' }}
                exit={{ opacity: 0, scale: 0.95, height: 0 }}
                className="overflow-hidden rounded-3xl border-2 border-primary/20 bg-card/60 backdrop-blur-md shadow-2xl"
              >
                <div className="p-4 border-b border-border/40 bg-muted/30 flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Últimos Registros</span>
                   <Badge className="bg-primary text-white font-black">{registros.length}</Badge>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-[11px] border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm z-10">
                      <tr>
                        <th className="px-4 py-3 text-left font-black uppercase tracking-tighter opacity-40">#</th>
                        <th className="px-4 py-3 text-left font-black uppercase tracking-tighter opacity-40">Referência</th>
                        <th className="px-4 py-3 text-left font-black uppercase tracking-tighter opacity-40">Lote Sistema</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {registros.slice(-10).reverse().map((r, i) => (
                        <tr key={r.id} className="hover:bg-primary/5 transition-colors">
                          <td className="px-4 py-3 font-mono opacity-40">{registros.length - i}</td>
                          <td className="px-4 py-3 font-black text-foreground">{r.item}</td>
                          <td className="px-4 py-3 font-mono text-primary/80 font-bold">{r.loteSistema}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="p-3 bg-muted/30 text-center">
                   <Button variant="link" size="sm" className="font-black text-[10px] uppercase tracking-widest text-primary" onClick={() => useAppStore.getState().setFormData({ activeTab: 'table' })}>Abrir Tabela Completa</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isDuplicate && (
             <motion.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="p-4 rounded-2xl bg-destructive/10 border-2 border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-destructive/5"
             >
               <AlertTriangle className="w-5 h-5 animate-bounce" />
               Atenção: O item "{item}" já consta nesta conferência.
             </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
