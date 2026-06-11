import { memo } from 'react';
import { Registro } from '@/types';

export const getRegistroColumns = (registros: Registro[], mode: string) => {
  const hasMultipleModes = new Set(registros.map(r => r.modoOrigem)).size > 1;
  const isMotorControle = mode === 'motor' || mode === 'controle' || registros.some(r => r.modoOrigem === 'motor' || r.modoOrigem === 'controle');

  if (isMotorControle) {
    return [
      { key: 'item', label: 'Modelo', width: 25 },
      { key: 'nf', label: 'NF', width: 12 },
      { key: 'lote', label: 'Série', width: 20 },
      { key: 'loteSistema', label: 'Lote Final', width: 35 },
      { key: 'quantidade', label: 'UND/CX', width: 10 },
    ];
  }

  const columns = [
    { key: 'item', label: 'Item/Referência', width: 25 },
    { key: 'nf', label: 'NF', width: 12 },
    { key: 'processo', label: 'PROC', width: 12 },
    { key: 'm2', label: 'M²', width: 10 },
    { key: 'largura', label: 'L(m)', width: 10 },
    { key: 'mLinear', label: 'M.Linear', width: 12 },
    { key: 'lote', label: 'Lote/Batch', width: 15 },
    { key: 'endereco', label: 'Endereço', width: 15 },
    { key: 'loteSistema', label: 'Lote Final', width: 35 },
  ];

  return columns;
};
