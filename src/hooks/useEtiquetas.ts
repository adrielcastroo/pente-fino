/**
 * TanStack Query hooks para etiquetas.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import { etiquetaService } from '@/services/etiquetaService';
import { ZPLPreview } from '@/components/etiquetas/ZPLPreview';
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

async function imprimirNavegador(
  zplFinal: string,
  variaveis: Record<string, string>,
  quantidade: number,
  dimensoes: { largura: number; altura: number },
): Promise<void> {
  const w = window.open('', '_blank', 'width=600,height=800');
  if (!w) throw new Error('Popup bloqueado. Libere popups para imprimir.');

  // Renderiza o preview visual fiel (mesmo engine do editor) para cada cópia.
  const previewMarkup = renderToStaticMarkup(
    createElement(ZPLPreview, { zpl: zplFinal, variaveis, dimensoes }),
  );
  const copies = Array.from({ length: Math.max(1, quantidade) })
    .map(() => `<div class="label">${previewMarkup}</div>`)
    .join('');

  w.document.write(`<!doctype html><html><head><title>Etiqueta</title>
    <style>
      @page { size: ${dimensoes.largura}mm ${dimensoes.altura}mm; margin: 0; }
      html, body { margin: 0; padding: 0; background: #fff; color: #000; }
      .label {
        width: ${dimensoes.largura}mm;
        height: ${dimensoes.altura}mm;
        page-break-after: always;
        overflow: hidden;
        background: #fff;
      }
      .label:last-child { page-break-after: auto; }
      .label > div { width: 100%; height: 100%; }
      svg { width: 100%; height: 100%; display: block; }
    </style></head><body>${copies}<script>window.onload=()=>{window.focus();window.print();setTimeout(()=>window.close(),500)}</script></body></html>`);
  w.document.close();
}

export function useImprimirEtiqueta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, variaveis, quantidade, impressora }: ImprimirInput) => {
      const template = await etiquetaService.getById(templateId);
      if (!template) throw new Error('Template não encontrado');
      const zplFinal = etiquetaService.renderZPL(template.zpl, variaveis);
      await imprimirNavegador(zplFinal, variaveis, quantidade, template.dimensoes);
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
