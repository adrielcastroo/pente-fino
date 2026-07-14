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

async function imprimirNavegador(zplRenderizado: string, quantidade: number, dimensoes: { largura: number; altura: number }): Promise<void> {
  // Renderização visual simples do ZPL para impressão via navegador.
  const w = window.open('', '_blank', 'width=600,height=800');
  if (!w) throw new Error('Popup bloqueado. Libere popups para imprimir.');
  const zplToHtml = (zpl: string): string => {
    const items: string[] = [];
    const re = /\^FO(\d+),(\d+)\^(?:A0N,(\d+),\d+|BY\d+\^BC[^^]*)\^FD([^^]+)\^FS/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(zpl)) !== null) {
      const [, x, y, size, text] = m;
      items.push(
        `<div style="position:absolute;left:${x}px;top:${y}px;font-size:${size ?? 24}px;font-family:monospace;color:#000">${text}</div>`,
      );
    }
    return items.join('');
  };
  const body = zplToHtml(zplRenderizado);
  const copies = Array.from({ length: quantidade }).map(() => `
    <div class="label">${body}</div>
  `).join('');
  w.document.write(`<!doctype html><html><head><title>Etiqueta</title>
    <style>
      @page { size: ${dimensoes.largura}mm ${dimensoes.altura}mm; margin: 0; }
      html, body { margin: 0; padding: 0; background: #fff; color: #000; }
      .label { position: relative; width: ${dimensoes.largura}mm; height: ${dimensoes.altura}mm; page-break-after: always; overflow: hidden; }
    </style></head><body>${copies}<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),400)}</script></body></html>`);
  w.document.close();
}

export function useImprimirEtiqueta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ templateId, variaveis, quantidade, impressora }: ImprimirInput) => {
      const template = await etiquetaService.getById(templateId);
      if (!template) throw new Error('Template não encontrado');
      const zplFinal = etiquetaService.renderZPL(template.zpl, variaveis);
      await imprimirNavegador(zplFinal, quantidade, template.dimensoes);
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
