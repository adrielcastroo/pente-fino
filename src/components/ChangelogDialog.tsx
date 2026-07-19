import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Sparkles, Wrench, Zap } from 'lucide-react';
import { CHANGELOG, LATEST_VERSION, CHANGELOG_STORAGE_KEY, type ChangelogEntry } from '@/lib/changelog';
import { cn } from '@/lib/utils';

const TYPE_META: Record<ChangelogEntry['highlights'][number]['type'], { label: string; icon: typeof Sparkles; className: string }> = {
  feature: { label: 'Novo', icon: Sparkles, className: 'bg-primary/10 text-primary' },
  improvement: { label: 'Melhoria', icon: Zap, className: 'bg-amber-500/10 text-warning dark:text-warning' },
  fix: { label: 'Correção', icon: Wrench, className: 'bg-emerald-500/10 text-success dark:text-success' },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function ChangelogDialog() {
  const [open, setOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);

  useEffect(() => {
    try {
      const lastSeen = localStorage.getItem(CHANGELOG_STORAGE_KEY);
      setHasNew(lastSeen !== LATEST_VERSION);
    } catch {
      /* ignore */
    }
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && hasNew) {
      try {
        localStorage.setItem(CHANGELOG_STORAGE_KEY, LATEST_VERSION);
      } catch {
        /* ignore */
      }
      setHasNew(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => handleOpenChange(true)}
        aria-label={hasNew ? 'Ver novidades do sistema (atualizações disponíveis)' : 'Ver histórico de atualizações'}
        className="relative"
      >
        <Bell className="w-4 h-4" />
        {hasNew && (
          <span
            className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full ring-2 ring-background"
            aria-hidden="true"
          />
        )}
      </Button>

      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Novidades & Atualizações
          </DialogTitle>
          <DialogDescription>
            Acompanhe melhorias, correções e novas funcionalidades do Pente Fino.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-6">
          {CHANGELOG.map((entry, idx) => (
            <article key={entry.version} className="relative">
              <header className="flex items-baseline gap-3 mb-3 pb-2 border-b border-border/40">
                <h3 className="text-lg font-semibold text-foreground">v{entry.version}</h3>
                {idx === 0 && (
                  <Badge className="bg-primary text-primary-foreground font-bold text-[10px] uppercase tracking-wider">
                    Mais recente
                  </Badge>
                )}
                <span className="ml-auto text-xs text-muted-foreground font-semibold">{formatDate(entry.date)}</span>
              </header>
              <ul className="space-y-2">
                {entry.highlights.map((h, i) => {
                  const meta = TYPE_META[h.type];
                  const Icon = meta.icon;
                  return (
                    <li key={i} className="flex items-start gap-3 text-sm">
                      <Badge
                        className={cn(
                          'shrink-0 gap-1 font-bold text-[10px] uppercase tracking-wider border-none mt-0.5 min-w-[78px] justify-center',
                          meta.className,
                        )}
                      >
                        <Icon className="w-3 h-3" />
                        {meta.label}
                      </Badge>
                      <span className="text-foreground/90 leading-relaxed">{h.text}</span>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ChangelogDialog;
