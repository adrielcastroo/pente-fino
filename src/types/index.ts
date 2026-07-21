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
  posicao?: number;
  quantidade?: number;
  isNew?: boolean;
  conference_id?: string | null;
  tipoTecido?: string;
  modoOrigem?: string;
  wasEdited?: boolean;
  editedBy?: string;
  editedAt?: string | null;
  loteMestreId?: string | null;
  avariaTipo?: 'riscado' | 'manchado' | 'quebrado' | 'outro' | null;
  avariaDescricao?: string | null;
  avariaFotoUrl?: string | null;
  curva_abc?: string;
  ultima_contagem?: string | null;
}

export interface LoteMestre {
  id: string;
  nome: string;
  corHex: string;
  descricao?: string | null;
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

export type AppMode = 'manual' | 'openrouter' | 'diversos' | 'madeira' | 'motor' | 'controle' | 'etiq_pronta';
export type AppTab = 'inicio' | 'tecido' | 'madeira' | 'motor' | 'estoque' | 'saida' | 'reservas' | 'history' | 'settings' | 'cadastros' | 'auditoria';

export interface Reserva {
  id: string;
  codigo: string;
  descricao?: string;
  endereco: string;
  quantidade: number;
  caixaNum?: string;
  quantidadeCx?: number;
  observacao?: string;
  createdAt: string;
  updatedAt?: string | null;
  updatedBy?: string | null;
  updatedByName?: string | null;
  lastEditedField?: string | null;
  lastEditedAt?: string | null;
}

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
  cortinaLargura: string;
  cortinaMetragem: 'm2' | 'mlinear';
  madeiraTipo: 'Lâmina' | 'Base' | 'Bandô';
  quantidade: string;
  motorSubMode: 'motor' | 'controle' | 'coulisse';
  motorModelo: string;
  motorNf: string;
  motorSerie: string;
  motorTemCaixa: boolean;
  motorCaixaNum: string;
  coulisseModeloProcCx: string;
  coulisseLote: string;
  estoqueActiveTec: string;
  estoqueSearch: string;
  estoqueHighlightStatus: string | null;
  etiqProntaLoteFinal: string;
  posicao: string;
  activeTab: AppTab;
  curvaABC: string;
}

export interface UndoEntry {
  reg: Registro;
  idx: number;
}

export interface AppStats {
  totalConferentes: number;
  totalConferencias: number;
  totalRegistros: number;
  avgDuration: string;
  timeline: { name: string; total: number }[];
  topConferentes: { name: string; value: number }[];
  categorias: { name: string; value: number }[];
  tipos: { name: string; value: number }[];
  conferenteDetails: {
    name: string;
    total: number;
    conferences: number;
    lastDate: string;
  }[];
  occupation: {
    tecido: {
      used: number;
      total: number;
      reserved: number;
      blocked: number;
    };
    chao: {
      used: number;
    };
    madeira: {
      used: number;
      total: number;
      reserved: number;
      blocked: number;
    } | null;
  };
}

export interface TarefaContagem {
  id: string;
  item_id?: string;
  item_name?: string;
  codigo_lote: string;
  quantidade_esperada_sistema: number;
  status: 'pendente' | 'concluido';
  data_geracao: string;
}

export interface HistoricoContagem {
  id: string;
  tarefa_id: string;
  conferente_nome: string;
  quantidade_contada: number;
  quantidade_sistema: number;
  data_conferencia: string;
  diferenca: number;
  detalhes_bipagem?: any[];
}

