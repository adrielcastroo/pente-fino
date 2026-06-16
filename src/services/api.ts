import { Registro } from '@/types';
import { conferenceService } from './conferenceService';
import { registroService } from './registroService';
import { estoqueService } from './estoqueService';
import { reservaService } from './reservaService';
import { independentReservaService } from './independentReservaService';


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
  },

  async deleteRegistro(conferenceId: string, registroId: string) {
    return registroService.deleteRegistro(conferenceId, registroId);
  },

  async insertRegistros(conferenceId: string, registros: Registro[], currentMode: string) {
    return registroService.insertRegistros(conferenceId, registros, currentMode);
  },

  async fetchReservas() {
    return independentReservaService.fetchReservas();
  },

  async addReserva(reserva: any, opts?: { isEdit?: boolean; changedField?: string | null }) {
    return independentReservaService.addReserva(reserva, opts);
  },

  async deleteReserva(id: string) {
    return independentReservaService.deleteReserva(id);
  },

  async clearReservas() {
    return independentReservaService.clearReservas();
  }
};