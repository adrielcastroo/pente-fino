import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { extractLarguraFromItem, formatML, generateLoteSistema, generateLoteSistemaCaixa, ENDERECO_REGEX } from '@/lib/app-utils';
import { Registro } from '@/types';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Image, Video, Download, X, Undo2, ScanBarcode,
  Plus, Zap, SquarePen, Layers3, Lock, Unlock, Package, Eye, EyeOff
} from 'lucide-react';


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
  const setDiversosTipo = (val: AppState['formData']['diversosTipo']) => setFormData({ diversosTipo: val });
  const setDiversosMLinear = (val: string) => setFormData({ diversosMLinear: val });
  const setManualLargura = (val: string) => setFormData({ manualLargura: val });
  const setCoulisseMetragem = (val: 'm2' | 'mlinear') => setFormData({ coulisseMetragem: val });
  const setLockMetragem = (val: boolean) => setFormData({ lockMetragem: val });
  const setMadeiraTipo = (val: AppState['formData']['madeiraTipo']) => setFormData({ madeiraTipo: val });
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
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="bg-background md:border-r border-border/50 overflow-hidden flex flex-col h-full"
    >
      <div className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto space-y-6 sm:space-y-8 custom-scrollbar">
        {/* Mode Toggle — only for Tecido (not Madeira) */}
        {!isMadeira && (
          <div className="flex bg-muted/30 border border-border/50 rounded-full p-1 gap-1 shadow-inner">
            {tecidoModes.map(m => {
              const Icon = m.icon;
              const isActive = currentMode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`flex-1 py-2 rounded-full text-[11px] font-bold transition-all duration-300 flex items-center justify-center gap-1.5 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md scale-100'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 scale-95'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="uppercase tracking-tight">{m.label}</span>
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
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ai-status-box text-xs leading-relaxed flex items-center justify-between"
            >
              <div>
                <ScanBarcode className="w-3.5 h-3.5 inline mr-1.5 text-primary" />
                {isMadeira ? `${madeiraTipo}: Item + Lote + Quantidade` : isDiversos ? `${diversosTipo}: preencha apenas os campos exibidos` : 'Bipe cada campo — avança automaticamente com'} <kbd className="kbd">Enter</kbd>
              </div>
              <div className="flex gap-1 flex-shrink-0 ml-2">
                {undoStack.length > 0 && (
                  <button onClick={handleUndo} className="p-1 rounded border border-border hover:bg-muted transition-colors" title="Desfazer">
                    <Undo2 className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
                <button onClick={resetForm} className="flex items-center gap-1 px-2 py-1 rounded hover:bg-muted transition-colors text-[10px] font-medium text-muted-foreground border border-border">
                  <X className="w-3 h-3" />
                  Limpar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {isDiversos && (
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Tipo de tecido</div>
            <div className="grid grid-cols-2 gap-2">
              {(['Rolo', 'PVT', 'Cortina', 'Celular'] as const).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setDiversosTipo(tipo)}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                    diversosTipo === tipo
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {tipo === 'Celular' ? 'Celular/Plissada' : tipo}
                </button>
              ))}
            </div>
          </div>
        )}

        {isMadeira && (
          <div className="space-y-2">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Subtipo</div>
            <div className="grid grid-cols-3 gap-2">
              {(['Lâmina', 'Base', 'Bandô'] as const).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setMadeiraTipo(tipo)}
                  className={`rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors ${
                    madeiraTipo === tipo
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  {tipo}
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
            >
              <div className="mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.24em] text-center">
                Marina e Yuma
              </div>
              <div
                className={`dropzone ${preview ? 'has-img' : ''}`}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                style={{ height: preview || cameraActive ? 200 : 160 }}
              >
                {cameraActive && (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-xl absolute inset-0" />
                )}
                {preview && !cameraActive && (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                )}
                {!preview && !cameraActive && (
                  <div className="text-center p-4 select-none flex flex-col items-center gap-3">
                    <Camera className="w-8 h-8 text-muted-foreground/30" />
                    <div className="text-xs text-muted-foreground">Tire uma foto ou selecione da galeria</div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); openNativeCamera(); }} className="flex items-center gap-1.5 text-xs px-4 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors bg-card font-medium">
                        <Camera className="w-4 h-4" /> Câmera
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="flex items-center gap-1.5 text-xs px-4 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors bg-card font-medium">
                        <Image className="w-4 h-4" /> Galeria
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f, { autoSave: true }); e.target.value = ''; }} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ''; }} />
              <canvas ref={canvasRef} className="hidden" />

              {(preview || cameraActive) && (
                <div className="flex gap-2 mt-2.5">
                  {cameraActive ? (
                    <>
                      <button className="flex-1 flex items-center justify-center gap-2 text-xs px-4 py-2.5 rounded-lg navy-3-bg text-primary-foreground font-medium" onClick={snapPhoto}>
                        <Camera className="w-4 h-4" /> Capturar
                      </button>
                      <button className="p-2.5 rounded-lg border border-border hover:bg-muted" onClick={stopCamera}>
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="flex items-center justify-center gap-1 flex-1 text-xs px-3 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors font-medium" onClick={openNativeCamera}><Camera className="w-4 h-4" /></button>
                      <button className="flex items-center justify-center gap-1 flex-1 text-xs px-3 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors font-medium" onClick={() => fileInputRef.current?.click()}><Image className="w-4 h-4" /></button>
                      <button className="flex items-center justify-center gap-1 text-xs px-3 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors font-medium" onClick={openLiveCamera}><Video className="w-4 h-4" /></button>
                      <button className="flex items-center justify-center gap-1 text-xs px-3 py-2.5 rounded-lg border border-primary/30 hover:bg-primary/5 transition-colors font-medium text-primary" onClick={() => { if (preview) { downloadDataUrl(preview, getPhotoFileName()); toast.success('Foto salva'); } }}><Download className="w-4 h-4" /></button>
                      <button className="flex items-center justify-center text-xs p-2.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground" onClick={() => { setFotoB64(null); setPreview(null); setAiStatus(null); setProgress(0); }}><X className="w-4 h-4" /></button>
                    </>
                  )}
                </div>
              )}

              <div className="progress-bar mt-2"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>

              {preview && !cameraActive && (
                <button onClick={processOpenRouter} disabled={aiLoading} className="w-full mt-2.5 h-11 navy-3-bg text-primary-foreground rounded-lg text-xs sm:text-sm font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50">
                  {aiLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin-fast" /> : <Zap className="w-4 h-4" />}
                  <span>{aiLoading ? 'Enviando…' : 'Processar com IA'}</span>
                </button>
              )}

              <AnimatePresence>
                {aiStatus && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`mt-2 ai-status-box ${aiStatus.type === 'ok' ? 'ai-status-ok' : 'ai-status-err'}`}>
                    {aiStatus.msg}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form Fields */}
        <div className="space-y-2.5">
          <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <ScanBarcode className="w-3 h-3" /> {isMadeira ? 'Dados da Madeira' : 'Dados do Rolo'}
          </div>

          {/* PROC field — Coulisse, IA, and Celular */}
          {requiresProcesso && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">PROC</label>
                <button
                  onClick={toggleLockProcesso}
                  className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                    lockProcesso
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title={lockProcesso ? 'Destravar PROC' : 'Travar PROC'}
                >
                  {lockProcesso ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {lockProcesso ? 'Travado' : 'Travar'}
                </button>
              </div>
              <input
                value={processo}
                onChange={e => handleProcessoChange(e.target.value)}
                onKeyDown={e => handleFieldKeyDown(e, itemRef)}
                className={`w-full border rounded-lg px-3 py-3 text-sm font-mono font-medium bg-card outline-none focus:ring-2 transition-all ${
                  lockProcesso ? 'bg-primary/5 border-primary/30' : 'border-border'
                } focus:border-primary focus:ring-primary/10`}
                placeholder="Processo *"
                autoComplete="off"
                readOnly={lockProcesso && !!lockedProcesso}
              />
            </div>
          )}

          {/* Item / Referência */}
          <div>
            <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Item / Referência</label>
            <input
              ref={itemRef}
              value={item}
              onChange={e => handleItemChange(e.target.value)}
              onKeyDown={e => handleFieldKeyDown(e, getNextRefAfterItem())}
              className="w-full border border-border rounded-lg px-3 py-3 text-sm font-mono font-medium bg-card outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              placeholder="SRC-3003-05-30-EB2" autoComplete="off"
            />
            {usesLarguraFromItem && largura > 0 && (
              <div className="text-[10px] text-primary mt-1 font-medium">Largura: {largura.toFixed(2)}m</div>
            )}
          </div>

          {/* Coulisse: optional manual largura */}
          {isCoulisse && (
            <div>
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Largura (m) — opcional</label>
              <input
                ref={manualLarguraRef}
                type="number" step="0.01" value={manualLargura}
                onChange={e => setManualLargura(e.target.value)}
                onKeyDown={e => handleFieldKeyDown(e, m2Ref)}
                className="w-full border border-border rounded-lg px-3 py-3 text-sm bg-card outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                placeholder="2.80" autoComplete="off" inputMode="decimal"
              />
              {largura > 0 && (
                <div className="text-[10px] text-primary mt-1 font-medium">Largura: {largura.toFixed(2)}m</div>
              )}
            </div>
          )}

          {/* NF field — Diversos except Celular */}
          {requiresNF && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">NF</label>
                <button
                  onClick={toggleLockNf}
                  className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                    lockNf
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title={lockNf ? 'Destravar NF' : 'Travar NF'}
                >
                  {lockNf ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  {lockNf ? 'Travado' : 'Travar'}
                </button>
              </div>
              <input
                ref={nfRef}
                value={nf}
                onChange={e => handleNfChange(e.target.value)}
                onKeyDown={e => handleFieldKeyDown(e, getNextRefAfterNf())}
                className={`w-full border rounded-lg px-3 py-3 text-sm font-mono bg-card outline-none focus:ring-2 transition-all ${
                  lockNf ? 'bg-primary/5 border-primary/30' : 'border-border'
                } focus:border-primary focus:ring-primary/10`}
                placeholder="Nota fiscal *"
                autoComplete="off"
                readOnly={lockNf && !!lockedNf}
              />
            </div>
          )}

          {/* Madeira: Quantidade field */}
          {isMadeira && (
            <>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Lote / Batch (opcional)</label>
                <input
                  ref={loteRef}
                  value={lote}
                  onChange={e => setLote(e.target.value.replace(/[''`]/g, '-'))}
                  onKeyDown={e => handleFieldKeyDown(e, quantidadeRef)}
                  className="w-full border border-border rounded-lg px-3 py-3 text-sm font-mono bg-card outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="Código do lote" autoComplete="off"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Quantidade por caixa (padrão: {madeiraDefaults[madeiraTipo]})
                </label>
                <input
                  ref={quantidadeRef}
                  type="number" step="1" value={quantidade}
                  onChange={e => setQuantidade(e.target.value)}
                  onKeyDown={e => handleFieldKeyDown(e, null)}
                  className="w-full border border-border rounded-lg px-3 py-3 text-sm bg-card outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder={madeiraDefaults[madeiraTipo].toString()} autoComplete="off" inputMode="numeric"
                />
              </div>
            </>
          )}

          {/* AI mode: M Linear + Largura fields */}
          {!isMadeira && isAI ? (
            <>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">M Linear</label>
                <input
                  ref={m2Ref}
                  type="number" step="0.1" value={aiMLinear}
                  onChange={e => setAiMLinear(e.target.value)}
                  onKeyDown={e => handleFieldKeyDown(e, larguraRef)}
                  className="w-full border border-border rounded-lg px-3 py-3 text-sm bg-card outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="27.5" autoComplete="off" inputMode="decimal"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Largura (m)</label>
                <input
                  ref={larguraRef}
                  type="number" step="0.01" value={aiLargura}
                  onChange={e => setAiLargura(e.target.value)}
                  onKeyDown={e => handleFieldKeyDown(e, lockEndereco ? null : enderecoRef)}
                  className="w-full border border-border rounded-lg px-3 py-3 text-sm bg-card outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="2.80" autoComplete="off" inputMode="decimal"
                />
              </div>
            </>
          ) : !isMadeira ? (
            <>
              {(isPVT || coulisseUsesMLinear) ? (
                /* PVT or Coulisse M Linear mode: direct M Linear input */
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">M Linear</label>
                  <input
                    ref={m2Ref}
                    type="number" step="0.1" value={diversosMLinear}
                    onChange={e => setDiversosMLinear(e.target.value)}
                    onKeyDown={e => handleFieldKeyDown(e, loteRef)}
                    className="w-full border border-border rounded-lg px-3 py-3 text-sm bg-card outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    placeholder="27.5" autoComplete="off" inputMode="decimal"
                  />
                </div>
              ) : (
                /* Coulisse M², Rolo, Cortina, Celular: M² input with calculated M Linear */
                <div>
                  <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                    {isCelular ? `M² (÷ ${isHC45 ? '3,66' : '3,05'} = M Linear)` : 'M² (Metro Quadrado)'}
                  </label>
                  <input
                    ref={m2Ref}
                    type="number" step="0.1" value={m2}
                    onChange={e => setM2(e.target.value)}
                    onKeyDown={e => handleFieldKeyDown(e, loteRef)}
                    className="w-full border border-border rounded-lg px-3 py-3 text-sm bg-card outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                    placeholder="76.9" autoComplete="off" inputMode="decimal"
                  />
                  {mLinear > 0 && (
                    <div className="text-[10px] text-primary mt-1 font-medium">M Linear: {formatML(mLinear)}</div>
                  )}{isCelular && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">Largura fixa: {isHC45 ? '3,66' : '3,05'}m {isHC45 ? '(HC-45)' : ''}</div>
                  )}
                </div>
              )}

              {/* Coulisse: measurement type toggle */}
              {isCoulisse && (
                <div className="flex items-center justify-between px-1">
                  <div className="flex surface-2-bg border border-border rounded-lg p-0.5 gap-0.5">
                    <button
                      onClick={() => setCoulisseMetragem('m2')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                        coulisseMetragem === 'm2'
                          ? 'surface-bg text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      M² → M Linear
                    </button>
                    <button
                      onClick={() => setCoulisseMetragem('mlinear')}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                        coulisseMetragem === 'mlinear'
                          ? 'surface-bg text-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      M Linear direto
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setLockMetragem(!lockMetragem);
                      toast.success(lockMetragem ? 'Metragem destravada' : 'Metragem travada');
                    }}
                    className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                      lockMetragem
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                    title={lockMetragem ? 'Destravar metragem' : 'Travar metragem'}
                  >
                    {lockMetragem ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {lockMetragem ? 'Travado' : 'Travar'}
                  </button>
                </div>
              )}
              <div>
                <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1">Lote / Batch</label>
                <input
                  ref={loteRef}
                  value={lote}
                  onChange={e => setLote(e.target.value.replace(/[''`]/g, '-'))}
                  onKeyDown={e => handleFieldKeyDown(e, requiresEndereco && !lockEndereco ? enderecoRef : null)}
                  className="w-full border border-border rounded-lg px-3 py-3 text-sm font-mono bg-card outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                  placeholder="Código do lote" autoComplete="off"
                />
              </div>
            </>
          ) : null}

          {/* Endereço */}
          {requiresEndereco && <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Endereço</label>
              <button
                onClick={toggleLockEndereco}
                className={`flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md transition-colors ${
                  lockEndereco
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={lockEndereco ? 'Destravar endereço' : 'Travar endereço'}
              >
                {lockEndereco ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                {lockEndereco ? 'Travado' : 'Travar'}
              </button>
            </div>
            <input
              ref={enderecoRef}
              value={endereco}
              onChange={e => handleEnderecoChange(e.target.value)}
              onKeyDown={e => handleFieldKeyDown(e, null)}
              className={`w-full border rounded-lg px-3 py-3 text-sm bg-card outline-none focus:ring-2 transition-all uppercase font-mono ${
                lockEndereco ? 'bg-primary/5 border-primary/30' : ''
              } ${
                enderecoError ? 'border-destructive focus:border-destructive focus:ring-destructive/10' : 'border-border focus:border-primary focus:ring-primary/10'
              }`}
              placeholder="TEC01.A.N03" autoComplete="off"
              readOnly={lockEndereco && !!lockedEndereco}
            />
            {enderecoError && <div className="text-[10px] text-destructive mt-1 font-medium">{enderecoError}</div>}
          </div>}
        </div>

        {/* Computed Card */}
        <div className="comp-card">
          {isMadeira ? (
            <>
              <div>
                <div className="text-[10px] opacity-45 uppercase tracking-wider font-semibold mb-0.5">Subtipo</div>
                <div className="text-base font-semibold font-mono">{madeiraTipo}</div>
              </div>
              <div>
                <div className="text-[10px] opacity-45 uppercase tracking-wider font-semibold mb-0.5">Qtd</div>
                <div className="text-base font-semibold font-mono">{quantidade || madeiraDefaults[madeiraTipo]}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] opacity-45 uppercase tracking-wider font-semibold mb-0.5">Lote Sistema</div>
                <div className="text-xs font-mono opacity-70 truncate">{previewLoteSistema}</div>
              </div>
            </>
          ) : (
            <>
              <div>
                <div className="text-[10px] opacity-45 uppercase tracking-wider font-semibold mb-0.5">Largura</div>
                <div className="text-base font-semibold font-mono">{largura > 0 ? largura.toFixed(2) + 'm' : '—'}</div>
              </div>
              <div>
                <div className="text-[10px] opacity-45 uppercase tracking-wider font-semibold mb-0.5">M Linear</div>
                <div className="text-base font-semibold font-mono">{mLinear > 0 ? formatML(mLinear) : '—'}</div>
              </div>
              <div className="col-span-2">
                <div className="text-[10px] opacity-45 uppercase tracking-wider font-semibold mb-0.5">Lote Sistema</div>
                <div className="text-xs font-mono opacity-70 truncate">{previewLoteSistema}</div>
              </div>
            </>
          )}
        </div>

        {/* Add Button */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleAdd}
          className="w-full h-12 sm:h-14 bg-primary text-primary-foreground rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.97] shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Adicionar à Tabela
        </motion.button>

        {/* Preview toggle - highlighted */}
        {registros.length > 0 && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border transition-all duration-300 font-bold text-sm ${
              showPreview 
                ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20' 
                : 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20'
            }`}
          >
            {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showPreview ? 'Ocultar Preview' : `Visualizar Tabela (${registros.length})`}
          </button>
        )}

        {/* Mini table preview */}
        <AnimatePresence>
          {showPreview && registros.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="border border-border rounded-lg overflow-x-auto bg-card">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="surface-2-bg">
                      <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">#</th>
                      <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">Item</th>
                      <th className="px-2 py-1.5 text-left text-muted-foreground font-medium">Lote Sistema</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.slice(-8).map((r, i) => (
                      <tr key={r.id} className="border-t border-border/50">
                        <td className="px-2 py-1 text-muted-foreground">{registros.length - 8 + i + 1 > 0 ? registros.indexOf(r) + 1 : i + 1}</td>
                        <td className="px-2 py-1 font-semibold truncate max-w-[120px]">{r.item || '—'}</td>
                        <td className="px-2 py-1 font-mono text-muted-foreground truncate max-w-[140px]">{r.loteSistema || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Duplicate warning */}
        <AnimatePresence>
          {isDuplicate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="ai-status-box ai-status-err text-xs"
            >
              ⚠ Item duplicado: "{item}" já existe na tabela
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
