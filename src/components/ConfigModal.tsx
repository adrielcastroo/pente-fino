import { useState } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfigModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  
  const [orKey, setOrKey] = useState(localStorage.getItem('cft4_or_key') || '');
  const [orModel, setOrModel] = useState(localStorage.getItem('cft4_or_model') || 'anthropic/claude-3-haiku');

  const saveOR = () => {
    if (!orKey.trim()) { toast.error('Insira uma chave válida.'); return; }
    localStorage.setItem('cft4_or_key', orKey.trim());
    toast.success('Chave OpenRouter salva!');
    setTimeout(onClose, 800);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-[200] flex items-center justify-center"
          onClick={e => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="surface-bg rounded-2xl p-7 w-[520px] max-w-[92vw] shadow-2xl"
          >
            <h2 className="text-base font-semibold mb-4">⚙️ Configuração da API</h2>

            {/* OpenRouter */}
            <div className="surface-2-bg border border-border rounded-xl p-4 mb-3">
              <div className="flex items-center justify-between mb-2.5">
                <div>
                  <div className="font-semibold text-sm">⚡ OpenRouter</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    Claude, GPT-4o e outros · <a href="https://openrouter.ai/keys" target="_blank" rel="noopener" className="text-primary hover:underline">openrouter.ai</a>
                  </div>
                </div>
                <span className={`text-[11px] px-2 py-0.5 rounded ${orKey ? 'bg-primary/15 text-primary' : 'surface-3-bg text-muted-foreground'}`}>
                  {orKey ? '✓ configurado' : 'não configurado'}
                </span>
              </div>
              <div className="flex gap-2">
                <input
                  type="password" value={orKey} onChange={e => setOrKey(e.target.value)}
                  placeholder="sk-or-v1-…"
                  className="flex-1 border border-border rounded-lg px-3 py-2 text-sm font-mono bg-surface outline-none focus:border-primary transition-colors"
                />
                <button onClick={saveOR} className="navy-3-bg text-primary-foreground rounded-lg px-3 py-2 text-xs font-medium hover:opacity-90 transition-opacity">Salvar</button>
              </div>
              <select
                value={orModel}
                onChange={e => { setOrModel(e.target.value); localStorage.setItem('cft4_or_model', e.target.value); toast.success('Modelo OR: ' + e.target.value.split('/').pop()); }}
                className="w-full mt-2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground bg-surface outline-none cursor-pointer"
              >
                <option value="anthropic/claude-3-haiku">Claude 3 Haiku — rápido</option>
                <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet — preciso</option>
                <option value="openai/gpt-4o-mini">GPT-4o Mini — rápido</option>
                <option value="openai/gpt-4o">GPT-4o — máxima precisão</option>
              </select>
            </div>

            <div className="surface-2-bg border border-border rounded-lg px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
              💡 Leitura automática disponível somente via <b>OpenRouter</b>.
            </div>

            <div className="h-px bg-border my-4" />
            <button onClick={onClose} className="w-full border border-border rounded-lg py-2 text-sm hover:bg-surface-2 transition-colors">Fechar</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
