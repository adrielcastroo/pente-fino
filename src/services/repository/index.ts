import { supabase } from '@/integrations/supabase/client';
import { Registro } from '@/types';

/**
 * Base repository for Supabase operations.
 * Centralizes common query patterns and error handling.
 */
export class BaseRepository {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  protected client() {
    return supabase.from(this.tableName as any);
  }
}

/**
 * Repository for managing inventory registries (registros).
 */
export class RegistroRepository extends BaseRepository {
  constructor() {
    super('registros');
  }

  async findByConference(conferenceId: string) {
    const { data, error } = await this.client()
      .select('*')
      .eq('conference_id', conferenceId);
    
    if (error) throw error;
    return (data as any) as Registro[];
  }

  async upsertMany(registros: Partial<Registro>[]) {
    const { data, error } = await this.client()
      .upsert(registros);
    
    if (error) throw error;
    return data;
  }
}

export const registroRepo = new RegistroRepository();
