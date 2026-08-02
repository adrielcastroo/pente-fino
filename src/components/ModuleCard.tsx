import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleCardProps {
  index: number;
  title: string;
  icon: LucideIcon;
  statusText: string;
  hasWarning?: boolean;
  isActive?: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  ariaLabel: string;
}

export function ModuleCard({
  index,
  title,
  icon: Icon,
  statusText,
  hasWarning,
  isActive,
  onClick,
  onMouseEnter,
  ariaLabel
}: ModuleCardProps) {
  return (
    <div
      role="listitem"
      className="contents"
    >
      <button
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        aria-label={ariaLabel}
        className={cn(
          "flex flex-col min-h-[168px] p-[1.375rem] bg-card border border-border rounded-md transition-all duration-100 text-left relative group",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          isActive && "border-primary ring-1 ring-primary/50",
          "hover:border-primary/45",
          "active:bg-secondary",
          // Mobile adjustments
          "max-md:min-h-[200px] max-md:p-6"
        )}
      >
        <div className="flex items-center justify-between w-full">
          <div className={cn(
            "rounded-md bg-primary/10 text-primary grid place-items-center shrink-0",
            "w-[44px] h-[44px]",
            "max-md:w-[52px] max-md:h-[52px]"
          )}>
            <Icon className="w-6 h-6 max-md:w-7 max-md:h-7" />
          </div>
          
          <div className={cn(
            "w-[30px] h-[30px] rounded-[6px] border border-border bg-secondary font-mono text-[15px] font-bold text-muted-foreground grid place-items-center",
            "max-md:hidden", // Hide on touch/mobile
            isActive && "text-primary border-primary/50 bg-primary/8"
          )}>
            {index}
          </div>
        </div>

        <h3 className="mt-4 text-[1.1875rem] font-semibold tracking-tight max-md:text-[1.375rem]">
          {title}
        </h3>

        <div className="mt-auto pt-4 flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {hasWarning && (
              <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
            )}
            <span className={cn(
              "text-[13px] font-medium",
              hasWarning ? "text-warning" : "text-muted-foreground"
            )}>
              {statusText}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-[13px] font-semibold text-primary" aria-hidden="true">
            Entrar <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </button>
    </div>
  );
}
