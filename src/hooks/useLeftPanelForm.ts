import { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { extractLarguraFromItem, ENDERECO_REGEX, generateLoteSistema, generateLoteSistemaCaixa } from '@/lib/app-utils';
import { Registro } from '@/types';
import { toast } from 'sonner';

export function useLeftPanelForm() {
  const currentMode = useAppStore(s => s.currentMode);
  const setMode = useAppStore(s => s.setMode);
  const processo = useAppStore(s => s.processo);
  const setProcesso = useAppStore(s => s.setProcesso);
  const conferente = useAppStore(s => s.conferente);
  const registros = useAppStore(s => s.registros);
  const addRegistro = useAppStore(s => s.addRegistro);
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
    manualLargura, coulisseMetragem, madeiraTipo, quantidade
  } = formData;

  const [enderecoError, setEnderecoError] = useState('');

  const itemRef = useRef<HTMLInputElement>(null);
  const nfRef = useRef<HTMLInputElement>(null);
  const m2Ref = useRef<HTMLInputElement>(null);
  const larguraRef = useRef<HTMLInputElement>(null);
  const loteRef = useRef<HTMLInputElement>(null);
  const enderecoRef = useRef<HTMLInputElement>(null);
  const quantidadeRef = useRef<HTMLInputElement>(null);
  const manualLarguraRef = useRef<HTMLInputElement>(null);

  // Constants and Computed values
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
  const isHC45 = isCelular && (item || '').toUpperCase().startsWith('HC-45');
  const celularDivisor = isHC45 ? 3.66 : 3.05;

  const isCoulisse = currentMode === 'manual';
  const coulisseUsesMLinear = isCoulisse && coulisseMetragem === 'mlinear';
  const usesLarguraFromItem = !isAI && (isRolo || isCortina);

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

  // Sync locks logic (Refactored to avoid loops)
  useEffect(() => {
    if (lockEndereco && lockedEndereco && endereco !== lockedEndereco) {
      setFormData({ endereco: lockedEndereco });
    }
  }, [lockEndereco, lockedEndereco]); // Removed 'endereco' from dependencies to prevent immediate loops - rely on lock logic

  useEffect(() => {
    if (lockProcesso && lockedProcesso && processo !== lockedProcesso) {
      setProcesso(lockedProcesso);
    }
  }, [lockProcesso, lockedProcesso]);

  useEffect(() => {
    if (lockNf && lockedNf && nf !== lockedNf) {
      setFormData({ nf: lockedNf });
    }
  }, [lockNf, lockedNf]);

  const validateEndereco = useCallback((val: string) => {
    if (!val) { 
      setEnderecoError(''); 
      return; 
    }
    const isValid = ENDERECO_REGEX.test(val);
    setEnderecoError(isValid ? '' : 'Padrão: TEC01.A.N03');
  }, []);

  useEffect(() => {
    validateEndereco(endereco);
  }, [endereco, validateEndereco]);

  const handleAdd = useCallback(() => {
    if (!item) { toast.warning('O campo ITEM é obrigatório.'); itemRef.current?.focus(); return; }
    if (!lote && !isMadeira) { toast.warning('O campo LOTE é obrigatório.'); loteRef.current?.focus(); return; }
    
    const id = crypto.randomUUID();
    const loteSistema = isMadeira 
      ? generateLoteSistemaCaixa(processo, item, mLinear, registros)
      : generateLoteSistema(processo, endereco, mLinear, registros, nf, item);

    const newReg: Registro = {
      id,
      item: item.trim().toUpperCase(),
      processo: processo.trim().toUpperCase(),
      nf: nf.trim().toUpperCase(),
      endereco: endereco.trim().toUpperCase(),
      m2: parseFloat(m2) || 0,
      mLinear: parseFloat(mLinear.toFixed(2)),
      largura: parseFloat(largura.toFixed(2)),
      lote: lote.trim().toUpperCase(),
      loteSistema,
      quantidade: parseInt(quantidade, 10) || 0,
      isNew: true,
      tipoTecido: isDiversos ? diversosTipo : 'Padrao',
      modoOrigem: currentMode,
      editedBy: conferente || 'Sistema',
      editedAt: new Date().toISOString()
    };

    addRegistro(newReg);
    toast.success(`✓ Item "${newReg.item}" adicionado!`, {
      description: `${newReg.loteSistema}`,
      duration: 3000
    });

    setFormData({
      item: '',
      lote: '',
      m2: '',
      aiLargura: '',
      aiMLinear: '',
      diversosMLinear: '',
      quantidade: ''
    });

    setTimeout(() => itemRef.current?.focus(), 50);
  }, [item, lote, isMadeira, isDiversos, diversosTipo, currentMode, processo, endereco, mLinear, registros, nf, m2, largura, quantidade, addRegistro, conferente, setFormData]);

  return useMemo(() => ({
    formData,
    setFormData,
    processo,
    setProcesso,
    registros,
    currentMode,
    setMode,
    enderecoError,
    itemRef,
    nfRef,
    m2Ref,
    larguraRef,
    loteRef,
    enderecoRef,
    quantidadeRef,
    manualLarguraRef,
    largura,
    mLinear,
    handleAdd,
    resetFormData,
    lockProcesso,
    setLockProcesso,
    lockedProcesso,
    setLockedProcesso,
    lockNf,
    setLockNf,
    lockedNf,
    setLockedNf,
    lockEndereco,
    setLockEndereco,
    lockedEndereco,
    setLockedEndereco
  }), [
    formData, setFormData, processo, setProcesso, registros, currentMode, setMode,
    enderecoError, largura, mLinear, handleAdd, resetFormData, lockProcesso,
    setLockProcesso, lockedProcesso, setLockedProcesso, lockNf, setLockNf,
    lockedNf, setLockedNf, lockEndereco, setLockEndereco, lockedEndereco, setLockedEndereco
  ]);
}