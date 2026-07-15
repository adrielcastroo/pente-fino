import { memo } from 'react';
import { ZPLPreview } from './ZPLPreview';
import { useAppStore } from '@/store/useAppStore';

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
  const borderCss =
    borderStyle === 'none' || borderWidth <= 0
      ? 'none'
      : `${borderWidth}px ${borderStyle} #000`;

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
        border: borderCss,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px`,
        background: '#fff',
        overflow: 'hidden',
      }}
    >
      <ZPLPreview zpl={zpl} variaveis={valores} dimensoes={dimensoes} logoUrl={logoUrl} />
    </div>
  );
});
LiveZPLPreview.displayName = 'LiveZPLPreview';
