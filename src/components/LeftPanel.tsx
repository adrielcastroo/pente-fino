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
import LoteMestreSelector from '@/components/madeira/LoteMestreSelector';
import AvariaForm, { AvariaTipo } from '@/components/madeira/AvariaForm';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const VISION_PROMPT = `Você é um especialista em leitura de etiquetas de rolos de tecido. Analise a imagem e extraia:

ITEM (código do tecido): Item, Ref, Item No, Description, Artigo, Part No
M² (metragem quadrada): QUANTITY, Q'TY, Quantity, Qty
LARGURA (largura do tecido): WIDTH, Width, Largura

Retorne SOMENTE JSON: {"item":"<código>","m2":<número float ou null>,"width":<número inteiro ou null>}`;

export const LeftPanel = memo(function LeftPanel() {
  const {
    currentMode, setMode, processo, setProcesso, conferente, registros,
    addRegistro, undoStack, undo: undoAction,
    lockProcesso, setLockProcesso, lockedProcesso, setLockedProcesso,
    lockNf, setLockNf, lockedNf, setLockedNf,
    lockEndereco, setLockEndereco, lockedEndereco, setLockedEndereco,
    lockItem, setLockItem, lockedItem, setLockedItem,
    lockLote, setLockLote, lockedLote, setLockedLote,
    lockMetragem: lockMetragemGlobal, setLockMetragem: setLockMetragemGlobal,
    lockedMetragem, setLockedMetragem,
    lockCortinaLargura, setLockCortinaLargura, lockedCortinaLargura, setLockedCortinaLargura,
    formData, setFormData, resetFormData
  } = useAppStore(useShallow(s => ({
    currentMode: s.currentMode,
    setMode: s.setMode,
    processo: s.processo,
    setProcesso: s.setProcesso,
    conferente: s.conferente,
    registros: s.registros,
    addRegistro: s.addRegistro,
    undoStack: s.undoStack,
    undo: s.undo,
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
    lockItem: s.lockItem,
    setLockItem: s.setLockItem,
    lockedItem: s.lockedItem,
    setLockedItem: s.setLockedItem,
    lockLote: s.lockLote,
    setLockLote: s.setLockLote,
    lockedLote: s.lockedLote,
    setLockedLote: s.setLockedLote,
    lockMetragem: s.lockMetragem,
    setLockMetragem: s.setLockMetragem,
    lockedMetragem: s.lockedMetragem,
    setLockedMetragem: s.setLockedMetragem,
    lockCortinaLargura: s.lockCortinaLargura,
    setLockCortinaLargura: s.setLockCortinaLargura,
    lockedCortinaLargura: s.lockedCortinaLargura,
    setLockedCortinaLargura: s.setLockedCortinaLargura,
    formData: s.formData,
    setFormData: s.setFormData,
    resetFormData: s.resetFormData
  })));


  const { isLow } = usePerformance();
  const {
    item, nf, m2, lote, endereco, aiLargura, aiMLinear, diversosTipo, diversosMLinear,
    manualLargura, coulisseMetragem, lockMetragem, madeiraTipo, quantidade,
    cortinaLargura, cortinaMetragem
  } = formData;

  const [localItem, setLocalItem] = useState(item);
  const [localNf, setLocalNf] = useState(nf);
  const [localProcesso, setLocalProcesso] = useState(processo);
  const [localEndereco, setLocalEndereco] = useState(endereco);

  const [fotoB64, setFotoB64] = useState<string | null>(null);
  const [fotoMime, setFotoMime] = useState('image/jpeg');
  const [preview, setPreview] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
  const [progress, setProgress] = useState(0);
  const [enderecoError, setEnderecoError] = useState('');

  // Madeira-specific extras: lote mestre + avaria
  const [loteMestreId, setLoteMestreId] = useState<string | null>(null);
  const [avariaEnabled, setAvariaEnabled] = useState(false);
  const [avariaTipo, setAvariaTipo] = useState<AvariaTipo | null>(null);
  const [avariaDescricao, setAvariaDescricao] = useState('');
  const [avariaFotoUrl, setAvariaFotoUrl] = useState<string | null>(null);

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
  const setCortinaLargura = useCallback((val: string) => setFormData({ cortinaLargura: val }), [setFormData]);
  const setCortinaMetragem = useCallback((val: 'm2' | 'mlinear') => setFormData({ cortinaMetragem: val }), [setFormData]);

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
  const cortinaUsesM2 = isCortina && cortinaMetragem === 'm2';
  const cortinaUsesMLinear = isCortina && cortinaMetragem === 'mlinear';
  const usesM2Input = !isMadeira && !isAI && !isPVT && !coulisseUsesMLinear && !cortinaUsesMLinear && (isRolo || isCortina || isCoulisse || isCelular);
  // Cortina now uses manual largura (cortinaLargura), not extracted from item
  const usesLarguraFromItem = !isAI && isRolo;
  const requiresEndereco = !isPVT && !isCelular;

  const madeiraDefaults: Record<string, number> = { 'Lâmina': 100, 'Base': 24, 'Bandô': 24 };

  const cortinaLarguraNum = useMemo(() => parseFloat(cortinaLargura) || 0, [cortinaLargura]);

  const largura = useMemo(() => 
    isAI ? aiLarguraNum
    : isMadeira ? 0
    : isCoulisse ? (manualLarguraNum || extractLarguraFromItem(localItem))
    : isCortina ? cortinaLarguraNum
    : isCelular ? celularDivisor
    : usesLarguraFromItem ? extractLarguraFromItem(localItem)
    : 0,
    [isAI, aiLarguraNum, isMadeira, isCoulisse, manualLarguraNum, localItem, isCortina, cortinaLarguraNum, isCelular, celularDivisor, usesLarguraFromItem]
  );

  const mLinear = useMemo(() => 
    isAI ? aiMLinearNum
    : isMadeira ? 0
    : (isPVT || coulisseUsesMLinear || cortinaUsesMLinear) ? diversosMLinearNum
    : isCelular ? (m2Num > 0 ? m2Num / celularDivisor : 0)
    : (largura > 0 ? m2Num / largura : 0),
    [isAI, aiMLinearNum, isMadeira, isPVT, coulisseUsesMLinear, cortinaUsesMLinear, diversosMLinearNum, isCelular, m2Num, celularDivisor, largura]
  );
  
  const isDuplicate = useMemo(() => {
    if (isMadeira || !localItem || !lote) return false;
    const lowerItem = localItem.toLowerCase();
    const lowerLote = lote.toLowerCase();
    
    return registros.some(r => 
      (r.item || '').toLowerCase() === lowerItem && 
      (r.lote || '').toLowerCase() === lowerLote &&
      (r.nf || '').trim() === localNf.trim()
    );
  }, [isMadeira, localItem, lote, registros, localNf]);

  

  const formatEndereco = (val: string): string => {
    const clean = val.toUpperCase().replace(/\./g, '');
    if (clean.length <= 5) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 5)}.${clean.slice(5)}`;
    return `${clean.slice(0, 5)}.${clean.slice(5, 6)}.${clean.slice(6)}`;
  };

  const validateEndereco = (val: string) => {
    if (!val) { setEnderecoError(''); return; }
    const pattern = isMadeira ? 'Padrão: MAD01.A.N01' : 'Padrão: TEC01.A.N03';
    if (!ENDERECO_REGEX.test(val)) {
      setEnderecoError(pattern);
      return;
    }
    if (isMadeira && !val.startsWith('MAD')) {
      setEnderecoError('Deve iniciar com MAD');
      return;
    }
    setEnderecoError('');
  };

  // Sync local state with store values when they change externally
  useEffect(() => { setLocalItem(item); }, [item]);
  useEffect(() => { setLocalNf(nf); }, [nf]);
  useEffect(() => { setLocalProcesso(processo); }, [processo]);
  useEffect(() => { setLocalEndereco(endereco); }, [endereco]);

  // Sync locked values
  useEffect(() => {
    if (lockEndereco && lockedEndereco && lockedEndereco !== localEndereco) {
      setLocalEndereco(lockedEndereco);
      setEndereco(lockedEndereco);
    }
  }, [lockEndereco, lockedEndereco]);

  useEffect(() => {
    if (lockProcesso && lockedProcesso && processo !== lockedProcesso) {
      setLocalProcesso(lockedProcesso);
      setProcesso(lockedProcesso);
    }
  }, [lockProcesso, lockedProcesso]);

  useEffect(() => {
    if (lockNf && lockedNf && nf !== lockedNf) {
      setLocalNf(lockedNf);
      setNf(lockedNf);
    }
  }, [lockNf, lockedNf]);

  useEffect(() => {
    if (lockItem && lockedItem && localItem !== lockedItem) {
      setLocalItem(lockedItem);
      setItem(lockedItem);
    }
  }, [lockItem, lockedItem]);

  useEffect(() => {
    if (lockLote && lockedLote && lote !== lockedLote) {
      setLote(lockedLote);
    }
  }, [lockLote, lockedLote]);

  useEffect(() => {
    if (lockMetragemGlobal && lockedMetragem && diversosMLinear !== lockedMetragem) {
      setDiversosMLinear(lockedMetragem);
    }
  }, [lockMetragemGlobal, lockedMetragem]);

  useEffect(() => {
    if (lockCortinaLargura && lockedCortinaLargura && cortinaLargura !== lockedCortinaLargura) {
      setCortinaLargura(lockedCortinaLargura);
    }
  }, [lockCortinaLargura, lockedCortinaLargura]);

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

  const resetForm = useCallback(() => {
    resetFormData();
    setAiStatus(null); setProgress(0);
    setEnderecoError('');
    stopCamera();
    setTimeout(() => itemRef.current?.focus(), 50);
  }, [resetFormData]);

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

  const openNativeCamera = useCallback(() => { cameraInputRef.current?.click(); }, []);

  const openLiveCamera = useCallback(async () => {
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
  }, [openNativeCamera]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const snapPhoto = useCallback(() => {
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
  }, [autoSaveCapturedPhoto, stopCamera]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f?.type.startsWith('image/')) loadFile(f);
  }, [loadFile]);

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
    return () => {
      document.removeEventListener('paste', handlePaste as any);
      stopCamera();
    };
  }, [handlePaste, stopCamera]);

  const handleFieldKeyDown = useCallback((e: React.KeyboardEvent, nextRef: React.RefObject<HTMLInputElement> | null) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (nextRef?.current) {
        nextRef.current.focus();
        nextRef.current.select();
      } else {
        handleAdd();
      }
    }
  }, []);

  const handleEnderecoChange = useCallback((val: string) => {
    const normalized = val.replace(/[''`]/g, '-');
    const formatted = formatEndereco(normalized);
    setLocalEndereco(formatted);
    validateEndereco(formatted);
  }, []);

  const handleEnderecoBlur = useCallback(() => {
    setEndereco(localEndereco);
    if (lockEndereco) setLockedEndereco(localEndereco);
  }, [localEndereco, setEndereco, lockEndereco, setLockedEndereco]);

  const toggleLockEndereco = useCallback(() => {
    if (!lockEndereco) {
      setLockedEndereco(localEndereco);
      setLockEndereco(true);
      toast.success('Endereço travado');
    } else {
      setLockEndereco(false);
      toast.success('Endereço destravado');
    }
  }, [lockEndereco, localEndereco, setLockedEndereco, setLockEndereco]);

  const handleProcessoChange = useCallback((val: string) => {
    setLocalProcesso(val.replace(/[''`]/g, '-'));
  }, []);

  const handleProcessoBlur = useCallback(() => {
    const trimmed = localProcesso.trim();
    setProcesso(trimmed);
    if (lockProcesso) setLockedProcesso(trimmed);
  }, [localProcesso, setProcesso, lockProcesso, setLockedProcesso]);

  const handleNfChange = useCallback((val: string) => {
    setLocalNf(val.replace(/[''`]/g, '-'));
  }, []);

  const handleNfBlur = useCallback(() => {
    const trimmed = localNf.trim();
    setNf(trimmed);
    if (lockNf) setLockedNf(trimmed);
  }, [localNf, setNf, lockNf, setLockedNf]);

  const handleItemChange = useCallback((val: string) => {
    setLocalItem(val.replace(/[''`]/g, '-'));
  }, []);

  const handleItemBlur = useCallback(() => {
    setItem(localItem);
  }, [localItem, setItem]);

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

  const toggleLockItem = useCallback(() => {
    if (!lockItem) {
      setLockedItem(localItem);
      setLockItem(true);
      toast.success('Item travado');
    } else {
      setLockItem(false);
      toast.success('Item destravado');
    }
  }, [lockItem, localItem, setLockedItem, setLockItem]);

  const toggleLockLote = useCallback(() => {
    if (!lockLote) {
      setLockedLote(lote);
      setLockLote(true);
      toast.success('Lote travado');
    } else {
      setLockLote(false);
      toast.success('Lote destravado');
    }
  }, [lockLote, lote, setLockedLote, setLockLote]);

  const toggleLockMetragem = useCallback(() => {
    if (!lockMetragemGlobal) {
      setLockedMetragem(diversosMLinear);
      setLockMetragemGlobal(true);
      toast.success('Metragem travada');
    } else {
      setLockMetragemGlobal(false);
      toast.success('Metragem destravada');
    }
  }, [lockMetragemGlobal, diversosMLinear, setLockedMetragem, setLockMetragemGlobal]);

  const toggleLockCortinaLargura = useCallback(() => {
    if (!lockCortinaLargura) {
      setLockedCortinaLargura(cortinaLargura);
      setLockCortinaLargura(true);
      toast.success('Largura travada');
    } else {
      setLockCortinaLargura(false);
      toast.success('Largura destravada');
    }
  }, [lockCortinaLargura, cortinaLargura, setLockedCortinaLargura, setLockCortinaLargura]);

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
    // Basic validations that apply to all tecido modes
    if (!conferente) { toast.warning('Preencha o campo CONFERENTE no topo.'); return; }
    
    // Ensure store is updated with current local values before validation
    const currentItem = localItem.trim();
    const currentProc = localProcesso.trim();
    const currentNf = localNf.trim();

    if (!currentItem) { toast.warning('Preencha o campo Item.'); return; }
    if (requiresProcesso && !currentProc) { toast.warning('Preencha o campo PROCESSO.'); return; }
    if (requiresNF && !currentNf) { toast.warning('Preencha o campo NF.'); return; }

    const proc = currentProc;
    const item = currentItem;
    const nf = currentNf;

    if (isMadeira) {
      const finalAddr = (localEndereco || endereco || '').toUpperCase();
      if (!finalAddr) { toast.warning('Preencha o Endereço.'); return; }
      if (!ENDERECO_REGEX.test(finalAddr)) { toast.warning('Endereço inválido. Use: MAD01.A.N01'); return; }
      if (!finalAddr.startsWith('MAD')) { toast.warning('Endereço de madeira deve iniciar com MAD.'); return; }

      const qtd = parseInt(quantidade) || madeiraDefaults[madeiraTipo];
      const loteSistema = generateLoteSistemaCaixa(proc, item, 0, registros);
      const reg: Registro = {
        id: crypto.randomUUID(),
        item,
        processo: proc,
        nf: '',
        endereco: localEndereco || endereco || '',
        m2: 0,
        mLinear: 0,
        largura: 0,
        lote: lote || '',
        loteSistema,
        quantidade: qtd,
        tipoTecido: madeiraTipo,
        modoOrigem: 'madeira',
        isNew: true,
        loteMestreId: loteMestreId,
        avariaTipo: avariaEnabled ? avariaTipo : null,
        avariaDescricao: avariaEnabled ? (avariaDescricao || null) : null,
        avariaFotoUrl: avariaEnabled ? avariaFotoUrl : null,
      };
      addRegistro(reg);
      toast.success(`✓ ${item} adicionado (${registros.length + 1} itens)`);
      resetForm();
      setQuantidade(madeiraDefaults[madeiraTipo].toString());
      // Reset avaria after submission, keep lote mestre as it is usually shared per box
      setAvariaEnabled(false);
      setAvariaTipo(null);
      setAvariaDescricao('');
      setAvariaFotoUrl(null);
      setTimeout(() => { useAppStore.getState().updateRegistro(reg.id, { isNew: false }); }, 400);
      return;
    }

    if (isAI && aiLarguraNum <= 0) { toast.warning('Preencha a Largura.'); return; }
    if (usesM2Input && m2Num > 0 && largura <= 0) { toast.warning('Largura não detectada no item. Verifique o código ou preencha manualmente.'); return; }
    if (isCortina && largura <= 0) { toast.warning('Preencha a Largura do tecido.'); return; }
    if (mLinear <= 0) { toast.warning(`Preencha o campo ${(isPVT || isAI || coulisseUsesMLinear || cortinaUsesMLinear) ? 'M Linear' : 'M²'}.`); return; }
    if (requiresEndereco && !endereco) { toast.warning('Preencha o Endereço.'); return; }
    if (requiresEndereco && !ENDERECO_REGEX.test(endereco)) { toast.warning('Endereço inválido. Use: TEC01.A.N03'); return; }

    const resolvedEndereco = requiresEndereco ? endereco : '';
    const resolvedM2 = isAI ? (aiMLinearNum * aiLarguraNum) : (isPVT || coulisseUsesMLinear || cortinaUsesMLinear) ? 0 : m2Num;
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
    { key: 'openrouter' as const, label: 'IA', icon: Sparkles },
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
  const previewLoteSistema = useMemo(() => {
    const proc = processo.trim();
    if (isMadeira) {
      if (proc) return generateLoteSistemaCaixa(proc, item || '-', 0, registros);
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
  }, [processo, item, nf, endereco, mLinear, isMadeira, isDiversos, isCelular, requiresEndereco, registros]);

  // Set default quantidade when madeiraTipo changes
  useEffect(() => {
    if (isMadeira) {
      setQuantidade(madeiraDefaults[madeiraTipo].toString());
    }
  }, [madeiraTipo, isMadeira]);

  return (
    <div className="bg-background xl:border-r border-border/40 overflow-hidden flex flex-col h-full rounded-2xl border border-border/50 lg:border-none lg:rounded-none">
      <div className="p-3 sm:p-5 flex-1 overflow-y-auto space-y-4 sm:space-y-5 custom-scrollbar">
        
        {/* Mode Toggle */}
        {!isMadeira && (
          <div className="flex gap-2">
            {tecidoModes.map(m => {
              const Icon = m.icon;
              const isActive = currentMode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`flex-1 py-3 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider border ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background border-border text-muted-foreground hover:text-foreground hover:border-primary/40'
                  }`}
                  aria-pressed={isActive}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Action buttons */}
        {!isAI && (
          <div className="flex items-center justify-end text-xs text-muted-foreground">
            <div className="flex gap-1">
              {undoStack.length > 0 && (
                <Button variant="ghost" size="icon" onClick={handleUndo} className="h-7 w-7 rounded-md hover:bg-primary/10 hover:text-primary">
                  <Undo2 className="w-3.5 h-3.5" />
                </Button>
              )}
              {(item || nf || m2 || lote || endereco || processo) && (
                <Button variant="ghost" size="sm" onClick={resetForm} className="h-7 rounded-md text-[10px] font-medium text-destructive/70 hover:bg-destructive/10 hover:text-destructive px-2">
                  Limpar campos
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Diversos categories */}
        {isDiversos && (
          <div className="grid grid-cols-4 gap-2">
            {(['Rolo', 'PVT', 'Cortina', 'Celular'] as const).map(tipo => (
              <button
                key={tipo}
                onClick={() => setDiversosTipo(tipo)}
                className={`rounded-full border py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                  diversosTipo === tipo
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
        )}

        {/* Madeira subtypes */}
        {isMadeira && (
          <>
            <div className="grid grid-cols-3 gap-2">
              {(['Lâmina', 'Base', 'Bandô'] as const).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setMadeiraTipo(tipo)}
                  className={`rounded-full border py-2.5 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    madeiraTipo === tipo
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
            {/* Próximo CX preview */}
            <div className="flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Package className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Próxima Caixa</span>
              </div>
              <span className="font-mono text-sm font-bold text-primary">
                {processo.trim()
                  ? (generateLoteSistemaCaixa(processo.trim(), '-', 0, registros).match(/^CX\d+/)?.[0] ?? 'CX01')
                  : 'CX01'}
              </span>
            </div>
          </>
        )}

        {/* AI Dropzone */}
        {showDropzone && (
          <div className="space-y-3">
            <div
              className={`border rounded-xl transition-all overflow-hidden relative ${preview ? 'border-primary/40' : 'border-dashed border-border/60 hover:border-primary/30'}`}
              onDragOver={e => e.preventDefault()}
              onDrop={handleDrop}
              style={{ height: preview || cameraActive ? 200 : 140 }}
            >
              {cameraActive && (
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover absolute inset-0" />
              )}
              {preview && !cameraActive && (
                <img src={preview} alt="Etiqueta" className="w-full h-full object-cover" />
              )}
              {!preview && !cameraActive && (
                <div className="text-center p-4 flex flex-col items-center justify-center h-full gap-2">
                  <Camera className="w-8 h-8 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">Arraste uma foto ou use a câmera</p>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); openNativeCamera(); }} className="rounded-lg h-8 text-xs"><Camera className="w-3.5 h-3.5 mr-1" /> Câmera</Button>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="rounded-lg h-8 text-xs"><Image className="w-3.5 h-3.5 mr-1" /> Galeria</Button>
                  </div>
                </div>
              )}
            </div>

            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f, { autoSave: true }); e.target.value = ''; }} />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) loadFile(f); e.target.value = ''; }} />
            <canvas ref={canvasRef} className="hidden" />

            {(preview || cameraActive) && (
              <div className="flex gap-1.5">
                {cameraActive ? (
                  <>
                    <Button className="flex-1 rounded-lg h-10 font-semibold" onClick={snapPhoto}>
                      <Camera className="w-4 h-4 mr-1.5" /> Capturar
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg" onClick={stopCamera}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={openNativeCamera}><Camera className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={() => fileInputRef.current?.click()}><Image className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={openLiveCamera}><Video className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" className="h-9 w-9 rounded-lg" onClick={() => { if (preview) { downloadDataUrl(preview, getPhotoFileName()); toast.success('Foto salva'); } }}><Download className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive" onClick={() => { setFotoB64(null); setPreview(null); setAiStatus(null); setProgress(0); }}><Trash2 className="w-4 h-4" /></Button>
                  </>
                )}
              </div>
            )}

            {progress > 0 && (
              <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                <div style={{ width: `${progress}%` }} className="h-full bg-primary transition-all" />
              </div>
            )}

            {preview && !cameraActive && (
              <Button onClick={processOpenRouter} disabled={aiLoading} className="w-full h-11 rounded-lg font-semibold">
                {aiLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2 text-yellow-300 fill-yellow-300" />}
                {aiLoading ? 'Processando...' : 'Analisar com IA'}
              </Button>
            )}

            {aiStatus && (
              <div className={`p-3 rounded-lg border text-xs font-medium ${aiStatus.type === 'ok' ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  {aiStatus.type === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  <span className="font-semibold text-[10px] uppercase">{aiStatus.type === 'ok' ? 'Concluído' : 'Erro'}</span>
                </div>
                {aiStatus.msg}
              </div>
            )}
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

            {/* PROCESSO */}
            {requiresProcesso && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 h-4">
                  <label htmlFor="proc-input" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Processo (PROC)</label>
                  <button onClick={toggleLockProcesso} className={`transition-colors ${lockProcesso ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground'}`} title={lockProcesso ? 'Campo travado' : 'Travar campo'}>
                    {lockProcesso ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
                <input
                  id="proc-input"
                  value={localProcesso}
                  onChange={e => handleProcessoChange(e.target.value)}
                  onBlur={handleProcessoBlur}
                  onKeyDown={e => handleFieldKeyDown(e, itemRef)}
                  className={`w-full h-11 rounded-lg border px-3 text-sm font-mono transition-colors ${
                    lockProcesso ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-muted/20 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10'
                  }`}
                  placeholder="Ex: 123456..."
                  autoComplete="off"
                  readOnly={lockProcesso && !!lockedProcesso}
                />
              </div>
            )}

            {/* Item */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 h-4">
                <label htmlFor="item-input" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Item / Referência</label>
                {isPVT && (
                  <button onClick={toggleLockItem} className={`transition-colors ${lockItem ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground'}`} title={lockItem ? 'Campo travado' : 'Travar campo'}>
                    {lockItem ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  id="item-input"
                  ref={itemRef}
                  value={localItem}
                  onChange={e => handleItemChange(e.target.value)}
                  onBlur={handleItemBlur}
                  onKeyDown={e => handleFieldKeyDown(e, getNextRefAfterItem())}
                  className={`w-full h-11 rounded-lg border px-3 text-sm font-mono transition-colors ${
                    (isPVT && lockItem) ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-muted/20 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10'
                  }`}
                  placeholder="Ex: SRC-3003-05-3"
                  autoComplete="off"
                  readOnly={isPVT && lockItem && !!lockedItem}
                />
                {usesLarguraFromItem && largura > 0 && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {largura.toFixed(2)}m
                  </span>
                )}
              </div>
            </div>

            {/* Coulisse largura */}
            {isCoulisse && (
              <div className="space-y-1.5">
                <label htmlFor="largura-manual" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Largura do Tecido (m)</label>
                <input
                  id="largura-manual"
                  ref={manualLarguraRef}
                  type="number" step="0.01" value={manualLargura}
                  onChange={e => setManualLargura(e.target.value)}
                  onKeyDown={e => handleFieldKeyDown(e, m2Ref)}
                  className="w-full h-11 rounded-lg border border-border/50 bg-muted/20 px-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors placeholder:text-muted-foreground/30"
                  placeholder="Ex: 2.80" autoComplete="off" inputMode="decimal"
                />
              </div>
            )}

            {/* Cortina largura (manual com lock) */}
            {isCortina && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 h-4">
                  <label htmlFor="largura-cortina" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Largura do Tecido (m)</label>
                  <button
                    onClick={toggleLockCortinaLargura}
                    className={`transition-colors ${lockCortinaLargura ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
                    title={lockCortinaLargura ? 'Largura travada' : 'Travar largura'}
                  >
                    {lockCortinaLargura ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
                <input
                  id="largura-cortina"
                  type="number" step="0.01" value={cortinaLargura}
                  onChange={e => setCortinaLargura(e.target.value)}
                  onBlur={() => { if (lockCortinaLargura) setLockedCortinaLargura(cortinaLargura); }}
                  onKeyDown={e => handleFieldKeyDown(e, m2Ref)}
                  className={`w-full h-11 rounded-lg border px-3 text-sm transition-colors ${
                    lockCortinaLargura ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-muted/20 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10'
                  }`}
                  placeholder="Ex: 2.80" autoComplete="off" inputMode="decimal"
                  readOnly={lockCortinaLargura && !!lockedCortinaLargura}
                />
              </div>
            )}

            {/* Cortina: chave seletora M² / M Linear */}
            {isCortina && (
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tipo de Metragem</label>
                <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
                  <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${cortinaMetragem === 'm2' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    M²
                  </span>
                  <Switch
                    checked={cortinaMetragem === 'mlinear'}
                    onCheckedChange={(checked) => setCortinaMetragem(checked ? 'mlinear' : 'm2')}
                    aria-label="Alternar tipo de metragem"
                  />
                  <span className={`text-[11px] font-bold uppercase tracking-wider transition-colors ${cortinaMetragem === 'mlinear' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    M Linear
                  </span>
                </div>
              </div>
            )}


            {/* NF */}
            {requiresNF && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="nf-input" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Nota Fiscal (NF)</label>
                  <button onClick={toggleLockNf} className={`transition-colors ${lockNf ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground'}`} title={lockNf ? 'Campo travado' : 'Travar campo'}>
                    {lockNf ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
                <input
                  id="nf-input"
                  ref={nfRef}
                  value={localNf}
                  onChange={e => handleNfChange(e.target.value)}
                  onBlur={handleNfBlur}
                  onKeyDown={e => handleFieldKeyDown(e, getNextRefAfterNf())}
                  className={`w-full h-11 rounded-lg border px-3 text-sm font-mono transition-colors ${
                    lockNf ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-muted/20 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10'
                  }`}
                  placeholder="NF..."
                  autoComplete="off"
                  readOnly={lockNf && !!lockedNf}
                />
              </div>
            )}

            {/* Madeira: Lote + Qtd */}
            {isMadeira && (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="lote-input" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Lote / Batch</label>
                  <input
                    id="lote-input"
                    ref={loteRef}
                    value={lote}
                    onChange={e => setLote(e.target.value.replace(/[''`]/g, '-'))}
                    onKeyDown={e => handleFieldKeyDown(e, quantidadeRef)}
                    className="w-full h-11 rounded-lg border border-border/50 bg-muted/20 px-3 text-sm font-mono focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
                    placeholder="Lote..." autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="qtd-input" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Quantidade</label>
                  <input
                    id="qtd-input"
                    ref={quantidadeRef}
                    type="number" step="1" value={quantidade}
                    onChange={e => setQuantidade(e.target.value)}
                    onKeyDown={e => handleFieldKeyDown(e, null)}
                    className="w-full h-11 rounded-lg border border-border/50 bg-muted/20 px-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
                    placeholder={madeiraDefaults[madeiraTipo].toString()} autoComplete="off" inputMode="numeric"
                  />
                </div>
                <div className="sm:col-span-2">
                  <LoteMestreSelector
                    value={loteMestreId}
                    onChange={(id) => setLoteMestreId(id)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <AvariaForm
                    enabled={avariaEnabled}
                    onEnabledChange={setAvariaEnabled}
                    tipo={avariaTipo}
                    onTipoChange={setAvariaTipo}
                    descricao={avariaDescricao}
                    onDescricaoChange={setAvariaDescricao}
                    fotoUrl={avariaFotoUrl}
                    onFotoUrlChange={setAvariaFotoUrl}
                  />
                </div>
              </>
            )}

            {/* Metragem */}
            {!isMadeira && (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 h-4">
                    <label htmlFor="metragem-input" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {isAI || isPVT || coulisseUsesMLinear || cortinaUsesMLinear ? 'Metragem Linear' : 'Metragem Total (M²)'}
                    </label>
                    {isPVT && (
                      <button onClick={toggleLockMetragem} className={`transition-colors ${lockMetragemGlobal ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground'}`} title={lockMetragemGlobal ? 'Campo travado' : 'Travar campo'}>
                        {lockMetragemGlobal ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      id="metragem-input"
                      ref={m2Ref}
                      type="number" step="0.1"
                      value={isAI ? aiMLinear : (isPVT || coulisseUsesMLinear || cortinaUsesMLinear) ? diversosMLinear : m2}
                      onChange={e => isAI ? setAiMLinear(e.target.value) : (isPVT || coulisseUsesMLinear || cortinaUsesMLinear) ? setDiversosMLinear(e.target.value) : setM2(e.target.value)}
                      onKeyDown={e => handleFieldKeyDown(e, isAI ? larguraRef : loteRef)}
                      className={`w-full h-11 rounded-lg border px-3 text-sm transition-colors ${
                        (isPVT && lockMetragemGlobal) ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-muted/20 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10'
                      }`}
                      placeholder="0.0" autoComplete="off" inputMode="decimal"
                      readOnly={isPVT && lockMetragemGlobal && !!lockedMetragem}
                    />
                    {mLinear > 0 && !isAI && !isPVT && !coulisseUsesMLinear && !cortinaUsesMLinear && (
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-primary">
                        Linear: {formatML(mLinear)}
                      </span>
                    )}
                  </div>
                </div>

                {isAI ? (
                  <div className="space-y-1.5">
                    <label htmlFor="largura-ai" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Largura (m)</label>
                    <input
                      id="largura-ai"
                      ref={larguraRef}
                      type="number" step="0.01" value={aiLargura}
                      onChange={e => setAiLargura(e.target.value)}
                      onKeyDown={e => handleFieldKeyDown(e, lockEndereco ? null : enderecoRef)}
                      className="w-full h-11 rounded-lg border border-border/50 bg-muted/20 px-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors"
                      placeholder="Ex: 2.80" autoComplete="off" inputMode="decimal"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 h-4">
                      <label htmlFor="lote-material" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Lote / Batch</label>
                      {isPVT && (
                        <button onClick={toggleLockLote} className={`transition-colors ${lockLote ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground'}`} title={lockLote ? 'Campo travado' : 'Travar campo'}>
                          {lockLote ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        </button>
                      )}
                    </div>
                    <input
                      id="lote-material"
                      ref={loteRef}
                      value={lote}
                      onChange={e => setLote(e.target.value.replace(/[''`]/g, '-'))}
                      onKeyDown={e => handleFieldKeyDown(e, requiresEndereco && !lockEndereco ? enderecoRef : null)}
                      className={`w-full h-11 rounded-lg border px-3 text-sm font-mono transition-colors ${
                        (isPVT && lockLote) ? 'bg-primary/5 border-primary/30 text-primary' : 'bg-muted/20 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10'
                      }`}
                      placeholder="Lote..." autoComplete="off"
                      readOnly={isPVT && lockLote && !!lockedLote}
                    />
                  </div>
                )}
              </>
            )}

            {/* Endereço */}
            {requiresEndereco && (
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="endereco-input" className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Endereço de Armazenagem</label>
                  <button onClick={toggleLockEndereco} className={`transition-colors ${lockEndereco ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground'}`} title={lockEndereco ? 'Campo travado' : 'Travar campo'}>
                    {lockEndereco ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
                <input
                  id="endereco-input"
                  ref={enderecoRef}
                  value={localEndereco}
                  onChange={e => handleEnderecoChange(e.target.value)}
                  onBlur={handleEnderecoBlur}
                  onKeyDown={e => handleFieldKeyDown(e, null)}
                  className={`w-full h-11 rounded-lg border px-3 text-sm font-mono uppercase transition-colors ${
                    lockEndereco ? 'bg-primary/5 border-primary/30 text-primary' : (enderecoError ? 'border-destructive bg-destructive/5' : 'bg-muted/20 border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/10')
                  }`}
                  placeholder={isMadeira ? "MAD01.A.N01" : "TEC01.A.N03"} autoComplete="off"
                  readOnly={lockEndereco && !!lockedEndereco}
                />
                {enderecoError && <p className="text-[10px] text-destructive font-medium ml-1">{enderecoError}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Preview Card */}
        <div className="p-4 rounded-xl bg-card border border-border/50">
          <div className="grid grid-cols-2 gap-3">
            {isMadeira ? (
              <>
                <div>
                  <p className="text-[10px] font-medium uppercase text-muted-foreground mb-0.5">Subtipo</p>
                  <p className="text-lg font-bold">{madeiraTipo}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase text-muted-foreground mb-0.5">Quantidade</p>
                  <p className="text-lg font-bold">{quantidade || madeiraDefaults[madeiraTipo]} <span className="text-xs text-muted-foreground">und</span></p>
                </div>
              </>
            ) : (
              <>
                <div>
                  <p className="text-[10px] font-medium uppercase text-muted-foreground mb-0.5">Largura</p>
                  <p className="text-lg font-bold">{largura > 0 ? largura.toFixed(2) + 'm' : '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase text-muted-foreground mb-0.5">M. Linear</p>
                  <p className="text-lg font-bold">{mLinear > 0 ? formatML(mLinear) : '—'}</p>
                </div>
              </>
            )}
            <div className="col-span-2 pt-2 border-t border-border/30">
              <p className="text-[10px] font-medium uppercase text-muted-foreground mb-1">Lote Sistema</p>
              <div className="p-2.5 rounded-lg bg-muted/30 font-mono text-xs font-medium text-foreground/80 truncate border border-border/30">
                {previewLoteSistema}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pb-6 pt-2 sticky bottom-0 bg-gradient-to-t from-background via-background to-transparent px-1 -mx-1 z-30">
          <Button
            onClick={handleAdd}
            className="w-full h-12 sm:h-14 rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
          >
            <Plus className="w-5 h-5 mr-2" />
            Adicionar Registro
          </Button>

          {registros.length > 0 && (
            <Button
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="w-full h-10 rounded-xl text-[11px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all border-border/40"
            >
              {showPreview ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showPreview ? 'Ocultar' : `Ver Tabela (${registros.length})`}
            </Button>
          )}

          {showPreview && registros.length > 0 && (
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                <table className="w-full text-[11px]">
                  <thead className="sticky top-0 bg-muted/90 z-10">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Referência</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Lote Sistema</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20">
                    {registros.slice(-10).reverse().map((r, i) => (
                      <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-2 font-mono text-muted-foreground">{registros.length - i}</td>
                        <td className="px-3 py-2 font-medium">{r.item}</td>
                        <td className="px-3 py-2 font-mono text-primary/80">{r.loteSistema}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {isDuplicate && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              Item "{item}" já consta nesta conferência.
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default LeftPanel;
