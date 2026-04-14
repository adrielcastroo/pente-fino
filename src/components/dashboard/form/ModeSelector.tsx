import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Zap, SquarePen, Layers3, Package, Sparkles } from 'lucide-react';
import { memo } from 'react';
import { AppMode } from '@/types';

interface ModeSelectorProps {
  currentMode: AppMode;
  onModeChange: (mode: AppMode) => void;
  isLow: boolean;
  allowedModes?: string[];
}

const MODES = [
  { id: 'openrouter', label: 'AI Vision', icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { id: 'manual', label: 'Manual', icon: SquarePen, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' },
  { id: 'diversos', label: 'Diversos', icon: Layers3, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  { id: 'madeira', label: 'Madeira', icon: Package, color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/20' },
] as const;

export const ModeSelector = memo(({ currentMode, onModeChange, isLow, allowedModes }: ModeSelectorProps) => {
  const filteredModes = allowedModes ? MODES.filter(m => allowedModes.includes(m.id)) : MODES;
  const gridCols = filteredModes.length <= 1 ? 'grid-cols-1' : filteredModes.length === 2 ? 'grid-cols-2' : filteredModes.length === 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4';
  
  if (filteredModes.length <= 1) return null;

  return (
    <div className={`grid ${gridCols} gap-2 px-1.5 pt-1 mb-6`}>
      {MODES.map((mode) => {
        const Icon = mode.icon;
        const isActive = currentMode === mode.id;
        
        return (
          <Tooltip key={mode.id}>
            <TooltipTrigger asChild>
              <Button
                variant={isActive ? 'default' : 'outline'}
                onClick={() => onModeChange(mode.id as AppMode)}
                className={`relative h-12 rounded-xl flex items-center justify-center gap-2 group transition-all duration-500 border-none ${
                  isActive ? `ring-2 ring-primary/20 shadow-lg shadow-primary/5` : 'bg-muted/30 hover:bg-muted/50'
                }`}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-primary/10 rounded-xl blur-lg animate-pulse" />
                )}
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${isActive ? 'text-primary-foreground' : mode.color}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                  {mode.label}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{mode.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
});

ModeSelector.displayName = 'ModeSelector';
