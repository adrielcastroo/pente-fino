import { z } from 'zod';

/**
 * Shared registry schema.
 */
export const RegistroSchema = z.object({
  id: z.string().uuid(),
  item: z.string(),
  processo: z.string().optional().nullable(),
  nf: z.string().optional().nullable(),
  m2: z.number().optional().nullable(),
  lote: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  mLinear: z.number().optional().nullable(),
  loteSistema: z.string().optional().nullable(),
  conferente: z.string().optional().nullable(),
  finished_at: z.string().optional().nullable(),
});

export type Registro = z.infer<typeof RegistroSchema>;

/**
 * Schema for Auge Sync requests.
 */
export const AugeSyncRequestSchema = z.object({
  action: z.enum(['sync_acabamentos', 'sync_acabamento_one', 'tag_custom_por_config', 'criar_tag_custom']),
  cdAcabamento: z.string().optional(),
  cdConfiguracao: z.string().optional(),
  nmConfiguracao: z.string().optional(),
});
