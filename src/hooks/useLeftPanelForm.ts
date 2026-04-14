import { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/store/useAppStore';
import { extractLarguraFromItem, ENDERECO_REGEX, generateLoteSistema, generateLoteSistemaCaixa } from '@/lib/app-utils';
import { FormData, Registro } from '@/types';
import { toast } from 'sonner';

export function useLeftPanelForm() {
  const {
    currentMode, setMode, processo, setProcesso, registros, addRegistro,
    lockProcesso, setLockProcesso, lockedProcesso, setLockedProcesso,
    lockNf, setLockNf, lockedNf, setLockedNf, lockEndereco, setLockEndereco,
    lockedEndereco, setLockedEndereco, formData, setFormData, resetFormData,
    conferente
  } = useAppStore(useShallow(s => ({
    currentMode: s.currentMode,
    setMode: s.setMode,
    processo: s.processo,
    setProcesso: s.setProcesso,
    conferente: s.conferente,
    registros: s.registros,
    addRegistro: s.addRegistro,
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
  const isHC45 = isCelular && item.toUpperCase().startsWith('HC-45');
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

  // Sync locks logic
  useEffect(() => {
    if (lockEndereco && lockedEndereco && endereco !== lockedEndereco) {
      setFormData({ endereco: lockedEndereco });
    }
  }, [lockEndereco, lockedEndereco, endereco, setFormData]);

  useEffect(() => {
    if (lockProcesso && lockedProcesso && processo !== lockedProcesso) {
      setProcesso(lockedProcesso);
    }
  }, [lockProcesso, lockedProcesso, processo, setProcesso]);

  useEffect(() => {
    if (lockNf && lockedNf && nf !== lockedNf) {
      setFormData({ nf: lockedNf });
    }
  }, [lockNf, lockedNf, nf, setFormData]);

  const validateEndereco = useCallback((val: string) => {
    if (!val) { setEnderecoError(''); return; }
    setEnderecoError(ENDERECO_REGEX.test(val) ? '' : 'Padrão: TEC01.A.N03');
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

    const nextItem = '';
    const nextLote = '';
    const nextM2 = '';
    const nextAiLargura = '';
    const nextAiMLinear = '';
    const nextDiversosMLinear = '';
    const nextQuantidade = '';
    
    setFormData({
      item: nextItem,
      lote: nextLote,
      m2: nextM2,
      aiLargura: nextAiLargura,
      aiMLinear: nextAiMLinear,
      diversosMLinear: nextDiversosMLinear,
      quantidade: nextQuantidade
    });

    setTimeout(() => itemRef.current?.focus(), 50);
  }, [item, lote, isMadeira, isDiversos, diversosTipo, currentMode, processo, endereco, mLinear, registros, nf, m2, largura, quantidade, addRegistro, conferente, setFormData]);

  return {
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
  };
}
