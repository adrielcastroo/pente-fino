import { memo } from 'react';
import { ZPLPreview } from './ZPLPreview';

interface LiveZPLPreviewProps {
  zpl: string;
  valores: Record<string, string>;
  dimensoes?: { largura: number; altura: number };
  className?: string;
}

export const LiveZPLPreview = memo(function LiveZPLPreview({ zpl, valores, dimensoes, className }: LiveZPLPreviewProps) {
  return <ZPLPreview zpl={zpl} variaveis={valores} dimensoes={dimensoes} className={className} />;
});
LiveZPLPreview.displayName = 'LiveZPLPreview';
