import { memo } from 'react';
import { ZPLPreview } from './ZPLPreview';
import { useAppStore } from '@/store/useAppStore';
import { LABEL_PX_PER_MM } from '@/components/labels/LabelTemplates';

interface LiveZPLPreviewProps {
  zpl: string;
  valores: Record<string, string>;
  dimensoes?: { largura: number; altura: number };
  className?: string;
  logoUrl?: string;
}

/**
 * LiveZPLPreview — envelopa o ZPLPreview aplicando as mesmas configurações
 * visuais (borda externa, raio, padding) usadas pelo pipeline de impressão
 * (`renderZplLabel`). Assim o preview mostrado ao operador é 100% fiel ao
 * PNG que será enviado à impressora.
 *
 * As configurações são lidas do bloco "Bordas e Linhas" (LabelLayoutPanel →
 * seção Expedição): `expedicaoBorderWidth`, `expedicaoBorderStyle`,
 * `expedicaoBorderRadius`, `expedicaoPadding`.
 */
export const LiveZPLPreview = memo(function LiveZPLPreview({
  zpl,
  valores,
  dimensoes,
  className,
  logoUrl,
}: LiveZPLPreviewProps) {
  const labelSettings = useAppStore((s) => s.labelSettings);
  const borderWidth = labelSettings.expedicaoBorderWidth ?? 0;
  const borderStyle = labelSettings.expedicaoBorderStyle ?? 'none';
  const borderRadius = labelSettings.expedicaoBorderRadius ?? 0;
  const padding = labelSettings.expedicaoPadding ?? 0;
  const offsetX = (labelSettings.expedicaoPrintOffsetXMm ?? 0) * LABEL_PX_PER_MM;
  const offsetY = (labelSettings.expedicaoPrintOffsetYMm ?? 0) * LABEL_PX_PER_MM;
  const lineThickness = labelSettings.expedicaoLineThickness ?? 2;
  const lineStyle = labelSettings.expedicaoLineStyle ?? 'solid';
  const lineColor = labelSettings.expedicaoLineColor ?? '#111';
  const fontFamily = labelSettings.expedicaoFontFamily ?? 'monospace';

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        background: '#fff',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      }}
    >
      <ZPLPreview
        zpl={zpl}
        variaveis={valores}
        dimensoes={dimensoes}
        logoUrl={logoUrl}
        lineThickness={lineThickness}
        lineStyle={lineStyle}
        lineColor={lineColor}
        fontFamily={fontFamily}
        borderWidth={borderWidth}
        borderStyle={borderStyle}
        borderRadius={borderRadius}
        padding={padding}
        offsetX={offsetX}
        offsetY={offsetY}
      />
    </div>
  );
});
LiveZPLPreview.displayName = 'LiveZPLPreview';
