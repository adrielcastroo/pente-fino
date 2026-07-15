import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiService } from '@/services/api';
import { enqueueArchive } from '@/lib/offline-queue';
import { isSessionExpiredError } from '@/services/authGuard';
import { toast } from 'sonner';
import { Registro, Conference, AppMode, AppTab, FormData, UndoEntry, Reserva } from '@/types';
import { generateLoteSistema, extractLarguraFromItem } from '@/lib/app-utils';



export interface LabelSettings {
  width: number;
  height: number;
  fields: string[];
  motorFields?: string[];
  motorWidth?: number;
  motorHeight?: number;
  fontSize: number;
  showLogo: boolean;
  showQRCode: boolean;
  orientation: 'portrait' | 'landscape';
  motorOrientation?: 'portrait' | 'landscape';
  autoPrint: boolean;
  /** Webhook do n8n para etiquetas de tecido (também usado como padrão). */
  webhookUrl: string;
  /** Webhook do n8n específico para etiquetas de motor/controle. Se vazio, usa `webhookUrl`. */
  motorWebhookUrl?: string;
  printOffsetXMm?: number;
  motorPrintOffsetXMm?: number;
  printOffsetYMm?: number;
  motorPrintOffsetYMm?: number;
  // Aparência (Tecido)
  borderWidth?: number;        // px
  borderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  borderRadius?: number;       // px
  padding?: number;            // px (espaçamento interno)
  margin?: number;             // px (legado — margem uniforme)
  marginY?: number;            // px (margem vertical do preview, pode ser negativa)
  offsetX?: number;            // px (deslocamento horizontal, negativo = esquerda)
  // Aparência (Motor)
  motorBorderWidth?: number;
  motorBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  motorBorderRadius?: number;
  motorPadding?: number;
  motorMargin?: number;
  motorMarginY?: number;
  motorOffsetX?: number;
  // Expedição (etiquetas ZPL dinâmicas) — dimensões vêm do template.
  expedicaoPrintOffsetXMm?: number;
  expedicaoPrintOffsetYMm?: number;
  expedicaoBorderWidth?: number;
  expedicaoBorderStyle?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  expedicaoBorderRadius?: number;
  expedicaoPadding?: number;
  expedicaoLineThickness?: number;
  expedicaoLineStyle?: 'solid' | 'dashed' | 'dotted';
  expedicaoLineColor?: string;
  expedicaoFontFamily?: string;
}

export interface AppState {
  registros: Registro[];
  reservas: Reserva[];
  undoStack: UndoEntry[];
  lastDeletedAt: number | null;
  currentMode: AppMode;
  processo: string;
  conferente: string;
  searchQuery: string;
  sortBy: string;
  history: Conference[];
  sessionStartedAt: string | null;
  lockProcesso: boolean;
  lockedProcesso: string;
  lockNf: boolean;
  lockedNf: string;
  lockEndereco: boolean;
  lockedEndereco: string;
  // PVT locks
  lockItem: boolean;
  lockedItem: string;
  lockLote: boolean;
  lockedLote: string;
  lockMetragem: boolean;
  lockedMetragem: string;
  lockCoulisseMetragem: boolean;
  // Cortina locks
  lockCortinaLargura: boolean;
  lockedCortinaLargura: string;
  lockCortinaMetragem: boolean;
  lockMadeiraProcesso: boolean;
  lockMadeiraItem: boolean;
  lockMadeiraLote: boolean;
  lockMadeiraEndereco: boolean;
  lockMotorModelo: boolean;
  lockMotorNf: boolean;
  
  formData: FormData;
  
  // Label Settings
  labelSettings: LabelSettings;
  dashboardDialogTheme: 'light' | 'dark' | 'system';

  // Loading & Error States
  isArchiving: boolean;
  archiveError: string | null;
  isHistoryLoading: boolean;
  historyError: string | null;
  lastArchivedConferenceId: string | null;

  /**
   * Quando ≠ null, o usuário está retomando uma conferência arquivada via
   * "Incluir Item" em /historico. Os registros com id em `lockedIds` foram
   * herdados do histórico e NÃO podem ser removidos pela página operacional
   * — somente pela página /historico.
   */
  resumeMode: { conferenceId: string; folderName: string; lockedIds: string[] } | null;


  setMode: (mode: AppMode) => void;
  updateRegistro: (id: string, updates: Partial<Registro>) => void;
  setProcesso: (p: string) => void;
  setConferente: (c: string) => void;
  setSearchQuery: (q: string) => void;
  setSortBy: (s: string) => void;
  setLockProcesso: (lock: boolean) => void;
  setLockedProcesso: (p: string) => void;
  setLockNf: (lock: boolean) => void;
  setLockedNf: (n: string) => void;
  setLockEndereco: (lock: boolean) => void;
  setLockedEndereco: (e: string) => void;
  // PVT lock setters
  setLockItem: (lock: boolean) => void;
  setLockedItem: (i: string) => void;
  setLockLote: (lock: boolean) => void;
  setLockCoulisseMetragem: (lock: boolean) => void;
  setLockedLote: (l: string) => void;
  setLockMetragem: (lock: boolean) => void;
  setLockedMetragem: (m: string) => void;
  setLockCortinaLargura: (lock: boolean) => void;
  setLockedCortinaLargura: (l: string) => void;
  setLockCortinaMetragem: (lock: boolean) => void;
  setLockMadeiraProcesso: (lock: boolean) => void;
  setLockMadeiraItem: (lock: boolean) => void;
  setLockMadeiraLote: (lock: boolean) => void;
  setLockMadeiraEndereco: (lock: boolean) => void;
  setLockMotorModelo: (lock: boolean) => void;
  setLockMotorNf: (lock: boolean) => void;
  
  setFormData: (updates: Partial<FormData>) => void;
  setLabelSettings: (settings: Partial<LabelSettings>) => void;
  setDashboardDialogTheme: (theme: 'light' | 'dark' | 'system') => void;
  resetFormData: () => void;
  resetMotorFormData: () => void;
  addRegistro: (reg: Registro) => void;
  deleteRegistro: (id: string) => void;
  undo: () => Registro | null;
  clearLastDeleted: () => void;
  clearAll: () => void;
  addReserva: (res: Reserva) => Promise<void>;
  deleteReserva: (id: string) => Promise<void>;
  updateReserva: (id: string, updates: Partial<Reserva>) => void;
  clearReservas: () => Promise<void>;
  loadReservas: () => Promise<void>;
  archiveAndClear: (name: string, bypassLengthCheck?: boolean) => Promise<void>;
  loadHistory: () => Promise<void>;
  deleteConference: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  updateHistoryRegistro: (conferenceId: string, registroId: string, updates: Partial<Registro>) => Promise<void>;
  deleteHistoryRegistro: (conferenceId: string, registroId: string) => Promise<void>;
  addHistoryRegistro: (conferenceId: string, reg: Omit<Registro, 'id'>) => Promise<void>;
  setLastArchivedConferenceId: (id: string | null) => void;

  /** Inicia a retomada de uma conferência arquivada na página operacional. */
  startResumeConference: (conf: Conference) => void;
  /** Persiste os novos registros adicionados em modo retomada e volta ao histórico. */
  finishResumeConference: () => Promise<void>;
  /** Aborta a retomada sem persistir nada novo. */
  cancelResumeConference: () => void;
}

const INITIAL_FORM_DATA: FormData = {
  item: '', nf: '', m2: '', lote: '', endereco: '', aiLargura: '', aiMLinear: '',
  diversosTipo: 'Rolo', diversosMLinear: '', manualLargura: '', coulisseMetragem: 'm2',
  lockMetragem: false, cortinaLargura: '', cortinaMetragem: 'm2',
  madeiraTipo: 'Lâmina', quantidade: '', motorSubMode: 'motor',
  motorModelo: '', motorNf: '', motorSerie: '', motorTemCaixa: false, motorCaixaNum: '1',
  coulisseModeloProcCx: '', coulisseLote: '',
  estoqueActiveTec: 'TEC01', estoqueSearch: '', estoqueHighlightStatus: null, 
  etiqProntaLoteFinal: '',
  activeTab: 'inicio',
  posicao: '',
  curvaABC: 'C',
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      registros: [],
      reservas: [],
      undoStack: [],
      lastDeletedAt: null,
      currentMode: 'manual',
      processo: '',
      conferente: '',
      searchQuery: '',
      sortBy: '',
      history: [],
      sessionStartedAt: null,
      lockProcesso: false,
      lockedProcesso: '',
      lockNf: false,
      lockedNf: '',
      lockEndereco: false,
      lockedEndereco: '',
      // PVT locks
      lockItem: false,
      lockedItem: '',
      lockLote: false,
      lockedLote: '',
      lockMetragem: false,
      lockCoulisseMetragem: true,
      lockedMetragem: '',
      lockCortinaLargura: false,
      lockedCortinaLargura: '',
      lockCortinaMetragem: true,
      lockMadeiraProcesso: false,
      lockMadeiraItem: false,
      lockMadeiraLote: false,
      lockMadeiraEndereco: false,
      lockMotorModelo: false,
      lockMotorNf: false,
      
  formData: INITIAL_FORM_DATA,
      dashboardDialogTheme: 'system',
      labelSettings: {
        width: 100,
        height: 50,
        fields: ['sku', 'descricao', 'nfe', 'qtd', 'rnp', 'data', 'qr_sku', 'qr_lote'],
        motorFields: ['sku', 'descricao', 'serie', 'cx', 'nf', 'nt', 'rnp', 'data', 'qr_lote_sku'],
        motorWidth: 60,
        motorHeight: 48,
        fontSize: 10,
        showLogo: true,
        showQRCode: true,
        orientation: 'landscape',
        autoPrint: true,
        webhookUrl: 'http://localhost:5678/webhook/imprimir-etiqueta',
        printOffsetXMm: -5,
        motorPrintOffsetXMm: -5,
        printOffsetYMm: 0,
        motorPrintOffsetYMm: 0,
        borderWidth: 4,
        borderStyle: 'solid',
        borderRadius: 0,
        padding: 0,
        margin: 0,
        marginY: -4,
        offsetX: -27,
        motorBorderWidth: 2,
        motorBorderStyle: 'solid',
        motorBorderRadius: 0,
        motorPadding: 0,
        motorMargin: 0,
        motorMarginY: -4,
        motorOffsetX: -27,
        expedicaoPrintOffsetXMm: 0,
        expedicaoPrintOffsetYMm: 0,
        expedicaoBorderWidth: 0,
        expedicaoBorderStyle: 'none',
        expedicaoBorderRadius: 0,
        expedicaoPadding: 0,
        expedicaoLineThickness: 2,
        expedicaoLineStyle: 'solid',
        expedicaoLineColor: '#111111',
        expedicaoFontFamily: 'monospace',
      },
      
      isArchiving: false,
      archiveError: null,
      isHistoryLoading: false,
      historyError: null,
      lastArchivedConferenceId: null,
      resumeMode: null,


      setMode: (mode) => set({ currentMode: mode }),
      updateRegistro: (id, updates) => set(state => {
        const index = state.registros.findIndex(r => r.id === id);
        if (index === -1) return state;
        
        const newRegistros = [...state.registros];
        newRegistros[index] = { 
          ...newRegistros[index], 
          ...updates, 
          wasEdited: true, 
          editedBy: state.conferente || 'Sistema',
          editedAt: new Date().toISOString() 
        };
        
        return { registros: newRegistros };
      }),
      setProcesso: (p) => set({ processo: p }),
      setConferente: (c) => set({ conferente: c }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSortBy: (s) => set({ sortBy: s }),
      setLockProcesso: (lock) => set({ lockProcesso: lock }),
      setLockedProcesso: (p) => set({ lockedProcesso: p }),
      setLockNf: (lock) => set({ lockNf: lock }),
      setLockedNf: (n) => set({ lockedNf: n }),
      setLockEndereco: (lock) => set({ lockEndereco: lock }),
      setLockedEndereco: (e) => set({ lockedEndereco: e }),
      // PVT lock setters
      setLockItem: (lock) => set({ lockItem: lock }),
      setLockedItem: (i) => set({ lockedItem: i }),
      setLockLote: (lock) => set({ lockLote: lock }),
      setLockedLote: (l) => set({ lockedLote: l }),
      setLockMetragem: (lock) => set({ lockMetragem: lock }),
      setLockCoulisseMetragem: (lock) => set({ lockCoulisseMetragem: lock }),
      setLockedMetragem: (m) => set({ lockedMetragem: m }),
      setLockCortinaLargura: (lock) => set({ lockCortinaLargura: lock }),
      setLockedCortinaLargura: (l) => set({ lockedCortinaLargura: l }),
      setLockCortinaMetragem: (lock) => set({ lockCortinaMetragem: lock }),
      setLockMadeiraProcesso: (lock) => set({ lockMadeiraProcesso: lock }),
      setLockMadeiraItem: (lock) => set({ lockMadeiraItem: lock }),
      setLockMadeiraLote: (lock) => set({ lockMadeiraLote: lock }),
      setLockMadeiraEndereco: (lock) => set({ lockMadeiraEndereco: lock }),
      setLockMotorModelo: (lock) => set({ lockMotorModelo: lock }),
      setLockMotorNf: (lock) => set({ lockMotorNf: lock }),
      
      setFormData: (updates) => set(state => {
        const newData = { ...state.formData, ...updates };
        
        // Auto-calculate M² when Width or M Linear changes
        // m2 = largura * m_linear
        if ('manualLargura' in updates || 'diversosMLinear' in updates) {
          const mode = state.currentMode;
          const isCoulisse = mode === 'manual';
          const isDiversos = mode === 'diversos';
          const isEtiqPronta = mode === 'etiq_pronta';
          
          if (isCoulisse || isDiversos || isEtiqPronta) {
            const largura = parseFloat(newData.manualLargura) || extractLarguraFromItem(newData.item) || 0;
            const mLinear = parseFloat(newData.diversosMLinear) || 0;
            
            if (largura > 0 && mLinear > 0) {
              newData.m2 = (largura * mLinear).toFixed(2);
            }
          }
        }
        
        // Reverse calculation: if M2 is updated manually, we might want to update M Linear?
        // But user asked for: largura*m linear -> m2
        if ('m2' in updates && !('diversosMLinear' in updates)) {
           const mode = state.currentMode;
           if (mode === 'manual' || mode === 'diversos' || mode === 'etiq_pronta') {
              const largura = parseFloat(newData.manualLargura) || extractLarguraFromItem(newData.item) || 0;
              const m2Val = parseFloat(newData.m2) || 0;
              if (largura > 0 && m2Val > 0) {
                newData.diversosMLinear = (m2Val / largura).toFixed(2);
              }
           }
        }

        return { formData: newData };
      }),

      setLabelSettings: (updates) => set(state => ({
        labelSettings: { ...state.labelSettings, ...updates }
      })),
      setDashboardDialogTheme: (theme) => set({ dashboardDialogTheme: theme }),

      
      resetFormData: () => {
        const state = get();
        const isMadeira = state.currentMode === 'madeira';
        const newData = { 
          ...INITIAL_FORM_DATA,
          activeTab: state.formData.activeTab,
          estoqueActiveTec: state.formData.estoqueActiveTec,
          diversosTipo: state.formData.diversosTipo 
        };
        
        if (isMadeira) {
          if (state.lockMadeiraItem) newData.item = state.formData.item;
          if (state.lockMadeiraLote) newData.lote = state.formData.lote;
          if (state.lockMadeiraEndereco) newData.endereco = state.formData.endereco;
        } else {
          if (state.lockNf) newData.nf = state.lockedNf;
          if (state.lockEndereco) newData.endereco = state.lockedEndereco;
          if (state.lockItem) newData.item = state.lockedItem;
          if (state.lockLote) newData.lote = state.lockedLote;
          if (state.lockMetragem) newData.diversosMLinear = state.lockedMetragem;
          if (state.lockCoulisseMetragem) newData.coulisseMetragem = state.formData.coulisseMetragem;
          if (state.lockCortinaLargura) newData.cortinaLargura = state.lockedCortinaLargura;
          if (state.lockCortinaMetragem) newData.cortinaMetragem = state.formData.cortinaMetragem;
        }
        
        const updates: any = { formData: newData };
        if (isMadeira) {
          if (!state.lockMadeiraProcesso) updates.processo = '';
          else updates.processo = state.processo;
        } else {
          if (!state.lockProcesso) updates.processo = '';
          else updates.processo = state.processo;
        }

        set(updates);
      },
      
      resetMotorFormData: () => set(state => {
        const newData = { 
          ...state.formData, 
          motorSerie: '',
          motorTemCaixa: state.formData.motorTemCaixa, // Keep box state
          motorCaixaNum: state.formData.motorCaixaNum, // Keep box number
          coulisseModeloProcCx: state.formData.coulisseModeloProcCx, // Keep if you want, or clear
          coulisseLote: ''
        };
        if (!state.lockMotorModelo) {
          newData.motorModelo = '';
          newData.coulisseModeloProcCx = '';
        }
        if (!state.lockMotorNf) newData.motorNf = '';
        return { formData: newData };
      }),
      
      addRegistro: (reg) => set(state => {
        const newRegs = [...state.registros, reg];
        let sessionStartedAt = state.sessionStartedAt;
        if (!sessionStartedAt) {
          sessionStartedAt = new Date().toISOString();
        }
        return { registros: newRegs, sessionStartedAt };
      }),
      
      deleteRegistro: (id) => {
        const state = get();
        // Em modo retomada, itens herdados do histórico não podem ser removidos
        // pela página operacional. Só /historico permite.
        if (state.resumeMode && state.resumeMode.lockedIds.includes(id)) {
          toast.info('Item já conferido — remova pelo histórico (/historico).');
          return;
        }
        set(s => {
          const idx = s.registros.findIndex(r => r.id === id);
          if (idx === -1) return s;
          const reg = s.registros[idx];
          const newRegs = [...s.registros];
          newRegs.splice(idx, 1);
          return { registros: newRegs, undoStack: [...s.undoStack, { reg, idx }], lastDeletedAt: Date.now() };
        });
      },
      
      undo: () => {
        const state = get();
        if (!state.undoStack.length) return null;
        const last = state.undoStack[state.undoStack.length - 1];
        const newRegs = [...state.registros];
        newRegs.splice(last.idx, 0, last.reg);
        set({ registros: newRegs, undoStack: state.undoStack.slice(0, -1), lastDeletedAt: null });
        return last.reg;
      },
      clearLastDeleted: () => set({ lastDeletedAt: null }),
      
      clearAll: () => set({ registros: [], undoStack: [], sessionStartedAt: null, archiveError: null }),
      
      addReserva: async (res) => {
        try {
          await apiService.addReserva(res);
          set(state => ({ reservas: [...state.reservas, res] }));
        } catch (e) {
          console.error('Error adding reserva:', e);
          throw e;
        }
      },
      
      deleteReserva: async (id) => {
        try {
          await apiService.deleteReserva(id);
          set(state => ({ reservas: state.reservas.filter(r => r.id !== id) }));
        } catch (e) {
          console.error('Error deleting reserva:', e);
          throw e;
        }
      },
      
      updateReserva: (id, updates) => set(state => ({
        reservas: state.reservas.map(r => r.id === id ? { ...r, ...updates } : r)
      })),
      
      clearReservas: async () => {
        try {
          await apiService.clearReservas();
          set({ reservas: [] });
        } catch (e) {
          console.error('Error clearing reservas:', e);
          throw e;
        }
      },

      loadReservas: async () => {
        try {
          const reservas = await apiService.fetchReservas();
          set({ reservas });
        } catch (e) {
          console.error('Error loading reservas:', e);
        }
      },
      
      archiveAndClear: async (name: string, bypassLengthCheck = false) => {
        const state = get();
        // Em modo retomada, "finalizar" significa anexar à conferência existente.
        if (state.resumeMode) {
          await get().finishResumeConference();
          return;
        }
        if ((!state.registros.length && !bypassLengthCheck) || state.isArchiving) return;
        const registrosToArchive = [...state.registros];
        const processoToArchive = state.processo.trim() || name;
        const conferenteToArchive = state.conferente;
        const currentModeToArchive = state.currentMode;
        
        set({ isArchiving: true, archiveError: null, lastArchivedConferenceId: null });
        const finishedAt = new Date().toISOString();
        const startedAt = state.sessionStartedAt || finishedAt;
        
        try {
          const conf = await apiService.archiveConference(
            processoToArchive,
            conferenteToArchive,
            startedAt,
            registrosToArchive,
            currentModeToArchive
          );
          const archivedId = (conf as any)?.id ?? null;
          if (!archivedId) {
            throw new Error('Conferência arquivada sem confirmação do histórico.');
          }
          set({ 
            registros: [], 
            undoStack: [], 
            sessionStartedAt: null, 
            isArchiving: false,
            archiveError: null,
            lastArchivedConferenceId: archivedId,
          });
          get().resetFormData();
          get().resetMotorFormData();
          await get().loadHistory();

        } catch (e: any) {
          console.error('Error archiving:', e);
          if (isSessionExpiredError(e)) {
            set({
              isArchiving: false,
              archiveError: 'Sessão expirada. Faça login novamente para finalizar a conferência.'
            });
            toast.error('Sessão expirada — faça login para finalizar a conferência.', {
              description: 'Seus registros foram preservados.',
              duration: 8000,
            });
            const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
            setTimeout(() => {
              if (typeof window !== 'undefined') {
                window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
              }
            }, 1500);
            return;
          }

          // Offline / network failure: enqueue for background sync
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          const msg = String(e?.message || '').toLowerCase();
          const looksLikeNetwork = isOffline || msg.includes('failed to fetch') || msg.includes('network') || msg.includes('load failed');

          if (looksLikeNetwork) {
            try {
              await enqueueArchive({
                processo: processoToArchive,
                conferente: conferenteToArchive,
                startedAt,
                currentMode: currentModeToArchive,
                registros: registrosToArchive,
              });
              set({
                registros: [],
                undoStack: [],
                sessionStartedAt: null,
                isArchiving: false,
                archiveError: null,
              });
              get().resetFormData();
              get().resetMotorFormData();
              toast.success('Conferência salva localmente', {
                description: 'Será enviada automaticamente quando a conexão voltar.',
                duration: 5000,
              });
              return;
            } catch (queueErr) {
              console.error('Failed to enqueue archive:', queueErr);
            }
          }

          set({
            isArchiving: false,
            archiveError: e.message || 'Falha ao arquivar conferência'
          });
          throw e;
        }
      },

      
      loadHistory: async () => {
        const state = get();
        if (state.isHistoryLoading) return;
        
        set({ isHistoryLoading: true, historyError: null });
        try {
          const history = await apiService.fetchHistory();
          set({ history, isHistoryLoading: false });
        } catch (e: any) { 
          console.error('Error loading history:', e);
          set({ 
            isHistoryLoading: false, 
            historyError: e.message || 'Falha ao carregar histórico' 
          });
        }
      },
      
      deleteConference: async (id: string) => {
        try {
          await apiService.deleteConference(id);
          await get().loadHistory();
        } catch (e: any) { 
          console.error('Error deleting conference:', e);
          throw e;
        }
      },
      
      clearHistory: async () => {
        try {
          await apiService.clearAllHistory();
          set({ history: [] });
        } catch (e: any) { 
          console.error('Error clearing history:', e); 
          throw e;
        }
      },
      
      updateHistoryRegistro: async (conferenceId, registroId, updates) => {
        try {
          const state = get();
          const conference = state.history.find(c => c.id === conferenceId);
          if (!conference) return;
          const current = conference.registros.find(r => r.id === registroId);
          if (!current) return;
          
          const merged = { ...current, ...updates };
          const normalizedML = Number(merged.mLinear) || 0;
          const normalizedM2 = Number(merged.m2) || 0;
          const normalizedLargura = Number(merged.largura) || 0;
          const normalizedProcesso = (merged.modoOrigem === 'diversos' || current.modoOrigem === 'diversos') 
            ? '' 
            : (merged.processo ?? current.processo ?? conference.processo);
          const normalizedEndereco = merged.endereco || '';
          const normalizedItem = (merged.item || '').trim();
          const normalizedNf = (merged.nf || '').trim();
          const editedBy = state.conferente || merged.editedBy || 'Sistema';
          const editedAt = new Date().toISOString();
          
          const siblingRegistros = conference.registros.filter(r => r.id !== registroId);
          const loteSistema = generateLoteSistema(
            normalizedProcesso, 
            normalizedEndereco, 
            normalizedML, 
            siblingRegistros, 
            normalizedNf, 
            normalizedItem
          );
          
          const payload = {
            item: normalizedItem,
            nf: normalizedNf,
            m2: normalizedM2,
            m_linear: normalizedML,
            largura: normalizedLargura,
            endereco: normalizedEndereco,
            lote: merged.lote || '',
            lote_sistema: loteSistema,
            tipo_tecido: merged.tipoTecido || '',
            modo_origem: merged.modoOrigem || current.modoOrigem || '',
            was_edited: true,
            edited_by: editedBy,
            edited_at: editedAt,
            quantidade: merged.quantidade ?? null
          };
          
          await apiService.updateRegistro(conferenceId, registroId, payload);
          
          const newHistory = state.history.map(conf => conf.id !== conferenceId ? conf : {
            ...conf,
            registros: conf.registros.map(r => r.id !== registroId ? r : {
              ...r, 
              ...merged,
              processo: normalizedProcesso,
              loteSistema,
              wasEdited: true,
              editedBy,
              editedAt,
            }),
          });
          set({ history: newHistory });
        } catch (e: any) {
          console.error('Error updating history registro:', e);
          throw e;
        }
      },

      deleteHistoryRegistro: async (conferenceId, registroId) => {
        try {
          await apiService.deleteRegistro(conferenceId, registroId);
          set(state => ({
            history: state.history.map(conf => 
              conf.id !== conferenceId 
                ? conf 
                : { ...conf, registros: conf.registros.filter(r => r.id !== registroId) }
            )
          }));
        } catch (e: any) {
          console.error('Error deleting history registro:', e);
          throw e;
        }
      },

      addHistoryRegistro: async (conferenceId, regData) => {
        try {
          const state = get();
          const conference = state.history.find(c => c.id === conferenceId);
          if (!conference) return;

          const id = crypto.randomUUID();
          const newReg: Registro = { ...regData, id, conference_id: conferenceId };
          
          // Ensure loteSistema is generated if not provided
          if (!newReg.loteSistema) {
            newReg.loteSistema = generateLoteSistema(
              newReg.processo || conference.processo,
              newReg.endereco || '',
              newReg.mLinear || 0,
              conference.registros,
              newReg.nf || '',
              newReg.item || ''
            );
          }

          const inserted = await apiService.insertRegistros(conferenceId, [newReg], newReg.modoOrigem || 'manual');
          if (!inserted || inserted.length === 0) throw new Error('Falha ao inserir registro');
          
          const r = inserted[0];
          const mappedReg: Registro = {
            id: r.id,
            item: r.item,
            processo: (r.modo_origem === 'diversos' && r.tipo_tecido !== 'Celular') ? '' : conference.processo,
            nf: r.nf || '',
            endereco: r.endereco,
            m2: Number(r.m2),
            mLinear: Number(r.m_linear),
            largura: Number(r.largura),
            lote: r.lote,
            loteSistema: r.lote_sistema,
            conference_id: r.conference_id,
            tipoTecido: r.tipo_tecido,
            modoOrigem: r.modo_origem,
            wasEdited: r.was_edited,
            editedBy: r.edited_by,
            editedAt: r.edited_at,
            quantidade: r.quantidade ?? undefined,
          };

          set(state => ({
            history: state.history.map(conf => 
              conf.id !== conferenceId 
                ? conf 
                : { ...conf, registros: [...conf.registros, mappedReg] }
            )
          }));
        } catch (e: any) {
          console.error('Error adding history registro:', e);
          throw e;
        }
      },

      setLastArchivedConferenceId: (id) => set({ lastArchivedConferenceId: id }),

      startResumeConference: (conf) => {
        const state = get();
        if (state.registros.length > 0 && !state.resumeMode) {
          // Há uma conferência em andamento. Avisa e segue (substitui).
          toast.warning('Sessão em andamento substituída pela retomada do histórico.');
        }
        const lockedIds = conf.registros.map(r => r.id);
        // Deep clone leve dos registros — mantém ids para o bloqueio funcionar.
        const registros = conf.registros.map(r => ({ ...r }));
        const inferredMode =
          registros.find(r => r.modoOrigem === 'motor' || r.modoOrigem === 'controle')?.modoOrigem ??
          registros.find(r => r.modoOrigem === 'madeira')?.modoOrigem ??
          registros[0]?.modoOrigem ??
          'manual';

        // Pré-configura sub-mode de motor (motor/controle/coulisse) e activeTab
        // para que a página correta abra com a aba certa e o useEffect de
        // MotorControlePage não force 'motor' sobre 'controle'.
        const hasCoulisse = registros.some(r => r.tipoTecido === 'Coulisse');
        const hasControle = registros.some(r => r.modoOrigem === 'controle');
        const motorSubMode: 'motor' | 'controle' | 'coulisse' =
          hasControle ? 'controle' : hasCoulisse ? 'coulisse' : 'motor';
        const activeTab: AppTab =
          inferredMode === 'motor' || inferredMode === 'controle' ? 'motor'
            : inferredMode === 'madeira' ? 'madeira'
            : 'tecido';

        set({
          registros,
          undoStack: [],
          processo: conf.processo || '',
          conferente: conf.conferente || state.conferente,
          currentMode: inferredMode as AppMode,
          sessionStartedAt: conf.startedAt || new Date().toISOString(),
          formData: {
            ...state.formData,
            activeTab,
            motorSubMode,
          },
          resumeMode: {
            conferenceId: conf.id,
            folderName: conf.processo || conf.name,
            lockedIds,
          },
        });
      },

      finishResumeConference: async () => {
        const state = get();
        if (!state.resumeMode) return;
        const { conferenceId, lockedIds } = state.resumeMode;
        const locked = new Set(lockedIds);
        const newRegs = state.registros.filter(r => !locked.has(r.id));

        try {
          if (newRegs.length > 0) {
            // Agrupa por modoOrigem para preservar o mode correto no insert.
            const byMode = new Map<string, Registro[]>();
            for (const r of newRegs) {
              const m = r.modoOrigem || state.currentMode || 'manual';
              if (!byMode.has(m)) byMode.set(m, []);
              byMode.get(m)!.push(r);
            }
            for (const [mode, regs] of byMode) {
              await apiService.insertRegistros(conferenceId, regs, mode);
            }
            toast.success(`${newRegs.length} item(ns) adicionado(s) à conferência.`);
          } else {
            toast.info('Nenhum item novo para adicionar.');
          }
          set({
            registros: [],
            undoStack: [],
            sessionStartedAt: null,
            resumeMode: null,
          });
          await get().loadHistory();
        } catch (e: any) {
          console.error('Error finishing resume conference:', e);
          toast.error(e?.message || 'Falha ao salvar os novos itens.');
          throw e;
        }
      },

      cancelResumeConference: () => {
        set({
          registros: [],
          undoStack: [],
          sessionStartedAt: null,
          resumeMode: null,
        });
      },
    }),

    {
      name: 'cft4-registros',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          try {
            return JSON.parse(str);
          } catch {
            return null;
          }
        },
         setItem: (name, value) => {
           // More robust debounce for storage persistence
           const global = window as any;
           if (global._persisterTimer) {
             clearTimeout(global._persisterTimer);
           }
           global._persisterValue = value;
           global._persisterTimer = setTimeout(() => {
             try {
               localStorage.setItem(name, JSON.stringify(global._persisterValue));
             } catch (e) {
               console.error('Error persisting state:', e);
             }
             global._persisterTimer = null;
           }, 1000);
         },
        removeItem: (name) => localStorage.removeItem(name),
      },
      partialize: (state) => ({
        registros: state.registros,
        reservas: state.reservas,
        undoStack: state.undoStack,
        currentMode: state.currentMode,
        processo: state.processo,
        conferente: state.conferente,
        searchQuery: '', 
        formData: {
          ...state.formData,
          estoqueSearch: '',
          estoqueHighlightStatus: null
        },
        sortBy: state.sortBy,
        sessionStartedAt: state.sessionStartedAt,
        lockProcesso: state.lockProcesso,
        lockedProcesso: state.lockedProcesso,
        lockNf: state.lockNf,
        lockedNf: state.lockedNf,
        lockEndereco: state.lockEndereco,
        lockedEndereco: state.lockedEndereco,
        lockItem: state.lockItem,
        lockedItem: state.lockedItem,
        lockLote: state.lockLote,
        lockedLote: state.lockedLote,
        lockMetragem: state.lockMetragem,
        lockCoulisseMetragem: state.lockCoulisseMetragem,
        lockedMetragem: state.lockedMetragem,
        lockCortinaLargura: state.lockCortinaLargura,
        lockedCortinaLargura: state.lockedCortinaLargura,
        lockCortinaMetragem: state.lockCortinaMetragem,
        lockMadeiraProcesso: state.lockMadeiraProcesso,
        lockMadeiraItem: state.lockMadeiraItem,
        lockMadeiraLote: state.lockMadeiraLote,
        lockMadeiraEndereco: state.lockMadeiraEndereco,
        lockMotorModelo: state.lockMotorModelo,
        lockMotorNf: state.lockMotorNf,
        labelSettings: state.labelSettings,
        dashboardDialogTheme: state.dashboardDialogTheme,
      } as any),
    }
  )
);