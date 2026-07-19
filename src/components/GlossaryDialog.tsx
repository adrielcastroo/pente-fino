import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Search } from 'lucide-react';

interface GlossaryEntry {
  term: string;
  meaning: string;
  category: 'Geral' | 'Endereço' | 'Operação' | 'Documento' | 'Estoque';
  description?: string;
}

const GLOSSARY: GlossaryEntry[] = [
  { term: 'NF', category: 'Documento', meaning: 'Nota Fiscal', description: 'Documento fiscal de entrada/saída de mercadorias.' },
  { term: 'PROC', category: 'Documento', meaning: 'Processo', description: 'Identificador do processo de conferência.' },
  { term: 'OP', category: 'Operação', meaning: 'Ordem de Produção' },
  { term: 'TEC', category: 'Endereço', meaning: 'Tecido (prefixo de endereço)', description: 'Ex.: TEC01.A.N01 — Bloco TEC, posição 01, coluna A, nível 01.' },
  { term: 'M', category: 'Estoque', meaning: 'Madeira', description: 'Quadrantes destinados a estoque de madeira.' },
  { term: 'ML', category: 'Estoque', meaning: 'Metro Linear', description: 'Unidade usada para medir tecidos enrolados.' },
  { term: 'LARG', category: 'Estoque', meaning: 'Largura', description: 'Largura do tecido em metros.' },
  { term: 'LOTE', category: 'Estoque', meaning: 'Lote do produto', description: 'Extraído automaticamente do código de barras.' },
  { term: 'CONF', category: 'Geral', meaning: 'Conferente', description: 'Operador responsável pela bipagem da sessão.' },
  { term: 'BIP', category: 'Operação', meaning: 'Bipagem', description: 'Ato de ler o código de barras de um item.' },
  { term: 'SAÍDA', category: 'Estoque', meaning: 'Retirada de estoque', description: 'Registro de saída de tecido do endereço.' },
  { term: 'POS', category: 'Endereço', meaning: 'Posição no estoque' },
  { term: 'QTD', category: 'Geral', meaning: 'Quantidade' },
  { term: 'CAD', category: 'Geral', meaning: 'Cadastro', description: 'Cadastro mestre de itens.' },
  { term: 'HIST', category: 'Geral', meaning: 'Histórico', description: 'Conferências arquivadas.' },
  { term: 'EST', category: 'Estoque', meaning: 'Estoque' },
  { term: 'INV', category: 'Operação', meaning: 'Inventário' },
  { term: 'CTRL', category: 'Operação', meaning: 'Controle (motor/controle)' },
];

const CAT_COLOR: Record<GlossaryEntry['category'], string> = {
  Geral: 'bg-muted text-foreground',
  Endereço: 'bg-primary/10 text-primary',
  Operação: 'bg-amber-500/10 text-warning dark:text-warning',
  Documento: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  Estoque: 'bg-emerald-500/10 text-success dark:text-success',
};

interface GlossaryDialogProps {
  trigger?: React.ReactNode;
}

export function GlossaryDialog({ trigger }: GlossaryDialogProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GLOSSARY;
    return GLOSSARY.filter(
      (e) =>
        e.term.toLowerCase().includes(q) ||
        e.meaning.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<GlossaryEntry['category'], GlossaryEntry[]>();
    filtered.forEach((e) => {
      const arr = map.get(e.category) || [];
      arr.push(e);
      map.set(e.category, arr);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" aria-label="Abrir glossário de abreviações">
            <BookOpen className="w-4 h-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Glossário de Abreviações</DialogTitle>
          <DialogDescription className="sr-only">
            Significado dos termos e siglas usados no sistema.
          </DialogDescription>
        </DialogHeader>


        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar termo ou significado..."
            className="pl-9"
            aria-label="Buscar no glossário"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-5">
          {grouped.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum termo encontrado para "{query}".
            </p>
          )}
          {grouped.map(([category, entries]) => (
            <section key={category}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {category}
              </h3>
              <ul className="space-y-2">
                {entries.map((e) => (
                  <li
                    key={e.term}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-muted/30 transition-colors"
                  >
                    <Badge className={`${CAT_COLOR[e.category]} font-mono font-bold shrink-0 min-w-[56px] justify-center`}>
                      {e.term}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{e.meaning}</p>
                      {e.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{e.description}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default GlossaryDialog;
