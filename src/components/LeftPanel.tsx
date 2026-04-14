import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { extractLarguraFromItem, formatML, generateLoteSistema, generateLoteSistemaCaixa, ENDERECO_REGEX } from '@/lib/app-utils';
import { Registro, FormData } from '@/types';
import { toast } from 'sonner';
// animations removed for lightweight mode
import { usePerformance } from '@/hooks/use-performance';
import { useShallow } from 'zustand/react/shallow';
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

const LeftPanel = memo(function LeftPanel() {
  const {
    currentMode, setMode, processo, setProcesso, conferente, registros, addRegistro,
    undoStack, undoAction, lockProcesso, setLockProcesso, lockedProcesso, setLockedProcesso,
    lockNf, setLockNf, lockedNf, setLockedNf, lockEndereco, setLockEndereco,
    lockedEndereco, setLockedEndereco, formData, setFormData, resetFormData
  } = useAppStore(useShallow(s => ({
    currentMode: s.currentMode,
    setMode: s.setMode,
    processo: s.processo,
    setProcesso: s.setProcesso,
    conferente: s.conferente,
    registros: s.registros,
    addRegistro: s.addRegistro,
    undoStack: s.undoStack,
    undoAction: s.undo,
    lockProcesso: s.lockProcesso,
    setLockProcesso: s.setLockProcesso,
    lockedProcesso: s.lockedProcesso,
    setLockedProcesso: s.setLockedProcesso,
    lockNf: s.lockNf,
    setLockNf: s.setLockNf,
    lockedNf: s.lockedNf,
    setLockedNf: s.setLockedNf,
    lockEndereco: s.lockEndereco,
    setLockEndereco: s.setLockEndereco,
    lockedEndereco: s.lockedEndereco,
    setLockedEndereco: s.setLockedEndereco,
    formData: s.formData,
    setFormData: s.setFormData,
    resetFormData: s.resetFormData,
  })));


  const { isLow } = usePerformance();
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
  const setItem = useCallback((val: string) => setFormData({ item: val }), [setFormData]);
  const setNf = useCallback((val: string) => setFormData({ nf: val }), [setFormData]);
  const setM2 = useCallback((val: string) => setFormData({ m2: val }), [setFormData]);
  const setLote = useCallback((val: string) => setFormData({ lote: val }), [setFormData]);
  const setEndereco = useCallback((val: string) => setFormData({ endereco: val }), [setFormData]);
  const setAiLargura = useCallback((val: string) => setFormData({ aiLargura: val }), [setFormData]);
  const setAiMLinear = useCallback((val: string) => setFormData({ aiMLinear: val }), [setFormData]);
  const setDiversosTipo = useCallback((val: FormData['diversosTipo']) => setFormData({ diversosTipo: val }), [setFormData]);
  const setDiversosMLinear = useCallback((val: string) => setFormData({ diversosMLinear: val }), [setFormData]);
  const setManualLargura = useCallback((val: string) => setFormData({ manualLargura: val }), [setFormData]);
  const setCoulisseMetragem = useCallback((val: 'm2' | 'mlinear') => setFormData({ coulisseMetragem: val }), [setFormData]);
  const setLockMetragem = useCallback((val: boolean) => setFormData({ lockMetragem: val }), [setFormData]);
  const setMadeiraTipo = useCallback((val: FormData['madeiraTipo']) => setFormData({ madeiraTipo: val }), [setFormData]);
  const setQuantidade = useCallback((val: string) => setFormData({ quantidade: val }), [setFormData]);

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
  
  const isDuplicate = useMemo(() => {
    // Para madeira, não aplicamos check de duplicidade por lote aqui
    if (isMadeira || !item) return false;
    
    const lowerItem = item.toLowerCase();
    const lowerLote = (lote || '').toLowerCase();
    const currentNfTrimmed = (nf || '').trim().toLowerCase();
    const currentProcTrimmed = (processo || '').trim().toLowerCase();
    
    return registros.some(r => {
      const itemMatch = (r.item || '').toLowerCase() === lowerItem;
      const loteMatch = (r.lote || '').toLowerCase() === lowerLote;
      
      if (isDiversos && !isCelular) {
        // No modo diversos (exceto Celular), validamos por NF
        return itemMatch && loteMatch && (r.nf || '').trim().toLowerCase() === currentNfTrimmed;
      }
      
      // Nos outros modos, validamos por Processo
      return itemMatch && loteMatch && (r.processo || '').trim().toLowerCase() === currentProcTrimmed;
    });
  }, [isMadeira, item, lote, registros, nf, processo, isDiversos, isCelular]);

  

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

  const handleEnderecoChange = useCallback((val: string) => {
    const normalized = val.replace(/[''`]/g, '-');
    const formatted = formatEndereco(normalized);
    setEndereco(formatted);
    validateEndereco(formatted);
    if (lockEndereco) setLockedEndereco(formatted);
  }, [lockEndereco, setEndereco, setLockedEndereco]);

  const toggleLockEndereco = useCallback(() => {
    if (!lockEndereco) {
      setLockedEndereco(endereco);
      setLockEndereco(true);
      toast.success('Endereço travado');
    } else {
      setLockEndereco(false);
      toast.success('Endereço destravado');
    }
  }, [lockEndereco, endereco, setLockedEndereco, setLockEndereco]);

  const handleProcessoChange = useCallback((val: string) => {
    const normalized = val.replace(/[''`]/g, '-');
    setProcesso(normalized);
    if (lockProcesso) setLockedProcesso(normalized);
  }, [lockProcesso, setProcesso, setLockedProcesso]);

  const handleNfChange = useCallback((val: string) => {
    const normalized = val.replace(/[''`]/g, '-');
    setNf(normalized);
    if (lockNf) setLockedNf(normalized);
  }, [lockNf, setNf, setLockedNf]);

  const handleItemChange = useCallback((val: string) => {
    setItem(val.replace(/[''`]/g, '-'));
  }, [setItem]);

  const toggleLockProcesso = useCallback(() => {
    if (!lockProcesso) {
      setLockedProcesso(processo);
      setLockProcesso(true);
      toast.success('PROC travado');
    } else {
      setLockProcesso(false);
      toast.success('PROC destravado');
    }
  }, [lockProcesso, processo, setLockedProcesso, setLockProcesso]);

  const toggleLockNf = useCallback(() => {
    if (!lockNf) {
      setLockedNf(nf);
      setLockNf(true);
      toast.success('NF travada');
    } else {
      setLockNf(false);
      toast.success('NF destravada');
    }
  }, [lockNf, nf, setLockedNf, setLockNf]);

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
      const raw = (data.choices?.[0]?.message?.content || '');
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Não foi possível encontrar o JSON na resposta do modelo.");
      const parsed = JSON.parse(jsonMatch[0]);
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
    if (!conferente) { toast.warning('Preencha o campo CONFERENTE no topo.'); return; }
    if (!item) { toast.warning('Preencha o campo Item.'); return; }
    if (requiresProcesso && !processo.trim()) { toast.warning('Preencha o campo PROCESSO.'); return; }
    if (requiresNF && !nf.trim()) { toast.warning('Preencha o campo NF.'); return; }
    if (requiresEndereco && !endereco) { toast.warning('Preencha o Endereço.'); return; }
    if (requiresEndereco && !ENDERECO_REGEX.test(endereco)) { toast.warning('Endereço inválido. Use: TEC01.A.N03'); return; }
    if (isDuplicate) { toast.error('Este item e lote já foram registrados nesta conferência.'); return; }

    const proc = processo.trim();

    if (isMadeira) {
      const qtd = parseInt(quantidade) || madeiraDefaults[madeiraTipo];
      const loteSistema = generateLoteSistemaCaixa(proc, item, 0, registros);
      const reg: Registro = {
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
        modoOrigem: 'madeira',
        isNew: true,
      };
      addRegistro(reg);
      toast.success(`✓ ${item} adicionado (${registros.length + 1} itens)`);
      resetForm();
      setQuantidade(madeiraDefaults[madeiraTipo].toString());
      setTimeout(() => { useAppStore.getState().updateRegistro(reg.id, { isNew: false }); }, 400);
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
    setTimeout(() => { useAppStore.getState().updateRegistro(reg.id, { isNew: false }); }, 400);
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
    <div className="bg-background xl:border-r border-border/40 overflow-hidden flex flex-col h-full">
      <div className="p-3 sm:p-5 xl:p-8 flex-1 overflow-y-auto space-y-5 sm:space-y-6 xl:space-y-8 custom-scrollbar relative">
        
        {/* Mode Toggle — only for Tecido (not Madeira) */}
        {!isMadeira && (
          <div className="flex bg-muted/50 border border-border/50 rounded-xl p-1 gap-1 relative z-10 overflow-x-auto no-scrollbar">
            {tecidoModes.map(m => {
              const Icon = m.icon;
              const isActive = currentMode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`flex-1 min-w-[90px] py-2.5 sm:py-3 rounded-lg text-[10px] sm:text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 uppercase tracking-wider active:scale-95 ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        )}


        {/* Manual tip */}
          {!isAI && (
            <div className="p-4 rounded-xl bg-muted/40 border border-border/50 text-xs flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ScanBarcode className="w-4 h-4 text-primary" />
                </div>
                <div className="flex flex-col">
                   <span className="text-foreground font-bold text-[13px]">
                    {isMadeira ? (
                      <><span className="text-primary">{madeiraTipo}:</span> Item + Lote + Qtd</>
                    ) : isDiversos ? (
                      <><span className="text-primary">{diversosTipo}:</span> Preencha os campos</>
                    ) : (
                      <>Bipe cada campo — avance com <kbd className="px-1.5 py-0.5 rounded bg-background text-primary border border-border font-bold text-[11px]">Enter</kbd></>
                    )}
                  </span>
                </div>
              </div>
              <div className="flex gap-1.5 flex-shrink-0 ml-3">
                {undoStack.length > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleUndo} className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                        <Undo2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Desfazer</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={resetForm} className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive">
                        <X className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Limpar</TooltipContent>
                  </Tooltip>
              </div>
            </div>
          )}

        {isDiversos && (
          <div className="space-y-4">
            <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] ml-2 opacity-50 flex items-center gap-2">
              <Layers3 className="w-3.5 h-3.5" /> Categorias Disponíveis
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {(['Rolo', 'PVT', 'Cortina', 'Celular'] as const).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setDiversosTipo(tipo)}
                  className={`rounded-[1.5rem] border-2 px-3 py-5 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all duration-150 active:scale-90 group/cat relative overflow-hidden ${
                    diversosTipo === tipo
                      ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                      : 'border-border/40 bg-card/20 text-muted-foreground/60 hover:text-primary hover:bg-primary/5 hover:border-primary/40'
                  }`}
                >
                  <span className="relative z-10">{tipo}</span>
                  <div className={`absolute bottom-0 left-0 w-full h-1 bg-white/20 transition-transform duration-500 ${diversosTipo === tipo ? 'scale-x-100' : 'scale-x-0'}`} />
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
              {(['Lâmina', 'Base', 'Bandô'] as const).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setMadeiraTipo(tipo)}
                  className={`rounded-[1.5rem] border-2 px-3 py-5 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] transition-all duration-150 active:scale-90 group/cat relative overflow-hidden ${
                    madeiraTipo === tipo
                      ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                      : 'border-border/40 bg-card/20 text-muted-foreground/60 hover:text-primary hover:bg-primary/5 hover:border-primary/40'
                  }`}
                >
                  <span className="relative z-10">{tipo}</span>
                  <div className={`absolute bottom-0 left-0 w-full h-1 bg-white/20 transition-transform duration-500 ${madeiraTipo === tipo ? 'scale-x-100' : 'scale-x-0'}`} />
                </button>
              ))}
            </div>
          </div>
        )}


        {/* Dropzone for AI modes */}
        
          {showDropzone && (
            <div className="space-y-4">
              <div className="text-[10px] font-black text-primary uppercase tracking-[0.3em] text-center opacity-80 flex items-center justify-center gap-3">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/20" />
                <span>Marina Vision IA</span>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/20" />
              </div>
              
              <div
                className={`dropzone group/dz border-2 rounded-3xl transition-all duration-300 overflow-hidden relative ${preview ? 'border-primary shadow-2xl shadow-primary/10' : 'border-border/40 hover:border-primary/40 hover:bg-primary/5 shadow-inner'}`}
                onDragOver={e => e.preventDefault()}
                onDrop={handleDrop}
                style={{ height: preview || cameraActive ? 240 : 180 }}
              >
                {cameraActive && (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover absolute inset-0" />
                )}
                {preview && !cameraActive && (
                  <img src={preview} alt="Etiqueta Capturada" className="w-full h-full object-cover" />
                )}
                {!preview && !cameraActive && (
                  <div className="text-center p-6 select-none flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-primary/5 text-primary transition-all duration-300">
                      <Camera className="w-10 h-10 opacity-30" />
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
                 <div style={{ width: `${progress}%` }} className="h-full bg-primary" />
              </div>

              {preview && !cameraActive && (
                <Button onClick={processOpenRouter} disabled={aiLoading} className="w-full h-14 rounded-[1.5rem] font-black uppercase tracking-[0.15em] shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50">
                  {aiLoading ? <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <Zap className="w-5 h-5 mr-2 text-yellow-300 fill-yellow-300" />}
                  <span>{aiLoading ? 'Processando...' : 'Analisar com Marina Vision IA'}</span>
                </Button>
              )}

              {aiStatus && (
                  <div className={`p-4 rounded-2xl border-2 text-xs font-bold leading-relaxed shadow-sm ${aiStatus.type === 'ok' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}>
                    <div className="flex items-center gap-2 mb-1">
                       {aiStatus.type === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                       <span className="uppercase tracking-widest">{aiStatus.type === 'ok' ? 'Análise Concluída' : 'Erro na Análise'}</span>
                    </div>
                    {aiStatus.msg}
                  </div>
                )}
              
            </div>
          )}
        

        {/* Form Fields */}
        <div className="space-y-8 relative z-10">
          <div className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2 opacity-50 ml-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> {isMadeira ? 'Especificações Técnicas' : 'Detalhamento do Material'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            {/* PROC field — Coulisse, IA, and Celular */}
            {requiresProcesso && (
              <div className="space-y-3 sm:col-span-1 group/field">
                <div className="flex items-center justify-between px-2">
                  <label htmlFor="proc-input" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-focus-within/field:text-primary transition-colors">Processo (PROC)</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLockProcesso}
                    className={`h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      lockProcesso
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {lockProcesso ? <Lock className="w-3 h-3 mr-2" /> : <Unlock className="w-3 h-3 mr-2" />}
                    {lockProcesso ? 'Bloqueado' : 'Travar'}
                  </Button>
                </div>
                <div className="relative">
                  <input
                    id="proc-input"
                    value={processo}
                    onChange={e => handleProcessoChange(e.target.value)}
                    onKeyDown={e => handleFieldKeyDown(e, itemRef)}
                    className={`w-full h-16 rounded-3xl border-2 px-6 text-sm font-mono font-bold transition-all duration-500 shadow-sm ${
                      lockProcesso ? 'bg-primary/5 border-primary/30 text-primary shadow-inner' : 'bg-card/30 border-border/40 focus:border-primary focus:bg-background focus:ring-8 focus:ring-primary/5'
                    }`}
                    placeholder="Ex: 123456..."
                    autoComplete="off"
                    readOnly={lockProcesso && !!lockedProcesso}
                  />
                  {lockProcesso && <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/30"><Lock className="w-4 h-4" /></div>}
                </div>
              </div>
            )}

            {/* Item / Referência */}
            <div className="space-y-3 sm:col-span-1 group/field">
              <label htmlFor="item-input" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 group-focus-within/field:text-primary transition-colors">Item / Referência</label>
              <div className="relative">
                <input
                  id="item-input"
                  ref={itemRef}
                  value={item}
                  onChange={e => handleItemChange(e.target.value)}
                  onKeyDown={e => handleFieldKeyDown(e, getNextRefAfterItem())}
                  className="w-full h-16 rounded-3xl border-2 border-border/40 bg-card/30 px-6 text-sm font-mono font-bold focus:border-primary focus:bg-background focus:ring-8 focus:ring-primary/5 transition-all duration-500 shadow-sm placeholder:opacity-30"
                  placeholder="Ex: SRC-3003-05-30..." 
                  autoComplete="off"
                />
                {usesLarguraFromItem && largura > 0 && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Badge variant="secondary" className="bg-primary text-white border-none font-black text-[9px] uppercase tracking-tighter px-2 h-6 shadow-lg shadow-primary/20">Larg: {largura.toFixed(2)}m</Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Coulisse: optional manual largura */}
            {isCoulisse && (
              <div className="space-y-3 sm:col-span-1 group/field">
                <label htmlFor="largura-manual" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 group-focus-within/field:text-primary transition-colors">Largura do Tecido (m)</label>
                <input
                  id="largura-manual"
                  ref={manualLarguraRef}
                  type="number" step="0.01" value={manualLargura}
                  onChange={e => setManualLargura(e.target.value)}
                  onKeyDown={e => handleFieldKeyDown(e, m2Ref)}
                  className="w-full h-16 rounded-3xl border-2 border-border/40 bg-card/30 px-6 text-sm font-bold focus:border-primary focus:bg-background focus:ring-8 focus:ring-primary/5 transition-all duration-500 shadow-sm placeholder:opacity-30"
                  placeholder="Ex: 2.80" autoComplete="off" inputMode="decimal"
                />
              </div>
            )}

            {/* NF field — Diversos except Celular */}
            {requiresNF && (
              <div className="space-y-3 sm:col-span-1 group/field">
                <div className="flex items-center justify-between px-2">
                  <label htmlFor="nf-input" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-focus-within/field:text-primary transition-colors">Nota Fiscal (NF)</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLockNf}
                    className={`h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      lockNf
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {lockNf ? <Lock className="w-3 h-3 mr-2" /> : <Unlock className="w-3 h-3 mr-2" />}
                    {lockNf ? 'Bloqueado' : 'Travar'}
                  </Button>
                </div>
                <div className="relative">
                  <input
                    id="nf-input"
                    ref={nfRef}
                    value={nf}
                    onChange={e => handleNfChange(e.target.value)}
                    onKeyDown={e => handleFieldKeyDown(e, getNextRefAfterNf())}
                    className={`w-full h-16 rounded-3xl border-2 px-6 text-sm font-mono font-bold transition-all duration-500 shadow-sm ${
                      lockNf ? 'bg-primary/5 border-primary/30 text-primary shadow-inner' : 'bg-card/30 border-border/40 focus:border-primary focus:bg-background focus:ring-8 focus:ring-primary/5'
                    }`}
                    placeholder="NF..."
                    autoComplete="off"
                    readOnly={lockNf && !!lockedNf}
                  />
                  {lockNf && <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/30"><Lock className="w-4 h-4" /></div>}
                </div>
              </div>
            )}

            {/* Madeira: Lote + Qtd */}
            {isMadeira && (
              <>
                <div className="space-y-3 group/field">
                  <label htmlFor="lote-input" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 group-focus-within/field:text-primary transition-colors">Lote / Batch</label>
                  <input
                    id="lote-input"
                    ref={loteRef}
                    value={lote}
                    onChange={e => setLote(e.target.value.replace(/[''`]/g, '-'))}
                    onKeyDown={e => handleFieldKeyDown(e, quantidadeRef)}
                    className="w-full h-16 rounded-3xl border-2 border-border/40 bg-card/30 px-6 text-sm font-mono font-bold focus:border-primary focus:bg-background focus:ring-8 focus:ring-primary/5 transition-all duration-500 shadow-sm"
                    placeholder="Lote..." autoComplete="off"
                  />
                </div>
                <div className="space-y-3 group/field">
                  <label htmlFor="qtd-input" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 group-focus-within/field:text-primary transition-colors">Qtd por Caixa</label>
                  <input
                    id="qtd-input"
                    ref={quantidadeRef}
                    type="number" step="1" value={quantidade}
                    onChange={e => setQuantidade(e.target.value)}
                    onKeyDown={e => handleFieldKeyDown(e, null)}
                    className="w-full h-16 rounded-3xl border-2 border-border/40 bg-card/30 px-6 text-sm font-bold focus:border-primary focus:bg-background focus:ring-8 focus:ring-primary/5 transition-all duration-500 shadow-sm"
                    placeholder={madeiraDefaults[madeiraTipo].toString()} autoComplete="off" inputMode="numeric"
                  />
                </div>
              </>
            )}

            {/* Metragem Fields */}
            {!isMadeira && (
              <>
                <div className="space-y-3 group/field">
                  <label htmlFor="metragem-input" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 group-focus-within/field:text-primary transition-colors">
                    {isAI || isPVT || coulisseUsesMLinear ? 'Metragem Linear' : 'Metragem Total (M²)'}
                  </label>
                  <div className="relative">
                    <input
                      id="metragem-input"
                      ref={m2Ref}
                      type="number" step="0.1" 
                      value={isAI ? aiMLinear : (isPVT || coulisseUsesMLinear) ? diversosMLinear : m2}
                      onChange={e => isAI ? setAiMLinear(e.target.value) : (isPVT || coulisseUsesMLinear) ? setDiversosMLinear(e.target.value) : setM2(e.target.value)}
                      onKeyDown={e => handleFieldKeyDown(e, isAI ? larguraRef : loteRef)}
                      className="w-full h-16 rounded-3xl border-2 border-border/40 bg-card/30 px-6 text-sm font-bold focus:border-primary focus:bg-background focus:ring-8 focus:ring-primary/5 transition-all duration-500 shadow-sm"
                      placeholder="0.0" autoComplete="off" inputMode="decimal"
                    />
                    {mLinear > 0 && !isAI && !isPVT && !coulisseUsesMLinear && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Badge variant="outline" className="border-primary text-primary font-black bg-primary/5">Linear: {formatML(mLinear)}</Badge>
                      </div>
                    )}
                  </div>
                </div>

                {isAI ? (
                  <div className="space-y-3 group/field">
                    <label htmlFor="largura-ai" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 group-focus-within/field:text-primary transition-colors">Largura Detectada (m)</label>
                    <input
                      id="largura-ai"
                      ref={larguraRef}
                      type="number" step="0.01" value={aiLargura}
                      onChange={e => setAiLargura(e.target.value)}
                      onKeyDown={e => handleFieldKeyDown(e, lockEndereco ? null : enderecoRef)}
                      className="w-full h-16 rounded-3xl border-2 border-border/40 bg-card/30 px-6 text-sm font-bold focus:border-primary focus:bg-background focus:ring-8 focus:ring-primary/5 transition-all duration-500 shadow-sm"
                      placeholder="Ex: 2.80" autoComplete="off" inputMode="decimal"
                    />
                  </div>
                ) : (
                  <div className="space-y-3 group/field">
                    <label htmlFor="lote-material" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 group-focus-within/field:text-primary transition-colors">Lote / Batch</label>
                    <input
                      id="lote-material"
                      ref={loteRef}
                      value={lote}
                      onChange={e => setLote(e.target.value.replace(/[''`]/g, '-'))}
                      onKeyDown={e => handleFieldKeyDown(e, requiresEndereco && !lockEndereco ? enderecoRef : null)}
                      className="w-full h-16 rounded-3xl border-2 border-border/40 bg-card/30 px-6 text-sm font-mono font-bold focus:border-primary focus:bg-background focus:ring-8 focus:ring-primary/5 transition-all duration-500 shadow-sm"
                      placeholder="Lote..." autoComplete="off"
                    />
                  </div>
                )}
              </>
            )}

            {/* Endereço */}
            {requiresEndereco && (
              <div className="space-y-3 sm:col-span-2 group/field">
                <div className="flex items-center justify-between px-2">
                  <label htmlFor="endereco-input" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-focus-within/field:text-primary transition-colors">Endereço de Armazenagem</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleLockEndereco}
                    className={`h-8 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      lockEndereco
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {lockEndereco ? <Lock className="w-3 h-3 mr-2" /> : <Unlock className="w-3 h-3 mr-2" />}
                    {lockEndereco ? 'Bloqueado' : 'Travar'}
                  </Button>
                </div>
                <div className="relative">
                  <input
                    id="endereco-input"
                    ref={enderecoRef}
                    value={endereco}
                    onChange={e => handleEnderecoChange(e.target.value)}
                    onKeyDown={e => handleFieldKeyDown(e, null)}
                    className={`w-full h-16 rounded-3xl border-2 px-6 text-sm font-mono font-bold transition-all duration-500 uppercase shadow-sm ${
                      lockEndereco ? 'bg-primary/5 border-primary/30 text-primary shadow-inner' : (enderecoError ? 'border-destructive bg-destructive/5' : 'bg-card/30 border-border/40 focus:border-primary focus:bg-background focus:ring-8 focus:ring-primary/5')
                    }`}
                    placeholder="TEC01.A.N03" autoComplete="off"
                    readOnly={lockEndereco && !!lockedEndereco}
                  />
                  {lockEndereco && <div className="absolute right-6 top-1/2 -translate-y-1/2 text-primary/30"><Lock className="w-4 h-4" /></div>}
                </div>
                {enderecoError && <p className="text-[10px] text-destructive font-black uppercase tracking-[0.2em] ml-2 animate-bounce">{enderecoError}</p>}
              </div>
            )}
          </div>
        </div>


        {/* Computed Preview Card */}
        <div className="p-5 sm:p-8 rounded-[1.8rem] sm:rounded-[2.5rem] bg-[#0A0D14] text-white shadow-2xl relative overflow-hidden group/card transition-all duration-700 hover:scale-[1.02] border border-white/5">
          <div className="absolute top-0 right-0 p-10 opacity-5 group-hover/card:scale-150 group-hover/card:rotate-12 transition-all duration-1000 hidden sm:block">
             <Package className="w-40 h-40 text-primary" />
          </div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-[80px]" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-10 relative z-10">
            {isMadeira ? (
              <>
                <div className="space-y-1 sm:space-y-1.5">
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Subtipo</p>
                  <p className="text-2xl font-black tracking-tight">{madeiraTipo}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Quantidade</p>
                  <p className="text-2xl font-black tracking-tight">{quantidade || madeiraDefaults[madeiraTipo]} <span className="text-[10px] opacity-40">UND</span></p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Largura Real</p>
                  <p className="text-2xl font-black tracking-tight">{largura > 0 ? largura.toFixed(2) + 'm' : '—'}</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Metragem Linear</p>
                  <p className="text-2xl font-black tracking-tight">{mLinear > 0 ? formatML(mLinear) : '—'}</p>
                </div>
              </>
            )}
            <div className="col-span-2 space-y-3 border-t border-white/10 pt-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Lote Sistema Gerado</p>
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
              <div className="p-4 rounded-2xl bg-white/5 font-mono text-xs sm:text-sm font-bold text-primary-foreground/90 truncate border border-white/5 shadow-inner group-hover/card:border-primary/20 transition-colors duration-500">
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

          {showPreview && registros.length > 0 && (
              <div className="overflow-hidden rounded-3xl border-2 border-primary/20 bg-card/60 shadow-md">
                <div className="p-4 border-b border-border/40 bg-muted/30 flex items-center justify-between">
                   <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Últimos Registros</span>
                   <Badge className="bg-primary text-white font-black">{registros.length}</Badge>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  <table className="w-full text-[11px] border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-muted/90  z-10">
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
              </div>
            )}
          

          {isDuplicate && (
             <div
               className="p-4 rounded-2xl bg-destructive/10 border-2 border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-sm"
             >
               <AlertTriangle className="w-5 h-5" />
               Atenção: O item "{item}" já consta nesta conferência.
             </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default LeftPanel;
