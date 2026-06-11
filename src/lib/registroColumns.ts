import { Registro } from '@/types';

export type RegistroColumnKey = keyof Registro | 'processo' | 'quantidade' | 'wasEdited' | 'item' | 'nf' | 'lote' | 'm2' | 'largura' | 'mLinear' | 'endereco' | 'loteSistema' | 'conferente';

export interface RegistroColumn {
  key: RegistroColumnKey;
  label: string;
  shortLabel: string;
  width: number;
}

export const getRegistroColumns = (registros: Registro[], mode: string): RegistroColumn[] => {
  const isMotorControle = mode === 'motor' || mode === 'controle' || registros.some(r => r.modoOrigem === 'motor' || r.modoOrigem === 'controle');

  if (isMotorControle) {
    return [
      { key: 'item', label: 'Modelo', shortLabel: 'Mod', width: 25 },
      { key: 'nf', label: 'NF', shortLabel: 'NF', width: 12 },
      { key: 'lote', label: 'Série', shortLabel: 'Sér', width: 20 },
      { key: 'loteSistema', label: 'Lote Final', shortLabel: 'LF', width: 35 },
      { key: 'quantidade', label: 'UND/CX', shortLabel: 'Qtd', width: 10 },
    ];
  }

  return [
    { key: 'item', label: 'Item/Referência', shortLabel: 'Item', width: 25 },
    { key: 'nf', label: 'NF', shortLabel: 'NF', width: 12 },
    { key: 'processo', label: 'PROC', shortLabel: 'PRC', width: 12 },
    { key: 'm2', label: 'M²', shortLabel: 'M²', width: 10 },
    { key: 'largura', label: 'L(m)', shortLabel: 'L', width: 10 },
    { key: 'mLinear', label: 'M.Linear', shortLabel: 'ML', width: 12 },
    { key: 'lote', label: 'Lote/Batch', shortLabel: 'Lt', width: 15 },
    { key: 'endereco', label: 'Endereço', shortLabel: 'End', width: 15 },
    { key: 'loteSistema', label: 'Lote Final', shortLabel: 'LF', width: 35 },
  ];
};
