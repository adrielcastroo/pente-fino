import { memo, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { VARIAVEIS_INTELIGENTES } from '@/types/etiquetas';

interface AutoCompleteZPLProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  rows?: number;
}

export const AutoCompleteZPL = memo(function AutoCompleteZPL({ value, onChange, className, rows = 16 }: AutoCompleteZPLProps) {
  const [show, setShow] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '{' && el.value.charAt(el.selectionStart - 1) === '{') {
        setShow(true);
        setQuery('');
      } else if (e.key === 'Escape') {
        setShow(false);
      }
    };
    el.addEventListener('keydown', onKey);
    return () => el.removeEventListener('keydown', onKey);
  }, []);

  const insert = (chave: string) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    // remove os dois `{{` já digitados imediatamente antes do cursor
    const before = value.slice(0, Math.max(0, start - 2));
    const after = value.slice(end);
    const insertion = `{{${chave}}}`;
    const newVal = before + insertion + after;
    onChange(newVal);
    setShow(false);
    setTimeout(() => {
      el.focus();
      const pos = before.length + insertion.length;
      el.selectionStart = el.selectionEnd = pos;
    }, 0);
  };

  const filtradas = VARIAVEIS_INTELIGENTES.filter((v) =>
    !query || v.chave.includes(query.toLowerCase()) || v.label.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
        className={cn(
          'w-full font-mono text-xs p-3 rounded-md border border-input bg-background text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          className,
        )}
      />
      {show && (
        <div className="absolute z-50 left-3 bottom-3 w-72 max-h-64 overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar variável..."
            className="w-full px-2 py-1.5 text-xs bg-transparent border-b border-border outline-none"
          />
          <div className="p-1">
            {filtradas.length === 0 && <div className="px-2 py-1.5 text-xs text-muted-foreground">Nada encontrado</div>}
            {filtradas.map((v) => (
              <button
                key={v.chave}
                type="button"
                onClick={() => insert(v.chave)}
                className="w-full text-left px-2 py-1.5 rounded-sm hover:bg-accent"
              >
                <div className="font-mono text-xs text-primary">{`{{${v.chave}}}`}</div>
                <div className="text-xs text-muted-foreground">
                  {v.label} · {v.desc}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
AutoCompleteZPL.displayName = 'AutoCompleteZPL';
