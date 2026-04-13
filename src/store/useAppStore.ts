import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

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

interface UndoEntry {
  reg: Registro;
  idx: number;
}

export interface AppState {
  registros: Registro[];
  undoStack: UndoEntry[];
  currentMode: 'manual' | 'openrouter' | 'diversos' | 'madeira' | 'motor' | 'controle';
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

  // Form Fields Persistence
  formData: {
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
    // Motor/Controle Fields
    motorSubMode: 'motor' | 'controle';
    motorModelo: string;
    motorNf: string;
    motorSerie: string;
    motorTemCaixa: boolean;
    motorCaixaNum: string;
    // Estoque Page Fields
    estoqueActiveTec: string;
    estoqueSearch: string;
    estoqueHighlightStatus: string | null;
    activeTab: 'inicio' | 'tecido' | 'madeira' | 'motor' | 'estoque' | 'table' | 'history';
  };

  setMode: (mode: 'manual' | 'openrouter' | 'diversos' | 'madeira' | 'motor' | 'controle') => void;
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
  setFormData: (updates: Partial<AppState['formData']>) => void;
  resetFormData: () => void;
  resetMotorFormData: () => void;
  addRegistro: (reg: Registro) => void;
  deleteRegistro: (id: string) => void;
  undo: () => Registro | null;
  clearAll: () => void;
  loadFromStorage: () => void;
  archiveAndClear: (name: string) => Promise<void>;
  loadHistory: () => Promise<void>;
  deleteConference: (id: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  updateHistoryRegistro: (conferenceId: string, registroId: string, updates: Partial<Registro>) => Promise<void>;
}

const STORAGE_KEY = 'cft4';
const SESSION_START_KEY = 'cft4_session_started_at';

export const ENDERECO_REGEX = /^[A-Z0-9]{5}\.[A-Z0-9]\.[A-Z0-9]+$/;

function parseEndereco(addr: string) {
  if (!addr || !ENDERECO_REGEX.test(addr)) return null;
  const [est, col, nivStr] = addr.split('.');
  const nivel = parseInt(nivStr.replace('N', ''), 10);
  return { estrutura: est, coluna: col, nivel };
}


function fmtML(v: number): string {
  if (!v || v === 0) return '';
  const rounded = parseFloat(v.toFixed(1));
  return (rounded % 1 === 0 ? Math.round(rounded) : rounded.toFixed(1).replace('.', ',')) + 'M';
}

let saveTimeout: any = null;
function save(registros: Registro[]) {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(registros)); } catch {}
  }, 500);
}

export function formatML(v: number): string {
  return fmtML(v);
}

/** Extract largura from item code: e.g. SRC-3003-05-30-EB2 → 30 → 3.00m */
export function extractLarguraFromItem(item: string): number {
  const parts = item.split('-');
  if (parts.length < 4) return 0;
  const raw = parts[3];
  const num = parseInt(raw, 10);
  if (isNaN(num) || num <= 0) return 0;
  if (num >= 100) return num / 100;
  return num / 10;
}

/** Generate Lote Sistema with NF/PROC label prefix and serial for duplicates */
export function generateLoteSistema(processo: string, endereco: string, mLinear: number, existingRegistros: Registro[], nf?: string, itemCode?: string): string {
  const mlFormatted = fmtML(mLinear) || '0M';
  const procTrimmed = processo.trim();
  const nfTrimmed = (nf || '').trim();
  const labelPrefix = procTrimmed ? `PROC ${procTrimmed}` : (nfTrimmed ? `NF ${nfTrimmed}` : '');
  const addrTrimmed = (endereco || '').trim();
  const baseParts = [addrTrimmed, labelPrefix, mlFormatted].filter(Boolean);
  const base = baseParts.join(' ');
  const itemNorm = (itemCode || '').trim().toLowerCase();
  
  let count = 0;
  for (const r of existingRegistros) {
    if ((r.item || '').trim().toLowerCase() !== itemNorm) continue;
    if (fmtML(r.mLinear) !== mlFormatted) continue;
    if ((r.endereco || '').trim() !== addrTrimmed) continue;

    const rProc = (r.processo || '').trim();
    const rNf = (r.nf || '').trim();
    const rLabel = rProc ? `PROC ${rProc}` : (rNf ? `NF ${rNf}` : '');
    
    if (rLabel === labelPrefix) {
      count++;
    }
  }
  
  return count === 0 ? base : `${base}-${count}`;
}

/** Generate Lote Sistema with box numbering (CXnn) for Madeira and Celular modes */
export function generateLoteSistemaCaixa(processo: string, item: string, mLinear: number, existingRegistros: Registro[]): string {
  const itemNorm = (item || '').trim().toLowerCase();
  let count = 0;
  for (const r of existingRegistros) {
    if ((r.item || '').trim().toLowerCase() === itemNorm) count++;
  }
  const cxLabel = `CX${(count + 1).toString().padStart(2, '0')}`;
  const procTrimmed = processo.trim();
  const mlFormatted = fmtML(mLinear);
  const parts = [cxLabel, procTrimmed ? `PROC ${procTrimmed}` : '', mlFormatted].filter(Boolean);
  return parts.join(' ');
}

const INITIAL_FORM_DATA: AppState['formData'] = {
  item: '',
  nf: '',
  m2: '',
  lote: '',
  endereco: '',
  aiLargura: '',
  aiMLinear: '',
  diversosTipo: 'Rolo',
  diversosMLinear: '',
  manualLargura: '',
  coulisseMetragem: 'm2',
  lockMetragem: false,
  madeiraTipo: 'Lâmina',
  quantidade: '',
  motorSubMode: 'motor',
  motorModelo: '',
  motorNf: '',
  motorSerie: '',
  motorTemCaixa: false,
  motorCaixaNum: '1',
  estoqueActiveTec: 'TEC01',
  estoqueSearch: '',
  estoqueHighlightStatus: null,
  activeTab: 'inicio',
};

export const useAppStore = create<AppState>((set, get) => ({
  registros: [],
  undoStack: [],
  currentMode: (localStorage.getItem('cft4_mode') as any) || 'manual',
  processo: localStorage.getItem('cft4_processo') || '',
  conferente: localStorage.getItem('cft4_conferente') || '',
  searchQuery: localStorage.getItem('cft4_searchQuery') || '',
  sortBy: localStorage.getItem('cft4_sortBy') || '',
  history: [],
  sessionStartedAt: localStorage.getItem(SESSION_START_KEY) || null,
  lockProcesso: localStorage.getItem('cft4_lockProcesso') === 'true',
  lockedProcesso: localStorage.getItem('cft4_lockedProcesso') || '',
  lockNf: localStorage.getItem('cft4_lockNf') === 'true',
  lockedNf: localStorage.getItem('cft4_lockedNf') || '',
  lockEndereco: localStorage.getItem('cft4_lockEndereco') === 'true',
  lockedEndereco: localStorage.getItem('cft4_lockedEndereco') || '',
  formData: {
    ...INITIAL_FORM_DATA,
    ...JSON.parse(localStorage.getItem('cft4_formData') || '{}'),
  },

  setMode: (mode) => {
    localStorage.setItem('cft4_mode', mode);
    set({ currentMode: mode });
  },
  updateRegistro: (id, updates) => set(state => {
    const newRegs = state.registros.map(r => r.id === id ? { ...r, ...updates, wasEdited: true, editedAt: new Date().toISOString() } : r);
    save(newRegs);
    return { registros: newRegs };
  }),
  setProcesso: (p) => {
    localStorage.setItem('cft4_processo', p);
    set({ processo: p });
  },
  setConferente: (c) => {
    localStorage.setItem('cft4_conferente', c);
    set({ conferente: c });
  },
  setSearchQuery: (q) => {
    localStorage.setItem('cft4_searchQuery', q);
    set({ searchQuery: q });
  },
  setSortBy: (s) => {
    localStorage.setItem('cft4_sortBy', s);
    set({ sortBy: s });
  },
  setLockProcesso: (lock) => {
    localStorage.setItem('cft4_lockProcesso', String(lock));
    set({ lockProcesso: lock });
  },
  setLockedProcesso: (p) => {
    localStorage.setItem('cft4_lockedProcesso', p);
    set({ lockedProcesso: p });
  },
  setLockNf: (lock) => {
    localStorage.setItem('cft4_lockNf', String(lock));
    set({ lockNf: lock });
  },
  setLockedNf: (n) => {
    localStorage.setItem('cft4_lockedNf', n);
    set({ lockedNf: n });
  },
  setLockEndereco: (lock) => {
    localStorage.setItem('cft4_lockEndereco', String(lock));
    set({ lockEndereco: lock });
  },
  setLockedEndereco: (e) => {
    localStorage.setItem('cft4_lockedEndereco', e);
    set({ lockedEndereco: e });
  },
  setFormData: (updates) => set(state => {
    const newData = { ...state.formData, ...updates };
    localStorage.setItem('cft4_formData', JSON.stringify(newData));
    return { formData: newData };
  }),
  resetFormData: () => {
    const newData = { ...INITIAL_FORM_DATA };
    // Preservar valores travados se necessário
    const state = get();
    if (state.lockNf) newData.nf = state.lockedNf;
    if (state.lockEndereco) newData.endereco = state.lockedEndereco;
    
    localStorage.setItem('cft4_formData', JSON.stringify(newData));
    set({ formData: newData });
  },
  resetMotorFormData: () => {
    const state = get();
    const newData = { 
      ...state.formData,
      motorModelo: '',
      motorNf: '',
      motorSerie: '',
      motorTemCaixa: false,
      motorCaixaNum: '1',
    };
    localStorage.setItem('cft4_formData', JSON.stringify(newData));
    set({ formData: newData });
  },

  addRegistro: (reg) => set(state => {
    const newRegs = [...state.registros, reg];
    save(newRegs);
    // Track session start time on first registro
    let sessionStartedAt = state.sessionStartedAt;
    if (!sessionStartedAt && state.registros.length === 0) {
      sessionStartedAt = new Date().toISOString();
      try { localStorage.setItem(SESSION_START_KEY, sessionStartedAt); } catch {}
    }
    return { registros: newRegs, sessionStartedAt };
  }),

  deleteRegistro: (id) => set(state => {
    const idx = state.registros.findIndex(r => r.id === id);
    if (idx === -1) return state;
    const reg = state.registros[idx];
    const newRegs = [...state.registros];
    newRegs.splice(idx, 1);
    save(newRegs);
    return { registros: newRegs, undoStack: [...state.undoStack, { reg, idx }] };
  }),

  undo: () => {
    const state = get();
    if (!state.undoStack.length) return null;
    const last = state.undoStack[state.undoStack.length - 1];
    const newRegs = [...state.registros];
    newRegs.splice(last.idx, 0, last.reg);
    save(newRegs);
    set({ registros: newRegs, undoStack: state.undoStack.slice(0, -1) });
    return last.reg;
  },

  clearAll: () => {
    save([]);
    try { localStorage.removeItem(SESSION_START_KEY); } catch {}
    set({ registros: [], undoStack: [], sessionStartedAt: null });
  },

  archiveAndClear: async (name: string) => {
    const state = get();
    if (!state.registros.length) return;

    const finishedAt = new Date().toISOString();
    const startedAt = state.sessionStartedAt || finishedAt;

    try {
      // 1. First insert the conference
      const { data: conf, error: confError } = await supabase
        .from('conferences')
        .insert({
          processo: state.processo.trim() || name,
          conferente: state.conferente,
          started_at: startedAt,
          finished_at: finishedAt,
        } as any)
        .select()
        .single();

      if (confError) throw confError;

      // 2. Prepare and insert records
      const rows = state.registros.map(r => ({
        id: r.id,
        conference_id: conf.id,
        item: r.item,
        m2: r.m2,
        m_linear: r.mLinear,
        largura: r.largura,
        endereco: r.endereco,
        nf: r.nf || '',
        lote: r.lote,
        lote_sistema: r.loteSistema,
        tipo_tecido: r.tipoTecido || '',
        modo_origem: r.modoOrigem || state.currentMode,
        was_edited: r.wasEdited || false,
        edited_by: r.editedBy || '',
        edited_at: r.editedAt || null,
        quantidade: r.quantidade || null,
      }));

      const { data: insertedRegs, error: regError } = await supabase.from('registros').insert(rows as any).select();
      if (regError) throw regError;

      // 3. Update stock positions efficiently
      const validEnderecos = (insertedRegs || [])
        .map(r => ({ r, parsed: parseEndereco(r.endereco) }))
        .filter(x => x.parsed !== null);

      if (validEnderecos.length > 0) {
        // Collect all structures we need to check
        const structures = [...new Set(validEnderecos.map(x => x.parsed!.estrutura))];
        
        // Fetch all occupied positions for these structures at once
        const { data: dbOccupied } = await supabase
          .from('estoque_posicoes')
          .select('estrutura, coluna, nivel, posicao')
          .in('estrutura', structures)
          .neq('status', 'saida')
          .neq('status', 'livre');

        // Map for quick lookup: cellKey -> Set of occupied positions
        const occupiedMap: Record<string, Set<number>> = {};
        (dbOccupied || []).forEach(p => {
          const key = `${p.estrutura}.${p.coluna}.${p.nivel}`;
          if (!occupiedMap[key]) occupiedMap[key] = new Set();
          occupiedMap[key].add(p.posicao);
        });

        const estoqueRows: any[] = [];
        for (const { r, parsed } of validEnderecos) {
          const { estrutura, coluna, nivel } = parsed!;
          const cellKey = `${estrutura}.${coluna}.${nivel}`;
          
          if (!occupiedMap[cellKey]) occupiedMap[cellKey] = new Set();
          
          let pos = 1;
          while (pos <= 30 && occupiedMap[cellKey].has(pos)) {
            pos++;
          }

          if (pos <= 30) {
            occupiedMap[cellKey].add(pos);
            const original = state.registros.find(orig => orig.id === r.id);
            const proc = original?.processo || state.processo || '';

            estoqueRows.push({
              estrutura,
              coluna,
              nivel,
              posicao: pos,
              status: 'ocupado',
              registro_id: r.id,
              item: r.item,
              proc: proc,
              m2: r.m2,
              largura: r.largura,
              m_linear: r.m_linear,
              lote: r.lote,
              endereco: r.endereco,
              lote_sistema: r.lote_sistema,
              conferente_saida: '',
              data_registro: new Date().toISOString(),
            });
          }
        }

        if (estoqueRows.length > 0) {
          const { error: estoqueError } = await supabase
            .from('estoque_posicoes')
            .upsert(estoqueRows, { onConflict: 'estrutura,coluna,nivel,posicao' });
          
          if (estoqueError) {
            console.error('Error populating estoque_posicoes:', estoqueError);
          }
        }
      }

      // 4. Success: clear state
      save([]);
      try { localStorage.removeItem(SESSION_START_KEY); } catch {}
      set({ registros: [], undoStack: [], sessionStartedAt: null });
      await get().loadHistory();
      
    } catch (e) {
      console.error('Error archiving:', e);
      // Don't clear local state on error, allow user to retry
      throw e; 
    }
  },

  loadHistory: async () => {
    try {
      // Fetch both conferences and records in a single fetch using Supabase join
      const { data: confs, error } = await supabase
        .from('conferences')
        .select(`
          *,
          registros (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const history: Conference[] = (confs || []).map(c => ({
        id: c.id,
        name: c.processo,
        processo: c.processo,
        conferente: c.conferente,
        date: c.created_at,
        startedAt: (c as any).started_at || null,
        finishedAt: (c as any).finished_at || null,
        registros: ((c as any).registros || [])
          .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
          .map((r: any) => ({
            id: r.id,
            item: r.item,
            processo: r.modo_origem === 'diversos' ? '' : c.processo,
            nf: (r as any).nf || '',
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
            quantidade: (r as any).quantidade || undefined,
          })),
      }));

      set({ history });
    } catch (e) {
      console.error('Error loading history:', e);
    }
  },

  deleteConference: async (id: string) => {
    try {
      await supabase.from('registros').delete().eq('conference_id', id);
      await supabase.from('conferences').delete().eq('id', id);
      await get().loadHistory();
    } catch (e) {
      console.error('Error deleting conference:', e);
    }
  },

  clearHistory: async () => {
    try {
      await supabase.from('registros').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('conferences').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      set({ history: [] });
    } catch (e) {
      console.error('Error clearing history:', e);
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
      const normalizedProcesso = merged.modoOrigem === 'diversos' || current.modoOrigem === 'diversos'
        ? ''
        : (merged.processo ?? current.processo ?? conference.processo);
      const normalizedEndereco = merged.endereco || '';
      const normalizedItem = (merged.item || '').trim();
      const normalizedNf = (merged.nf || '').trim();
      const editedBy = state.conferente || merged.editedBy || '';
      const editedAt = new Date().toISOString();
      const siblingRegistros = conference.registros.filter(r => r.id !== registroId);
      const loteSistema = generateLoteSistema(normalizedProcesso, normalizedEndereco, normalizedML, siblingRegistros as Registro[], normalizedNf, normalizedItem);

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
      };

      const { error } = await supabase
        .from('registros')
        .update(payload as any)
        .eq('id', registroId)
        .eq('conference_id', conferenceId);

      if (error) throw error;

      const history = state.history.map(conf => conf.id !== conferenceId ? conf : {
        ...conf,
        registros: conf.registros.map(r => r.id !== registroId ? r : {
          ...r,
          item: normalizedItem,
          processo: normalizedProcesso,
          nf: normalizedNf,
          m2: normalizedM2,
          mLinear: normalizedML,
          largura: normalizedLargura,
          endereco: normalizedEndereco,
          lote: merged.lote || '',
          loteSistema,
          tipoTecido: merged.tipoTecido || '',
          modoOrigem: merged.modoOrigem || current.modoOrigem || '',
          wasEdited: true,
          editedBy,
          editedAt,
        }),
      });

      set({ history });
    } catch (e) {
      console.error('Error updating registro:', e);
      throw e;
    }
  },

  loadFromStorage: () => {
    try {
      const d = localStorage.getItem(STORAGE_KEY);
      if (d) {
        const registros: Registro[] = JSON.parse(d);
        set({ registros });
      }
    } catch {}
  },
}));
