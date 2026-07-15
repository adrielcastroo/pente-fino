/**
 * TanStack Query hooks para etiquetas.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { etiquetaService } from '@/services/etiquetaService';
import { printImagesInBrowser } from '@/services/printService';
import { renderZplLabel } from '@/services/labelRenderer';
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
 * Impressão da etiqueta ZPL via navegador usando o MESMO pipeline PNG do
 * módulo de estoque: renderiza o `ZPLPreview` offscreen → converte para PNG
 * (html-to-image, fontes embutidas) → imprime em iframe oculto com `@page`
 * do tamanho físico da etiqueta. Isso preserva 100% dos elementos do preview
 * e é o método já validado em produção. Ajustes finos (offset X/Y, borda,
 * padding) vêm do LabelSettings, aba "Expedição (ZPL)".
 */
async function imprimirNavegador(
  zplRaw: string,
  variaveis: Record<string, string>,
  quantidade: number,
  dimensoes: { largura: number; altura: number },
  templateNome: string,
  logoUrl?: string,
): Promise<void> {
  const labelSettings = useAppStore.getState().labelSettings;
  // Passa o ZPL BRUTO (com placeholders {{...}}) — o ZPLPreview interpola as
  // variáveis internamente e também detecta o marcador {{logo}} para renderizar
  // a imagem. Se pré-substituíssemos aqui, o {{logo}} sumiria e a logo não
  // apareceria na impressão real.
  const rendered = await renderZplLabel(zplRaw, variaveis, dimensoes, labelSettings, { logoUrl });
  const copies = Math.max(1, quantidade);
  await printImagesInBrowser(
    rendered.dataUrl,
    rendered.widthMm,
    rendered.heightMm,
    copies,
    `Etiqueta · ${templateNome}`,
  );
}


const LOGO_VAR_KEY = '__logo_src__';

export function useImprimirEtiqueta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, variaveis, quantidade, impressora }: ImprimirInput) => {
      const template = await etiquetaService.getById(templateId);
      if (!template) throw new Error('Template não encontrado');

      // Mescla padrões do template com valores fornecidos: o operador nem
      // sempre digita todas as variáveis, e os defaults (`padrao`) definidos
      // no modelo precisam sair na impressão real — não só no preview.
      const defaults: Record<string, string> = {};
      let logoUrl: string | undefined;
      for (const v of template.variaveis) {
        if (v.chave === LOGO_VAR_KEY) {
          if (v.padrao) logoUrl = v.padrao;
          continue;
        }
        if (v.padrao && v.padrao !== '{{hoje}}') defaults[v.chave] = v.padrao;
      }
      // Fallback: logo salva no localStorage antigo do editor.
      if (!logoUrl && typeof localStorage !== 'undefined') {
        logoUrl = localStorage.getItem(`etiqueta-logo-${templateId}`) || undefined;
      }
      const filledVars: Record<string, string> = { ...defaults };
      for (const [k, v] of Object.entries(variaveis || {})) {
        if (v !== undefined && v !== '') filledVars[k] = v;
      }

      const zplFinal = etiquetaService.renderZPL(template.zpl, filledVars);
      await imprimirNavegador(template.zpl, filledVars, quantidade, template.dimensoes, template.nome, logoUrl);
      await etiquetaService.registrarImpressao({
        templateId,
        template_nome: template.nome,
        variaveis: filledVars,
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
