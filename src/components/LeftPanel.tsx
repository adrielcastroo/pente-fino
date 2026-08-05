import { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import * as etiqProntaUtils from '@/lib/etiq-pronta-utils';
import { estoqueService } from '@/services/estoqueService';
import { itensCadastroService } from '@/services/itensCadastroService';
import { useAppStore, LabelSettings } from '@/store/useAppStore';
import { printTecidoLabel } from '@/services/printService';
import { extractLarguraFromItem, formatML, generateLoteSistema, generateLoteSistemaCaixa, ENDERECO_REGEX } from '@/lib/app-utils';
import { Registro, FormData } from '@/types';
import { toast } from 'sonner';
import { bipSuccess, bipError } from '@/lib/bip-feedback';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformance } from '@/hooks/use-performance';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { useAutoRefocus } from '@/hooks/useAutoRefocus';
import { useShallow } from 'zustand/react/shallow';
import { useAuth } from '@/hooks/use-auth';
import {
  Camera, Image, Video, Download, X, Undo2, ScanBarcode,
  Plus, Zap, SquarePen, Layers3, Lock, Unlock, Package, Eye, EyeOff,
  Trash2, CheckCircle2, AlertTriangle, LayoutGrid, Sparkles
} from 'lucide-react';
import LoteMestreSelector from '@/components/madeira/LoteMestreSelector';
import AvariaForm, { AvariaTipo } from '@/components/madeira/AvariaForm';
import ItemVinculoBadge from '@/components/ItemVinculoBadge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';


const VISION_PROMPT = `Você é um especialista em leitura de etiquetas de rolos de tecido. Analise a imagem e extraia:

ITEM (código do tecido): Item, Ref, Item No, Description, Artigo, Part No
M² (metragem quadrada): QUANTITY, Q'TY, Quantity, Qty
LARGURA (largura do tecido): WIDTH, Width, Largura

Retorne SOMENTE JSON: {"item":"<código>","m2":<número float ou null>,"width":<número inteiro ou null>}`;

export const LeftPanel = memo(function LeftPanel() {
  const {
    currentMode, setMode, processo, setProcesso, conferente, registros,
    addRegistro, deleteRegistro, undoStack, undo: undoAction,
    lockProcesso, setLockProcesso, lockedProcesso, setLockedProcesso,
    lockNf, setLockNf, lockedNf, setLockedNf,
    lockEndereco, setLockEndereco, lockedEndereco, setLockedEndereco,
    lockItem, setLockItem, lockedItem, setLockedItem,
    lockLote, setLockLote, lockedLote, setLockedLote,
    lockMadeiraProcesso, setLockMadeiraProcesso,
    lockMadeiraItem, setLockMadeiraItem,
    lockMadeiraLote, setLockMadeiraLote,
    lockMadeiraEndereco, setLockMadeiraEndereco,
    lockMetragem: lockMetragemGlobal, setLockMetragem: setLockMetragemGlobal,
    lockedMetragem, setLockedMetragem,
    lockCoulisseMetragem, setLockCoulisseMetragem,
    lockCortinaLargura, setLockCortinaLargura, lockedCortinaLargura, setLockedCortinaLargura,
    lockCortinaMetragem, setLockCortinaMetragem,
    formData, setFormData, resetFormData, labelSettings
  } = useAppStore(useShallow(s => ({
    currentMode: s.currentMode,
    setMode: s.setMode,
    processo: s.processo,
    setProcesso: s.setProcesso,
    conferente: s.conferente,
    registros: s.registros,
    addRegistro: s.addRegistro,
    deleteRegistro: s.deleteRegistro,
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
    lockMadeiraProcesso: s.lockMadeiraProcesso,
    setLockMadeiraProcesso: s.setLockMadeiraProcesso,
    lockMadeiraItem: s.lockMadeiraItem,
    setLockMadeiraItem: s.setLockMadeiraItem,
    lockMadeiraLote: s.lockMadeiraLote,
    setLockMadeiraLote: s.setLockMadeiraLote,
    lockMadeiraEndereco: s.lockMadeiraEndereco,
    setLockMadeiraEndereco: s.setLockMadeiraEndereco,
    lockMetragem: s.lockMetragem,
    setLockMetragem: s.setLockMetragem,
    lockedMetragem: s.lockedMetragem,
    setLockedMetragem: s.setLockedMetragem,
    lockCoulisseMetragem: s.lockCoulisseMetragem,
    setLockCoulisseMetragem: s.setLockCoulisseMetragem,
    lockCortinaLargura: s.lockCortinaLargura,
    setLockCortinaLargura: s.setLockCortinaLargura,
    lockedCortinaLargura: s.lockedCortinaLargura,
    setLockedCortinaLargura: s.setLockedCortinaLargura,
    lockCortinaMetragem: s.lockCortinaMetragem,
    setLockCortinaMetragem: s.setLockCortinaMetragem,
    formData: s.formData,
    setFormData: s.setFormData,
    resetFormData: s.resetFormData,
    labelSettings: s.labelSettings
  })));

  const { user, profile, isGuest, guestName } = useAuth();
  
  // Use store conferente but fallback to auth profile name if store is empty
  const effectiveConferente = useMemo(() => {
    if (conferente && conferente.trim()) return conferente;
    if (!isGuest && user) return profile?.display_name || user.email?.split('@')[0] || 'Usuário';
    if (isGuest && guestName) return guestName;
    return '';
  }, [conferente, user, profile, isGuest, guestName]);


  const { isLow } = usePerformance();
  const setStoreConferente = useAppStore(s => s.setConferente);
  const etiqProntaLoteFinalRef = useRef<HTMLInputElement>(null);

  // Sync effective conferente back to store if it's missing
  useEffect(() => {
    if (!conferente && effectiveConferente) {
      setStoreConferente(effectiveConferente);
    }
  }, [conferente, effectiveConferente, setStoreConferente]);
  const {
    item, nf, m2, lote, endereco, aiLargura, aiMLinear, diversosTipo, diversosMLinear,
    manualLargura, coulisseMetragem, lockMetragem, madeiraTipo, quantidade,
    cortinaLargura, cortinaMetragem, etiqProntaLoteFinal, posicao
  } = formData;

  // Local state for non-store controlled values (if any)
  // Removed localItem, localNf, localProcesso, localEndereco to avoid sync issues.

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
  const _isMobileForRefocus = useIsMobile();
  const _isTabletForRefocus = useIsTablet();
  useAutoRefocus(itemRef, _isMobileForRefocus || _isTabletForRefocus);
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
  const setEtiqProntaLoteFinal = useCallback((val: string) => setFormData({ etiqProntaLoteFinal: val }), [setFormData]);

  const m2Num = useMemo(() => parseFloat(m2) || 0, [m2]);
  const aiLarguraNum = useMemo(() => parseFloat(aiLargura) || 0, [aiLargura]);
  const aiMLinearNum = useMemo(() => parseFloat(aiMLinear) || 0, [aiMLinear]);
  const diversosMLinearNum = useMemo(() => parseFloat(diversosMLinear) || 0, [diversosMLinear]);
  const manualLarguraNum = useMemo(() => parseFloat(manualLargura) || 0, [manualLargura]);
  const isAI = currentMode === 'openrouter';
  const isDiversos = currentMode === 'diversos';
  const isMadeira = currentMode === 'madeira';
  const isEtiqPronta = currentMode === 'etiq_pronta';
  const isPVT = isDiversos && diversosTipo === 'PVT';
  const isCelular = isDiversos && diversosTipo === 'Celular';
  const isRolo = isDiversos && diversosTipo === 'Rolo';
  const isCortina = isDiversos && diversosTipo === 'Cortina';
  const isHC45 = isCelular && /HC-?45/i.test(item);
  const celularDivisor = isHC45 ? 3.66 : 3.05;

  // Celular uses PROC instead of NF
  const isCoulisse = currentMode === 'manual';
  const requiresProcesso = isMadeira || isCelular || isAI || isCoulisse;
  const requiresNF = isDiversos && !isCelular;
  const coulisseUsesM2 = (isCoulisse || isRolo) && coulisseMetragem === 'm2';
  const coulisseUsesMLinear = (isCoulisse || isRolo) && coulisseMetragem === 'mlinear';
  const cortinaUsesM2 = isCortina && cortinaMetragem === 'm2';
  const cortinaUsesMLinear = isCortina && cortinaMetragem === 'mlinear';
  const usesM2Input = !isMadeira && !isAI && !isPVT && !coulisseUsesMLinear && !cortinaUsesMLinear && (isRolo || isCortina || isCoulisse || isCelular);
  // Cortina now uses manual largura (cortinaLargura), not extracted from item
  const usesLarguraFromItem = !isAI && isRolo;
  const requiresEndereco = !isPVT && !isCelular && currentMode !== 'etiq_pronta';

  const madeiraDefaults: Record<string, number> = { 'Lâmina': 100, 'Base': 24, 'Bandô': 24 };

  const cortinaLarguraNum = useMemo(() => parseFloat(cortinaLargura) || 0, [cortinaLargura]);

  const largura = useMemo(() => 
    isAI ? aiLarguraNum
    : isMadeira ? 0
    : (isCoulisse || isRolo) ? (manualLarguraNum || extractLarguraFromItem(item))
    : isCortina ? cortinaLarguraNum
    : isCelular ? celularDivisor
    : 0,
    [isAI, aiLarguraNum, isMadeira, isCoulisse, isRolo, manualLarguraNum, item, isCortina, cortinaLarguraNum, isCelular, celularDivisor]
  );

  const mLinear = useMemo(() => 
    isAI ? aiMLinearNum
    : isMadeira ? 0
    : (isPVT || isEtiqPronta || coulisseUsesMLinear || cortinaUsesMLinear) ? diversosMLinearNum
    : isCelular ? (m2Num > 0 ? m2Num / celularDivisor : 0)
    : (largura > 0 ? m2Num / largura : 0),
    [isAI, aiMLinearNum, isMadeira, isPVT, isEtiqPronta, coulisseUsesMLinear, cortinaUsesMLinear, diversosMLinearNum, isCelular, m2Num, celularDivisor, largura]
  );
  
  const isDuplicate = useMemo(() => {
    if (isMadeira || !item || !lote) return false;
    const lowerItem = item.toLowerCase();
    const lowerLote = lote.toLowerCase();
    const lowerNf = nf.trim().toLowerCase();
    
    return registros.some(r => 
      (r.item || '').toLowerCase() === lowerItem && 
      (r.lote || '').toLowerCase() === lowerLote &&
      (r.nf || '').trim().toLowerCase() === lowerNf
    );
  }, [isMadeira, item, lote, registros, nf]);

  

  const formatEndereco = (val: string): string => {
    const upper = val.toUpperCase();
    if (upper === 'CHÃO' || upper === 'CHAO') return 'CHÃO';
    
    const clean = upper.replace(/\./g, '');
    if (clean.length <= 5) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 5)}.${clean.slice(5)}`;
    return `${clean.slice(0, 5)}.${clean.slice(5, 6)}.${clean.slice(6)}`;
  };

  const validateEndereco = (val: string) => {
    if (!val) { setEnderecoError(''); return; }
    setEnderecoError(ENDERECO_REGEX.test(val) ? '' : 'Padrão: TEC01.A.N03');
  };

  // Sync locked values directly from store logic
  useEffect(() => {
    if (lockEndereco && lockedEndereco && lockedEndereco !== endereco) {
      setEndereco(lockedEndereco);
    }
  }, [lockEndereco, lockedEndereco, endereco, setEndereco]);

  useEffect(() => {
    if (lockProcesso && lockedProcesso && processo !== lockedProcesso) {
      setProcesso(lockedProcesso);
    }
  }, [lockProcesso, lockedProcesso, processo, setProcesso]);

  useEffect(() => {
    if (lockNf && lockedNf && nf !== lockedNf) {
      setNf(lockedNf);
    }
  }, [lockNf, lockedNf, nf, setNf]);

  useEffect(() => {
    if (lockItem && lockedItem && item !== lockedItem) {
      setItem(lockedItem);
    }
  }, [lockItem, lockedItem, item, setItem]);

  useEffect(() => {
    if (lockLote && lockedLote && lote !== lockedLote) {
      setLote(lockedLote);
    }
  }, [lockLote, lockedLote, lote, setLote]);

  useEffect(() => {
    if (lockMetragemGlobal && lockedMetragem && diversosMLinear !== lockedMetragem) {
      setDiversosMLinear(lockedMetragem);
    }
  }, [lockMetragemGlobal, lockedMetragem, diversosMLinear, setDiversosMLinear]);

  useEffect(() => {
    if (lockCortinaLargura && lockedCortinaLargura && cortinaLargura !== lockedCortinaLargura) {
      setCortinaLargura(lockedCortinaLargura);
    }
  }, [lockCortinaLargura, lockedCortinaLargura, cortinaLargura, setCortinaLargura]);

  // Auto-lookup for Etiq Pronta: Extraction first for UX, DB lookup for source of truth
  useEffect(() => {
    const processEtiqPronta = async () => {
      if (!isEtiqPronta || !etiqProntaLoteFinal) return;

      const input = etiqProntaLoteFinal.toUpperCase().trim();
      if (input.length < 3) return;

      // 1) Instant Extraction: Pre-fill from string for immediate feedback
      // Optimized Regex for TECxx.A.Nxx format
      const addrMatch = input.match(/(TEC\d{2}\.[A-Z]\.N\d{2})/);
      const procMatch = input.match(/PROC\s*([0-9/A-Z-]+)/);
      const mlMatch = input.match(/(\d+(?:[.,]\d+)?)\s*M(?:LINEAR)?/);

      const instantUpdates: Partial<FormData> = {};
      let updatedSomethingInstant = false;

      if (addrMatch && addrMatch[1] !== endereco && !lockEndereco) {
        instantUpdates.endereco = addrMatch[1];
        updatedSomethingInstant = true;
      }
      if (procMatch && procMatch[1] !== processo) {
        setProcesso(procMatch[1]);
        // no need to set updatedSomethingInstant for state setters outside formData
      }
      if (mlMatch) {
        const val = mlMatch[1].replace(',', '.');
        if (val !== diversosMLinear) {
          instantUpdates.diversosMLinear = val;
          updatedSomethingInstant = true;
        }
      }

      if (updatedSomethingInstant) {
        setFormData(instantUpdates);
        if (instantUpdates.endereco) validateEndereco(instantUpdates.endereco);
      }

      // 2) DB lookup: Verify if the lote exists in stock (source of truth)
      // This might override the extracted address if the item was moved
      try {
        let query = supabase
          .from('estoque_posicoes')
          .select('item, proc, endereco, m_linear, posicao, lote_sistema')
          .ilike('lote_sistema', input);
        
        // Removed strict item filter to allow lookup by Lote Final only
        const { data: rows, error } = await query.limit(1);
        if (error) throw error;

        let match: any = rows?.[0];

        // Fallback: try registros table (historical)
        if (!match) {
          let rq = supabase
            .from('registros')
            .select('item, endereco, m_linear, posicao, lote_sistema, conference_id')
            .ilike('lote_sistema', input)
            .order('created_at', { ascending: false });
          
          const { data: regRows } = await rq.limit(1);
          if (regRows?.[0]) {
            const r: any = regRows[0];
            let proc = '';
            if (r.conference_id) {
              const { data: conf } = await supabase
                .from('conferences')
                .select('processo')
                .eq('id', r.conference_id)
                .maybeSingle();
              proc = conf?.processo || '';
            }
            match = { ...r, proc };
          }
        }

        if (match) {
          const dbUpdates: Partial<FormData> = {};
          if (match.item && match.item !== item) dbUpdates.item = match.item;
          // DB address has priority over extracted address if they differ
          if (match.endereco && match.endereco !== (instantUpdates.endereco || endereco) && !lockEndereco) {
            dbUpdates.endereco = match.endereco;
          }
          if (match.m_linear != null && match.m_linear.toString() !== (instantUpdates.diversosMLinear || diversosMLinear)) {
            dbUpdates.diversosMLinear = match.m_linear.toString();
          }
          if (match.posicao != null && match.posicao.toString() !== formData.posicao) {
            dbUpdates.posicao = match.posicao.toString();
          }
          
          if (Object.keys(dbUpdates).length > 0) setFormData(dbUpdates);
          if (match.proc && match.proc !== processo) setProcesso(match.proc);
          if (dbUpdates.endereco) validateEndereco(dbUpdates.endereco);
          
          toast.info('Dados validados pelo estoque', { id: 'etiq-extraction', duration: 2000 });
        } else if (updatedSomethingInstant || procMatch) {
          toast.warning('Lote não encontrado no estoque — usando dados da etiqueta', { id: 'etiq-extraction', duration: 2500 });
        }
      } catch (e) {
        console.error('Erro ao buscar etiqueta pronta:', e);
      }
    };

    const timer = setTimeout(processEtiqPronta, 800);
    return () => clearTimeout(timer);
  }, [isEtiqPronta, item, etiqProntaLoteFinal, setFormData, setProcesso, endereco, diversosMLinear, processo, lockEndereco, formData.posicao]);


  // Global History Lookup for Item
  useEffect(() => {
    const lookupItemHistory = async () => {
      if (!item || item.length < 4 || isMadeira) return;

      try {
        // Query the last archived record with this item
        const { data, error } = await supabase
          .from('registros')
          .select('endereco, largura')
          .eq('item', item)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();


        if (error) throw error;

        if (data) {
          const updates: Partial<FormData> = {};
          let notified = false;

          const typedData = data as { endereco?: string; largura?: number };

          if (typedData.endereco && !endereco && !lockEndereco) {
            updates.endereco = typedData.endereco;
            validateEndereco(typedData.endereco);
            notified = true;
          }

          if (typedData.largura && !manualLargura && currentMode === 'manual') {
            updates.manualLargura = typedData.largura.toString();
            notified = true;
          }

          if (Object.keys(updates).length > 0) {
            setFormData(updates);
            if (notified) toast.info('Sugerindo dados do histórico', { id: 'item-lookup', duration: 2000 });
          }
        }

      } catch (e) {
        console.error('Erro ao buscar histórico do item:', e);
      }
    };

    const timer = setTimeout(lookupItemHistory, 800);
    return () => clearTimeout(timer);
  }, [item, isMadeira, setFormData, endereco, manualLargura, lockEndereco, currentMode]);

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
    // Return focus to appropriate field
    setTimeout(() => {
      if (isMadeira) {
        if (!lockMadeiraProcesso) itemRef.current?.focus();
        else if (!lockMadeiraItem) itemRef.current?.focus();
        else if (!lockMadeiraLote) loteRef.current?.focus();
        else if (requiresEndereco && !lockMadeiraEndereco) enderecoRef.current?.focus();
        else itemRef.current?.focus();
      } else if (isEtiqPronta) {
        itemRef.current?.focus();
      } else {
        itemRef.current?.focus();
      }
    }, 50);
  }, [resetFormData, isMadeira, isEtiqPronta, lockMadeiraProcesso, lockMadeiraItem, lockMadeiraLote, lockMadeiraEndereco, requiresEndereco]);

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
    const newVal = val.replace(/[''`]/g, '-');
    setProcesso(newVal);
    if (lockProcesso) setLockedProcesso(newVal);
  }, [lockProcesso, setProcesso, setLockedProcesso]);

  const handleNfChange = useCallback((val: string) => {
    const newVal = val.replace(/[''`]/g, '-');
    setNf(newVal);
    if (lockNf) setLockedNf(newVal);
  }, [lockNf, setNf, setLockedNf]);

  const handleItemChange = useCallback((val: string) => {
    const newVal = val.replace(/[''`]/g, '-');
    setItem(newVal);
  }, [setItem]);

  const handleItemBlur = useCallback(() => {
    // No-op now as we update on change
  }, []);

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
      setLockedItem(item);
      setLockItem(true);
      toast.success('Item travado');
    } else {
      setLockItem(false);
      toast.success('Item destravado');
    }
  }, [lockItem, item, setLockedItem, setLockItem]);

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
    if (!fotoB64) { bipError(); toast.warning('Adicione uma foto primeiro.'); return; }
    const key = localStorage.getItem('cft4_or_key') || '';
    if (!key) { bipError(); toast.warning('Configure a chave OpenRouter em ⚙️ API.'); return; }
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
      bipError();
      toast.error('Erro OpenRouter: ' + e.message);
    }
    setAiLoading(false);
  };

  const handleAdd = async () => {
    const warn = (msg: string) => { bipError(); toast.warning(msg); };
    console.log('[handleAdd] click', {
      currentMode, diversosTipo, isCortina, isDiversos,
      item, nf, processo, endereco, m2, cortinaLargura, diversosMLinear,
      largura, mLinear, m2Num,
      cortinaMetragem, cortinaUsesMLinear, cortinaUsesM2,
      requiresEndereco, requiresNF, requiresProcesso,
      effectiveConferente,
    });
    // Basic validations that apply to all modes
    if (!effectiveConferente.trim()) { warn('Preencha o campo CONFERENTE no topo.'); return; }
    if (!item) { warn('Preencha o campo Item.'); return; }
    
    // Processo is required for Madeira and some other modes
    if (requiresProcesso && !processo.trim()) { warn('Preencha o campo PROCESSO.'); return; }
    if (requiresNF && !nf.trim()) { warn('Preencha o campo NF.'); return; }

    const proc = processo.trim();

    if (isMadeira) {
      const qtd = parseInt(quantidade) || madeiraDefaults[madeiraTipo];
      const loteSistema = generateLoteSistemaCaixa(proc, item, 0, registros);
      // Converte código fornecedor → código interno (todos os modos)
      const resolvedCad = await itensCadastroService.resolveItemFromScan(item, madeiraTipo);
      if (resolvedCad.source === 'fornecedor') {
        toast.success(`Fornecedor "${item}" → ${resolvedCad.codigoInterno}`);
      }
      const reg: Registro = {
        id: crypto.randomUUID(),
        item: resolvedCad.codigoInterno,
        processo: proc,
        nf: '',
        endereco: endereco || '',
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
      bipSuccess();
      toast.success(`✓ ${item} adicionado (${registros.length + 1} itens)`);

      // Impressão Automática (PNG → n8n)
      if (labelSettings.autoPrint) {
        printTecidoLabel({
          item: reg.item,
          descricao: '',
          lote: reg.lote,
          loteSistema: reg.loteSistema,
          processo: reg.processo,
          endereco: reg.endereco,
          mLinear: reg.mLinear,
        }, labelSettings);
      }

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

    if (isAI && aiLarguraNum <= 0) { warn('Preencha a Largura.'); return; }
    if (usesM2Input && m2Num > 0 && largura <= 0) { warn('Largura não detectada no item. Verifique o código ou preencha manualmente.'); return; }
    if (isCortina && largura <= 0) { warn('Preencha a Largura do tecido.'); return; }
    if (isEtiqPronta && !etiqProntaLoteFinal.trim()) { warn('Preencha o campo Lote Final.'); return; }
    
    if (mLinear <= 0 && !isEtiqPronta) { warn(`Preencha o campo ${(isPVT || isAI || coulisseUsesMLinear || cortinaUsesMLinear) ? 'M Linear' : 'M²'}.`); return; }
    if (requiresEndereco && !endereco) { warn('Preencha o Endereço.'); return; }
    if (requiresEndereco && !ENDERECO_REGEX.test(endereco)) { warn('Endereço inválido. Use: TEC01.A.N03'); return; }

    const resolvedEndereco = isEtiqPronta ? endereco : requiresEndereco ? endereco : '';
    const resolvedLargura = isAI ? aiLarguraNum : isPVT ? 0 : isCelular ? celularDivisor : largura;
    const resolvedMLinear = isEtiqPronta ? mLinear : mLinear;
    // M² = Largura × Metragem Linear. When the user typed M Linear directly (coulisse/cortina M Linear modes),
    // derive M² from largura × mLinear instead of storing 0. PVT/etiq_pronta don't track m² conceptually.
    const computedM2FromLinear = resolvedLargura > 0 && resolvedMLinear > 0 ? resolvedLargura * resolvedMLinear : 0;
    const resolvedM2 = isAI
      ? (aiMLinearNum * aiLarguraNum)
      : (isPVT || isEtiqPronta)
        ? 0
        : (coulisseUsesMLinear || cortinaUsesMLinear)
          ? computedM2FromLinear
          : (m2Num > 0 ? m2Num : computedM2FromLinear);

    // Celular and Etiq Pronta use processo, other Diversos use NF
    const resolvedProcesso = (isDiversos && !isCelular) ? '' : proc;
    const resolvedNf = (isDiversos && !isCelular) ? nf.trim() : '';

    // Celular and Etiq Pronta uses box numbering or custom logic
    const loteSistema = isCelular
      ? generateLoteSistemaCaixa(resolvedProcesso, item, mLinear, registros)
      : isEtiqPronta
      ? etiqProntaUtils.generateLoteEtiqPronta(item, etiqProntaLoteFinal, registros)
      : generateLoteSistema(resolvedProcesso, resolvedEndereco, mLinear, registros, resolvedNf, item);

    // Live Allocation: assign position before adding to the list
    let resolvedPosicao = (isEtiqPronta && posicao) ? parseInt(posicao) : undefined;
    
    if (!resolvedPosicao && (requiresEndereco || isEtiqPronta) && resolvedEndereco) {
      try {
        const nextPos = await estoqueService.getNextAvailablePosition(resolvedEndereco, item, registros);
        if (nextPos) {
          resolvedPosicao = nextPos;
        }
      } catch (e) {
        console.error('Erro na alocação automática:', e);
      }
    }

    // Converte código fornecedor → código interno (manual/coulisse, IA, diversos, etiq. pronta)
    const fallbackDesc = isDiversos ? diversosTipo : isEtiqPronta ? 'Etiq. Pronta' : '';
    const resolvedCad = await itensCadastroService.resolveItemFromScan(item, fallbackDesc);
    if (resolvedCad.source === 'fornecedor') {
      toast.success(`Fornecedor "${item}" → ${resolvedCad.codigoInterno}`);
    }

    const reg = {
      id: crypto.randomUUID(),
      item: resolvedCad.codigoInterno,
      processo: resolvedProcesso,
      nf: resolvedNf,
      endereco: resolvedEndereco,
      m2: resolvedM2,
      mLinear: resolvedMLinear,
      largura: resolvedLargura,
      lote: isEtiqPronta ? etiqProntaLoteFinal : (lote || ''),
      loteSistema,
      tipoTecido: isDiversos ? diversosTipo : isEtiqPronta ? 'Etiq. Pronta' : '',
      modoOrigem: isAI ? 'openrouter' : isDiversos ? 'diversos' : isEtiqPronta ? 'etiq_pronta' : 'manual',
      posicao: resolvedPosicao,
      isNew: true,
    };
    addRegistro(reg);
    bipSuccess();
    toast.success(`✓ ${reg.item} adicionado (${registros.length + 1} rolos)`);

    // Impressão Automática (PNG → n8n)
    if (labelSettings.autoPrint) {
      printTecidoLabel({
        item: reg.item,
        descricao: '',
        lote: reg.lote,
        loteSistema: reg.loteSistema,
        processo: reg.processo,
        nf: reg.nf,
        m2: reg.m2,
        mLinear: reg.mLinear,
        largura: reg.largura,
        endereco: reg.endereco,
      }, labelSettings);
    }

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
    { key: 'etiq_pronta' as const, label: 'Etiq. pronta', icon: ScanBarcode },
    { key: 'openrouter' as const, label: 'IA', icon: Sparkles },
  ];

  const showDropzone = currentMode === 'openrouter';
  const isTecidoTab = formData.activeTab === 'tecido';
  const hasTopUtilityActions = !isAI && !!(item || nf || m2 || lote || endereco || processo);

  // Determine next ref after item based on mode
  const getNextRefAfterItem = () => {
    if (isMadeira) return loteRef;
    if (isEtiqPronta) return etiqProntaLoteFinalRef;
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
    if (isEtiqPronta) {
      if (item && etiqProntaLoteFinal) return etiqProntaUtils.generateLoteEtiqPronta(item, etiqProntaLoteFinal, registros);
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
  }, [processo, item, nf, endereco, mLinear, isMadeira, isEtiqPronta, isDiversos, isCelular, requiresEndereco, registros, etiqProntaLoteFinal]);

  // Set default quantidade when madeiraTipo changes
  useEffect(() => {
    if (isMadeira) {
      setQuantidade(madeiraDefaults[madeiraTipo].toString());
    }
  }, [madeiraTipo, isMadeira]);

  return (
    /*
     * Hierarquia visual mobile-first:
     * - Container raiz: largura fluida (w-full + min-w-0), overflow-x-hidden
     *   para garantir que nenhum filho cause scroll horizontal indesejado.
     * - Padding fluido via clamp() (12px → 20px) escala suavemente em vez de
     *   pular no breakpoint sm.
     * - Espaçamento interno também via clamp() para preservar densidade
     *   em telas pequenas e respiro em telas grandes.
     */
    <div className="bg-background xl:border-r border-border/40 overflow-hidden flex flex-col h-full w-full min-w-0 max-w-full rounded-md border border-border/50 lg:border-none lg:rounded-none">
      <header className="px-3 sm:px-6 py-3 bg-card border-b border-border/40 flex items-center gap-2 flex-shrink-0">
        <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center">
          <ScanBarcode className="w-4 h-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-bold text-foreground font-display">Conferência de Tecido</span>
          <span className="text-[10px] text-muted-foreground/70 font-bold uppercase tracking-wider">Entrada & Bipagem</span>
        </div>
      </header>

      <div
        className={`flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-28 lg:pb-16 ${isTecidoTab ? 'pt-2 gap-3 xl:gap-2' : 'pt-4 gap-[clamp(0.75rem,2.5vw,1.25rem)]'}`}

        style={{
          paddingLeft: 'clamp(0.75rem, 3vw, 1.5rem)',
          paddingRight: 'clamp(0.75rem, 3vw, 1.5rem)',
          paddingBottom: 'clamp(6rem, 12vw, 8rem)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >


        {/* Mode Toggle */}
        {!isMadeira && (
          <div className={`grid grid-cols-2 gap-2 p-1 bg-muted/20 rounded-md border border-border/40 ${isTecidoTab ? 'xl:grid-cols-4 xl:gap-1' : ''}`}>
            {tecidoModes.map(m => {
              const Icon = m.icon;
              const isActive = currentMode === m.key;
              return (
                <button
                  key={m.key}
                  onClick={() => setMode(m.key)}
                  className={`relative min-w-0 min-h-[44px] py-3 px-3 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 uppercase tracking-wider ${isTecidoTab ? 'xl:min-h-[38px] xl:py-2 xl:px-1.5 xl:text-[9px] xl:gap-1.5' : ''} ${
                    isActive
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-pressed={isActive}
                >
                  {isActive && (
                    <motion.div
                      layoutId="mode-bg"
                      className="absolute inset-0 bg-primary rounded-md shadow-md"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <Icon className={`relative z-10 w-3.5 h-3.5 shrink-0 ${isTecidoTab ? 'xl:w-3 xl:h-3' : ''} ${isActive ? 'text-primary-foreground' : ''}`} />
                  <span className="relative z-10 truncate">{m.label}</span>
                </button>
              );
            })}
          </div>
        )}


        {/* Diversos categories — subordinate pills (touch-friendly, subtle) */}
        {isDiversos && (
          <div className="flex p-1 gap-1 rounded-md bg-muted/30 border border-border/30 overflow-x-auto no-scrollbar">
            {(['Rolo', 'PVT', 'Cortina', 'Celular'] as const).map(tipo => {
              const active = diversosTipo === tipo;
              return (
                <button
                  key={tipo}
                  onClick={() => setDiversosTipo(tipo)}
                  className={`relative flex-1 min-w-[72px] min-h-[40px] sm:min-h-[36px] rounded-[5px] px-3 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors ${
                    active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-pressed={active}
                >
                  {active && (
                    <motion.span
                      layoutId="tipo-bg"
                      className="absolute inset-0 rounded-[5px] bg-primary/10 border border-primary/25"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                    />
                  )}
                  <span className="relative z-10">{tipo}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Madeira subtypes — Modernized segments */}
        {isMadeira && (
          <>
            <div className="flex p-1 rounded-md bg-muted/20 border border-border/40 gap-1">
              {(['Lâmina', 'Base', 'Bandô'] as const).map(tipo => (
                <button
                  key={tipo}
                  onClick={() => setMadeiraTipo(tipo)}
                  className={`flex-1 min-h-[44px] rounded-md py-2.5 text-[10px] font-semibold uppercase tracking-widest transition-all duration-300 transform active:scale-95 ${
                    madeiraTipo === tipo
                      ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
            {/* Próximo CX preview — Modernized card */}
            <div className="flex items-center justify-between rounded-md border border-border/60 bg-muted/30 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 leading-none mb-1">Próxima Caixa</span>
                  <span className="block text-xs font-medium text-muted-foreground/80">Automático</span>
                </div>
              </div>
              <span className="font-mono text-lg font-semibold text-primary tracking-tighter">
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
              className={`border rounded-md transition-all overflow-hidden relative ${preview ? 'border-primary/40' : 'border-dashed border-border/60 hover:border-primary/30'}`}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-4 items-start">

            {/* PROCESSO */}
            {requiresProcesso && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 h-4">
                  <label htmlFor="proc-input" className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">Processo (PROC)</label>
                  <button 
                    onClick={() => isMadeira ? setLockMadeiraProcesso(!lockMadeiraProcesso) : toggleLockProcesso()} 
                    className={`transition-colors ${(isMadeira ? lockMadeiraProcesso : lockProcesso) ? 'text-lock' : 'text-muted-foreground/40 hover:text-muted-foreground'}`} 
                    title={(isMadeira ? lockMadeiraProcesso : lockProcesso) ? 'Campo travado' : 'Travar campo'}
                  >
                    {(isMadeira ? lockMadeiraProcesso : lockProcesso) ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
                <input
                  id="proc-input"
                  value={processo}
                  onChange={e => handleProcessoChange(e.target.value)}
                  onKeyDown={e => handleFieldKeyDown(e, itemRef)}
                  className={`w-full h-11 rounded-lg border px-3.5 text-sm font-mono transition-all duration-200 ${
                    (isMadeira ? lockMadeiraProcesso : lockProcesso) ? 'bg-lock/[0.08] border-lock/50 text-foreground shadow-[0_0_0_3px_hsl(var(--lock)/0.18),0_0_18px_hsl(var(--lock)/0.35)] focus:ring-2 focus:ring-lock/40 focus:outline-none' : 'border-border bg-card hover:border-primary/40 focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none'
                  }`}
                  placeholder="Ex: 123456..."
                  autoComplete="off"
                  inputMode="numeric"
                  readOnly={(isMadeira ? lockMadeiraProcesso : lockProcesso) && !!processo}
                />
              </div>
            )}

            {/* Item */}
            {!isEtiqPronta && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 h-4">
                  <label htmlFor="item-input" className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">Item / Referência</label>
                  <button
                    onClick={() => isMadeira ? setLockMadeiraItem(!lockMadeiraItem) : toggleLockItem()}
                    className={`transition-colors ${(isMadeira ? lockMadeiraItem : lockItem) ? 'text-lock' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
                    title={(isMadeira ? lockMadeiraItem : lockItem) ? 'Campo travado' : 'Travar campo'}
                  >
                    {(isMadeira ? lockMadeiraItem : lockItem) ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
              <div className="relative">
                <input
                  id="item-input"
                  ref={itemRef}
                  value={item}
                  onChange={e => handleItemChange(e.target.value)}
                  onBlur={handleItemBlur}
                  onKeyDown={e => handleFieldKeyDown(e, getNextRefAfterItem())}
                  className={`w-full h-11 rounded-lg border px-3.5 text-sm font-mono transition-all duration-200 ${
                    ((isMadeira ? lockMadeiraItem : lockItem)) ? 'bg-lock/[0.08] border-lock/50 text-foreground shadow-[0_0_0_3px_hsl(var(--lock)/0.18),0_0_18px_hsl(var(--lock)/0.35)] focus:ring-2 focus:ring-lock/40 focus:outline-none' : 'border-border bg-card hover:border-primary/40 focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none'
                  }`}
                  placeholder="Ex: SRC-3003-05-3"
                  autoComplete="off"
                  data-barcode="true"
                  readOnly={(isMadeira ? lockMadeiraItem : lockItem) && !!item}
                />
                {(usesLarguraFromItem || isEtiqPronta) && largura > 0 && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    {largura.toFixed(2)}m
                  </span>
                )}
              </div>
            </div>
          )}

            {/* Coulisse largura */}
            {isCoulisse && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 h-4"><label htmlFor="largura-manual" className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">Largura do Tecido (m)</label></div>
                <input
                  id="largura-manual"
                  ref={manualLarguraRef}
                  type="number" step="0.01" value={manualLargura}
                  onChange={e => setManualLargura(e.target.value)}
                  onKeyDown={e => handleFieldKeyDown(e, m2Ref)}
                  className="w-full h-11 rounded-lg border border-border bg-card px-3.5 text-sm shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-card focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none placeholder:text-muted-foreground/40"
                  placeholder="Ex: 2.80" autoComplete="off" inputMode="decimal"
                />
              </div>
            )}

            {/* Cortina largura (manual com lock) */}
            {isCortina && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 h-4">
                  <label htmlFor="largura-cortina" className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">Largura do Tecido (m)</label>
                  <button
                    onClick={toggleLockCortinaLargura}
                    className={`transition-colors ${lockCortinaLargura ? 'text-lock' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
                    title={lockCortinaLargura ? 'Campo travado' : 'Travar campo'}
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
                  className={`w-full h-11 rounded-lg border px-3.5 text-sm font-mono transition-all duration-200 ${
                    lockCortinaLargura ? 'bg-lock/[0.08] border-lock/50 text-foreground shadow-[0_0_0_3px_hsl(var(--lock)/0.18),0_0_18px_hsl(var(--lock)/0.35)] focus:ring-2 focus:ring-lock/40 focus:outline-none' : 'border-border bg-card hover:border-primary/40 focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none placeholder:text-muted-foreground/40'
                  }`}
                  placeholder="Ex: 2.80" autoComplete="off" inputMode="decimal"
                  readOnly={lockCortinaLargura && !!lockedCortinaLargura}
                />
              </div>
            )}

            {/* Cortina: chave seletora M² / M Linear — padrão idêntico ao Coulisse */}
            {isCortina && (
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center gap-1.5 h-4">
                  <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">Unidade de Metragem</label>
                  <button
                    type="button"
                    onClick={() => setLockCortinaMetragem(!lockCortinaMetragem)}
                    className={`transition-colors ${lockCortinaMetragem ? 'text-lock' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
                    title={lockCortinaMetragem ? 'Preferência travada — mantém a escolha entre registros' : 'Travar preferência'}
                  >
                    {lockCortinaMetragem ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCortinaMetragem('m2')}
                    className={`h-11 rounded-lg border px-3 text-sm font-bold transition-all active:scale-[0.98] ${
                      !cortinaUsesMLinear
                        ? lockCortinaMetragem
                          ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_0_3px_hsl(var(--lock)/0.18),0_0_18px_hsl(var(--lock)/0.35)]'
                          : 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    M²
                  </button>
                  <button
                    type="button"
                    onClick={() => setCortinaMetragem('mlinear')}
                    className={`h-11 rounded-lg border px-3 text-sm font-bold transition-all active:scale-[0.98] ${
                      cortinaUsesMLinear
                        ? lockCortinaMetragem
                          ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_0_3px_hsl(var(--lock)/0.18),0_0_18px_hsl(var(--lock)/0.35)]'
                          : 'border-primary bg-primary text-primary-foreground shadow-sm'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                    }`}
                  >
                    LINEAR
                  </button>
                </div>
              </div>
            )}


            {/* NF */}
            {requiresNF && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="nf-input" className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">Nota Fiscal (NF)</label>
                  {(lockNf || isRolo || isPVT || isCortina) && (
                    <button onClick={toggleLockNf} className={`transition-colors ${lockNf ? 'text-lock' : 'text-muted-foreground/40 hover:text-muted-foreground'}`} title={lockNf ? 'Campo travado' : 'Travar campo'}>
                      {lockNf ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                  )}
                </div>
                <input
                  id="nf-input"
                  ref={nfRef}
                  value={nf}
                  onChange={e => handleNfChange(e.target.value)}
                  onKeyDown={e => handleFieldKeyDown(e, getNextRefAfterNf())}
                  className={`w-full h-11 rounded-lg border px-3 text-sm font-mono transition-colors ${
                    lockNf ? 'bg-lock/[0.08] border-lock/50 text-foreground shadow-[0_0_0_3px_hsl(var(--lock)/0.18),0_0_18px_hsl(var(--lock)/0.35)] focus:ring-2 focus:ring-lock/40 focus:outline-none' : 'border-border bg-card hover:border-primary/40 focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none'
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
                  <div className="flex items-center gap-1.5 h-4">
                    <label htmlFor="lote-input" className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">Lote / Batch</label>
                    <button 
                      onClick={() => setLockMadeiraLote(!lockMadeiraLote)} 
                      className={`transition-colors ${lockMadeiraLote ? 'text-lock' : 'text-muted-foreground/40 hover:text-muted-foreground'}`} 
                      title={lockMadeiraLote ? 'Campo travado' : 'Travar campo'}
                    >
                      {lockMadeiraLote ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    </button>
                  </div>
                  <input
                    id="lote-input"
                    ref={loteRef}
                    value={lote}
                    onChange={e => setLote(e.target.value.replace(/[''`]/g, '-'))}
                    onKeyDown={e => handleFieldKeyDown(e, quantidadeRef)}
                    className={`w-full h-11 rounded-lg border px-3 text-sm font-mono focus:ring-2 focus:ring-primary/10 transition-colors ${
                      lockMadeiraLote ? 'bg-lock/[0.08] border-lock/50 text-foreground shadow-[0_0_0_3px_hsl(var(--lock)/0.18),0_0_18px_hsl(var(--lock)/0.35)] focus:ring-2 focus:ring-lock/40 focus:outline-none' : 'border-border bg-card hover:border-primary/40 focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none'
                    }`}
                    readOnly={lockMadeiraLote && !!lote}
                    placeholder="Lote..." autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="qtd-input" className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">Quantidade</label>
                  <input
                    id="qtd-input"
                    ref={quantidadeRef}
                    type="number" step="1" value={quantidade}
                    onChange={e => setQuantidade(e.target.value)}
                    onKeyDown={e => handleFieldKeyDown(e, null)}
                    className="w-full h-11 rounded-lg border border-border bg-card px-3.5 text-sm shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-card focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none"
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

            {/* Etiq Pronta: Código item e Lote Final */}
            {isEtiqPronta && (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 h-4"><label htmlFor="etiq-codigo-item" className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">Código item</label></div>
                  <input
                    id="etiq-codigo-item"
                    ref={itemRef}
                    value={item}
                    onChange={e => setItem(e.target.value)}
                    onKeyDown={e => handleFieldKeyDown(e, etiqProntaLoteFinalRef)}
                    className="w-full h-11 rounded-lg border border-border bg-card px-3.5 text-sm font-mono shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-card focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none placeholder:text-muted-foreground/40"
                    placeholder="Ex: SRC-3003..." autoComplete="off"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 h-4"><label htmlFor="etiq-lote-final" className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">Lote Final</label></div>
                  <input
                    id="etiq-lote-final"
                    ref={etiqProntaLoteFinalRef}
                    value={etiqProntaLoteFinal}
                    onChange={e => setEtiqProntaLoteFinal(e.target.value.toUpperCase())}
                    onKeyDown={e => handleFieldKeyDown(e, null)}
                    className="w-full h-11 rounded-lg border border-border bg-card px-3.5 text-sm font-mono shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-card focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none placeholder:text-muted-foreground/40"
                    placeholder="Ex: 001234..." autoComplete="off"
                  />
                </div>
              </>
            )}

            {/* Metragem */}
            {!isMadeira && !isEtiqPronta && (
              <>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 h-4">
                    <label htmlFor="metragem-input" className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">
                      {isAI || isPVT || coulisseUsesMLinear || cortinaUsesMLinear ? 'Metragem Linear' : 'Metragem Total'}
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
                      onKeyDown={e => handleFieldKeyDown(e, isAI ? larguraRef : (isRolo ? manualLarguraRef : loteRef))}
                      className={`w-full h-11 rounded-lg border px-3 text-sm transition-colors ${
                        (isPVT && lockMetragemGlobal) ? 'bg-primary/10 border-primary/40 text-primary shadow-sm focus:ring-2 focus:ring-primary/25 focus:outline-none' : 'border-border bg-card hover:border-primary/40 focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none'
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

                {isRolo && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 h-4"><label htmlFor="largura-rolo" className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">Largura (m)</label></div>
                    <input
                      id="largura-rolo"
                      ref={manualLarguraRef}
                      type="number" step="0.01" value={manualLargura}
                      onChange={e => setManualLargura(e.target.value)}
                      onKeyDown={e => handleFieldKeyDown(e, loteRef)}
                      className="w-full h-11 rounded-lg border border-border bg-card px-3.5 text-sm shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-card focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none"
                      placeholder="Ex: 2.80" autoComplete="off" inputMode="decimal"
                    />
                  </div>
                )}

                {/* Unidade de Metragem */}
                {(isRolo || isCoulisse) && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center gap-1.5 h-4">
                      <label className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">Unidade de Metragem</label>
                      <button
                        type="button"
                        onClick={() => setLockCoulisseMetragem(!lockCoulisseMetragem)}
                        className={`transition-colors ${lockCoulisseMetragem ? 'text-lock' : 'text-muted-foreground/40 hover:text-muted-foreground'}`}
                        title={lockCoulisseMetragem ? 'Preferência travada — mantém a escolha entre registros' : 'Travar preferência'}
                      >
                        {lockCoulisseMetragem ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCoulisseMetragem('m2')}
                        className={`h-11 rounded-lg border px-3 text-sm font-bold transition-all active:scale-[0.98] ${
                          !coulisseUsesMLinear
                            ? lockCoulisseMetragem
                              ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_0_3px_hsl(var(--lock)/0.18),0_0_18px_hsl(var(--lock)/0.35)]'
                              : 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        M²
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoulisseMetragem('mlinear')}
                        className={`h-11 rounded-lg border px-3 text-sm font-bold transition-all active:scale-[0.98] ${
                          coulisseUsesMLinear
                            ? lockCoulisseMetragem
                              ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_0_3px_hsl(var(--lock)/0.18),0_0_18px_hsl(var(--lock)/0.35)]'
                              : 'border-primary bg-primary text-primary-foreground shadow-sm'
                            : 'border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}
                      >
                        LINEAR
                      </button>
                    </div>
                  </div>
                )}


                {isAI ? (
                  <div className="space-y-1.5">
                    <label htmlFor="largura-ai" className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">Largura (m)</label>
                    <input
                      id="largura-ai"
                      ref={larguraRef}
                      type="number" step="0.01" value={aiLargura}
                      onChange={e => setAiLargura(e.target.value)}
                      onKeyDown={e => handleFieldKeyDown(e, lockEndereco ? null : enderecoRef)}
                      className="w-full h-11 rounded-lg border border-border bg-card px-3.5 text-sm shadow-sm transition-all duration-200 hover:border-primary/40 hover:bg-card focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none"
                      placeholder="Ex: 2.80" autoComplete="off" inputMode="decimal"
                    />
                  </div>
                ) : (
                  <div className="space-y-1.5 sm:col-span-2">

                    <div className="flex items-center gap-1.5 h-4">
                      <label htmlFor="lote-material" className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">Lote / Batch</label>
                      {(isPVT || isRolo) && (
                        <button onClick={toggleLockLote} className={`transition-colors ${lockLote ? 'text-lock' : 'text-muted-foreground/40 hover:text-muted-foreground'}`} title={lockLote ? 'Campo travado' : 'Travar campo'}>
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
                        ((isPVT || isRolo) && lockLote) ? 'bg-lock/[0.08] border-lock/50 text-foreground shadow-[0_0_0_3px_hsl(var(--lock)/0.18),0_0_18px_hsl(var(--lock)/0.35)] focus:ring-2 focus:ring-lock/40 focus:outline-none' : 'border-border bg-card hover:border-primary/40 focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none'
                      }`}
                      placeholder="Lote..." autoComplete="off"
                      readOnly={((isPVT || isRolo) && lockLote) && !!lockedLote}
                    />
                  </div>
                )}
              </>
            )}

            {/* Endereço */}
            {requiresEndereco && (
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="endereco-input" className="text-[11px] font-bold uppercase tracking-[0.08em] text-foreground/90">Endereço de Armazenagem</label>
                  <button 
                    onClick={() => isMadeira ? setLockMadeiraEndereco(!lockMadeiraEndereco) : toggleLockEndereco()} 
                    className={`transition-colors ${(isMadeira ? lockMadeiraEndereco : lockEndereco) ? 'text-lock' : 'text-muted-foreground/40 hover:text-muted-foreground'}`} 
                    title={(isMadeira ? lockMadeiraEndereco : lockEndereco) ? 'Campo travado' : 'Travar campo'}
                  >
                    {(isMadeira ? lockMadeiraEndereco : lockEndereco) ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
                <input
                  id="endereco-input"
                  ref={enderecoRef}
                  value={endereco}
                  onChange={e => handleEnderecoChange(e.target.value)}
                  onKeyDown={e => handleFieldKeyDown(e, null)}
                  className={`w-full h-11 rounded-lg border px-3 text-sm font-mono uppercase transition-colors ${
                    (isMadeira ? lockMadeiraEndereco : (isRolo && lockEndereco) || lockEndereco) ? 'bg-lock/[0.08] border-lock/50 text-foreground shadow-[0_0_0_3px_hsl(var(--lock)/0.18),0_0_18px_hsl(var(--lock)/0.35)] focus:ring-2 focus:ring-lock/40 focus:outline-none' : (enderecoError ? 'border-destructive bg-destructive/5' : 'border-border bg-card hover:border-primary/40 focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/25 focus:shadow-md focus:outline-none')
                  }`}
                  placeholder="TEC01.A.N03" autoComplete="off"
                  readOnly={(isMadeira ? lockMadeiraEndereco : lockEndereco) && !!(isMadeira ? endereco : lockedEndereco)}
                />
                {enderecoError && <p className="text-[10px] text-destructive font-medium ml-1">{enderecoError}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Preview Card */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="p-5 rounded-md bg-card border border-border/50 shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            <ItemVinculoBadge item={item} enabled={!isEtiqPronta} />
            {isMadeira ? (
              <>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Subtipo</p>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <p className="text-xl font-semibold text-foreground">{madeiraTipo}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Quantidade</p>
                  <p className="text-xl font-semibold text-foreground">
                    {quantidade || madeiraDefaults[madeiraTipo]} 
                    <span className="text-xs font-bold text-muted-foreground/40 ml-1.5">UND</span>
                  </p>
                </div>
              </>
            ) : isEtiqPronta ? null : (
              <>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Largura</p>
                  <p className="text-xl font-semibold text-foreground">{largura > 0 ? largura.toFixed(2) + 'm' : '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">M. Linear</p>
                  <p className="text-xl font-semibold text-foreground">{mLinear > 0 ? formatML(mLinear) : '—'}</p>
                </div>
              </>
            )}
            <div className="col-span-2 pt-4 mt-1 border-t border-border/40">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">Lote Sistema Gerado</p>
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="px-3 py-2.5 rounded-md bg-muted/30 font-mono text-[11px] font-semibold text-primary/80 break-all border border-border/40 shadow-inner group-hover:bg-muted/50 transition-colors"
              >
                {previewLoteSistema}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <div className="space-y-3 pb-6 pt-2 px-1 -mx-1 z-30 sm:relative sm:bg-none sm:p-0">
          <Button
            onClick={handleAdd}
            className="w-full h-14 sm:h-16 rounded-md font-semibold tracking-[0.08em] text-sm sm:text-base"
          >
            <Plus className="w-5 h-5 sm:w-6 sm:h-6 mr-2" strokeWidth={2.5} />
            Adicionar {isMadeira ? (madeiraTipo === 'Lâmina' ? 'Lâminas' : madeiraTipo) : 'Registro'}
          </Button>


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
