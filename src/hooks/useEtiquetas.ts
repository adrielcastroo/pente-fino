/**
 * TanStack Query hooks para etiquetas.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { etiquetaService } from '@/services/etiquetaService';
import { printZplLabelsInBrowser } from '@/services/printService';
import { useAppStore } from '@/store/useAppStore';
import type { CreateEtiquetaTemplateInput, ImprimirInput } from '@/types/etiquetas';

export const etiquetaQueryKeys = {
  all: ['etiquetas'] as const,
  lists: () => [...etiquetaQueryKeys.all, 'list'] as const,
  list: (filtro: { categoria?: string }) => [...etiquetaQueryKeys.lists(), filtro] as const,
  detail: (id: string) => [...etiquetaQueryKeys.all, 'detail', id] as const,
  historico: (filtro: { templateId?: string }) => [...etiquetaQueryKeys.all, 'historico', filtro] as const,
};

export function useEtiquetas(filtro?: { categoria?: string }) {
  return useQuery({
    queryKey: etiquetaQueryKeys.list(filtro ?? {}),
    queryFn: () => etiquetaService.list(filtro),
    staleTime: 2 * 60 * 1000,
  });
}

export function useEtiqueta(id: string | undefined) {
  return useQuery({
    queryKey: etiquetaQueryKeys.detail(id ?? ''),
    queryFn: () => etiquetaService.getById(id!),
    enabled: !!id,
  });
}

export function useEtiquetaHistorico(filtro?: { templateId?: string }) {
  return useQuery({
    queryKey: etiquetaQueryKeys.historico(filtro ?? {}),
    queryFn: () => etiquetaService.getHistorico(filtro),
    staleTime: 30 * 1000,
  });
}

/**
 * Impressão da etiqueta ZPL via navegador usando o MESMO pipeline direto do
 * módulo de estoque (React → iframe, sem conversão para PNG). Isso garante
 * que 100% dos elementos definidos no template (textos, códigos, QR, boxes,
 * linhas, logo) sejam impressos exatamente como aparecem no preview — sem
 * tirar nem adicionar nada. Ajustes finos (offset X/Y, borda, padding) vêm
 * do LabelSettings, aba "Expedição (ZPL)".
 */
async function imprimirNavegador(
  zplFinal: string,
  variaveis: Record<string, string>,
  quantidade: number,
  dimensoes: { largura: number; altura: number },
  templateNome: string,
): Promise<void> {
  const labelSettings = useAppStore.getState().labelSettings;
  await printZplLabelsInBrowser(
    zplFinal,
    variaveis,
    dimensoes,
    Math.max(1, quantidade),
    labelSettings,
    `Etiqueta · ${templateNome}`,
  );
}


export function useImprimirEtiqueta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, variaveis, quantidade, impressora }: ImprimirInput) => {
      const template = await etiquetaService.getById(templateId);
      if (!template) throw new Error('Template não encontrado');
      const zplFinal = etiquetaService.renderZPL(template.zpl, variaveis);
      await imprimirNavegador(zplFinal, variaveis, quantidade, template.dimensoes, template.nome);
      await etiquetaService.registrarImpressao({
        templateId,
        template_nome: template.nome,
        variaveis,
        quantidade,
        impressora,
      });
      return { success: true, zpl: zplFinal };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: etiquetaQueryKeys.historico({}) });
      toast.success('Etiqueta(s) enviada(s) para impressão');
    },
    onError: (e: Error) => toast.error(`Erro ao imprimir: ${e.message}`),
  });
}

export function useCriarTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateEtiquetaTemplateInput) => etiquetaService.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: etiquetaQueryKeys.lists() });
      toast.success('Template criado');
    },
    onError: (e: Error) => toast.error(`Erro ao criar: ${e.message}`),
  });
}

export function useAtualizarTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateEtiquetaTemplateInput> }) =>
      etiquetaService.update(id, data),
    onSuccess: (t) => {
      qc.invalidateQueries({ queryKey: etiquetaQueryKeys.lists() });
      qc.invalidateQueries({ queryKey: etiquetaQueryKeys.detail(t.id) });
      toast.success('Template atualizado');
    },
    onError: (e: Error) => toast.error(`Erro ao atualizar: ${e.message}`),
  });
}

export function useDuplicarTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => etiquetaService.duplicate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: etiquetaQueryKeys.lists() });
      toast.success('Template duplicado');
    },
    onError: (e: Error) => toast.error(`Erro ao duplicar: ${e.message}`),
  });
}

export function useDeletarTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => etiquetaService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: etiquetaQueryKeys.lists() });
      toast.success('Template excluído');
    },
    onError: (e: Error) => toast.error(`Erro ao excluir: ${e.message}`),
  });
}
