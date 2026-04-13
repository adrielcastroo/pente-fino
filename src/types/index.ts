export interface Registro {
  id: string;
  item: string;
  processo: string;
  nf?: string;
  endereco: string;
  m2: number;
  mLinear: number;
  largura: number;
  lote: string;
  loteSistema: string;
  quantidade?: number;
  isNew?: boolean;
  conference_id?: string | null;
  tipoTecido?: string;
  modoOrigem?: string;
  wasEdited?: boolean;
  editedBy?: string;
  editedAt?: string | null;
}

export interface Conference {
  id: string;
  name: string;
  processo: string;
  conferente: string;
  date: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  registros: Registro[];
}

export type AppMode = 'manual' | 'openrouter' | 'diversos' | 'madeira' | 'motor' | 'controle';
export type AppTab = 'inicio' | 'tecido' | 'madeira' | 'motor' | 'estoque' | 'saida' | 'table' | 'history' | 'settings';

export interface FormData {
  item: string;
  nf: string;
  m2: string;
  lote: string;
  endereco: string;
  aiLargura: string;
  aiMLinear: string;
  diversosTipo: 'Rolo' | 'PVT' | 'Cortina' | 'Celular';
  diversosMLinear: string;
  manualLargura: string;
  coulisseMetragem: 'm2' | 'mlinear';
  lockMetragem: boolean;
  madeiraTipo: 'Lâmina' | 'Base' | 'Bandô';
  quantidade: string;
  motorSubMode: 'motor' | 'controle';
  motorModelo: string;
  motorNf: string;
  motorSerie: string;
  motorTemCaixa: boolean;
  motorCaixaNum: string;
  estoqueActiveTec: string;
  estoqueSearch: string;
  estoqueHighlightStatus: string | null;
  activeTab: AppTab;
}

export interface UndoEntry {
  reg: Registro;
  idx: number;
}
