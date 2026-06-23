import { forwardRef, useEffect, useImperativeHandle, useRef, KeyboardEvent } from 'react';
import { cn } from '@/lib/utils';

interface ScannerInputProps {
  value: string;
  onChange: (v: string) => void;
  onScan: (code: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** Em tablet, manter foco mesmo após modais/toasts/troca de aba. */
  autoRefocus?: boolean;
  /** Suprimir teclado virtual (scanner bluetooth = teclado externo). */
  suppressVirtualKeyboard?: boolean;
  'aria-label'?: string;
}

export interface ScannerInputHandle {
  focus: () => void;
  clear: () => void;
}

/**
 * Input de bipagem otimizado para tablet em fábrica:
 * - Altura 56px (h-14), font-mono, fundo levemente destacado.
 * - Refocus automático ao voltar para a janela.
 * - inputMode="none" para não abrir teclado virtual.
 * - Enter (do scanner) dispara onScan.
 */
const ScannerInput = forwardRef<ScannerInputHandle, ScannerInputProps>(function ScannerInput(
  {
    value,
    onChange,
    onScan,
    placeholder = 'Aguardando leitura do scanner...',
    disabled,
    className,
    autoRefocus = true,
    suppressVirtualKeyboard = false,
    ...rest
  },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    clear: () => onChange(''),
  }), [onChange]);

  useEffect(() => {
    if (!autoRefocus) return;
    const refocus = () => {
      window.setTimeout(() => inputRef.current?.focus(), 80);
    };
    window.addEventListener('focus', refocus);
    document.addEventListener('visibilitychange', refocus);
    return () => {
      window.removeEventListener('focus', refocus);
      document.removeEventListener('visibilitychange', refocus);
    };
  }, [autoRefocus]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = value.trim();
      if (code) onScan(code);
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      autoFocus
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck={false}
      inputMode={suppressVirtualKeyboard ? 'none' : undefined}
      aria-label={rest['aria-label'] ?? 'Campo de bipagem'}
      className={cn(
        'w-full h-14 rounded-md border-2 border-primary/30 bg-primary/5',
        'px-4 text-lg font-mono text-foreground placeholder:text-muted-foreground',
        'focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
    />
  );
});

export default ScannerInput;
