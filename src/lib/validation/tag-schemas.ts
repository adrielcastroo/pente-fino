import { z } from 'zod';

/**
 * Validates the response from the Auge Sync "tag_custom_por_config" action.
 */
export const AugeTagCustomSchema = z.object({
  cdConfiguracao: z.string(),
  nmConfiguracao: z.string().nullable(),
  nmTagCustomizada: z.string().nullable(),
  dsTagCustomizada: z.string().nullable(),
  dsTagCalculada: z.string().nullable(),
  dsTagTexto: z.string().nullable(),
  cdTagCustomizada: z.string().nullable().optional(),
  cdTagCalculada: z.string().nullable().optional(),
});

export type AugeTagCustom = z.infer<typeof AugeTagCustomSchema>;

/**
 * Schema for creating or updating a custom tag.
 */
export const UpsertTagCustomSchema = z.object({
  cdConfiguracao: z.string(),
  nmTagCustomizada: z.string(),
  dsTagTexto: z.string().optional(),
  cdTagCustomizada: z.string().optional(),
  cdTagCalculada: z.string().optional(),
  idAcao: z.number().int().min(1).max(3), // 1: Insert, 2: Update, 3: Delete duplicate
});

export type UpsertTagCustom = z.infer<typeof UpsertTagCustomSchema>;
