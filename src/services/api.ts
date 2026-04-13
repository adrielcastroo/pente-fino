import { Registro } from '@/types';
import { conferenceService } from './conferenceService';
import { registroService } from './registroService';
import { estoqueService } from './estoqueService';

export const apiService = {
  async archiveConference(
    processo: string,
    conferente: string,
    startedAt: string,
    registros: Registro[],
    currentMode: string
  ) {
    const finishedAt = new Date().toISOString();
    
    // 1. Insert Conference
    const conf = await conferenceService.insertConference(processo, conferente, startedAt, finishedAt);
    
    // 2. Insert Registros
    const insertedRegs = await registroService.insertRegistros(conf.id, registros, currentMode);
    
    // 3. Process Estoque
    await estoqueService.processEstoque(insertedRegs, registros, processo, conferente);
    
    return conf;
  },

  async fetchHistory() {
    return conferenceService.fetchHistory();
  },

  async deleteConference(id: string) {
    return conferenceService.deleteConference(id);
  },

  async clearAllHistory() {
    return conferenceService.clearAllHistory();
  },

  async updateRegistro(conferenceId: string, registroId: string, payload: any) {
    return registroService.updateRegistro(conferenceId, registroId, payload);
  }
};