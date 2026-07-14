// ============================================================================
// VariablePanel — colunas de variáveis globais e template.
// ============================================================================
import { useMemo } from 'react';
import { Globe, FileText, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { KNOWN_VARS } from '../utils/etiquetaInterpolation';
import type { Template, Vars } from '../types/etiqueta';
import type { UseVariablesReturn } from '../hooks/useEtiquetaVariables';
import { extractVarRefs } from '../utils/etiquetaInterpolation';

interface Props {
  variables: UseVariablesReturn;
  template: Template;
}

export function VariablePanel({ variables, template: t }: Props) {
  const { globalVars, setGlobalVars, templateVars, setTemplateVars, clearTemplateVars } = variables;

  const referenced = useMemo(() => extractVarRefs(
    t.titulo, t.subtitulo, t.codigo, t.destino, t.observacoes, t.payload,
    ...t.customFields.map((f) => f.value),
  ), [t]);

  const suggestions = useMemo(() => {
    const set = new Set<string>([...KNOWN_VARS, ...referenced, ...Object.keys(globalVars), ...Object.keys(templateVars)]);
    return Array.from(set);
  }, [referenced, globalVars, templateVars]);

  return (
    <Card className="border-border/60 h-full overflow-hidden flex flex-col">
      <CardContent className="p-3 space-y-3 overflow-y-auto custom-scrollbar">
        <SectionHeader
          icon={<Globe className="size-3.5 text-primary" />}
          label="Globais"
          badge={`${Object.keys(globalVars).length}`}
        />
        <KeyValueEditor
          vars={globalVars}
          suggestions={suggestions}
          onChange={setGlobalVars}
        />

        <Separator />

        <div className="flex items-center justify-between">
          <SectionHeader icon={<FileText className="size-3.5 text-primary" />} label="Do modelo" badge={`${Object.keys(templateVars).length}`} />
          {Object.keys(templateVars).length > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={clearTemplateVars}>Limpar</Button>
          )}
        </div>
        <KeyValueEditor
          vars={templateVars}
          suggestions={suggestions}
          onChange={setTemplateVars}
        />

        {referenced.length > 0 && (
          <>
            <Separator />
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">Referenciadas no modelo</Label>
              <div className="flex flex-wrap gap-1">
                {referenced.map((k) => (
                  <Badge key={k} variant="outline" className="font-mono text-[10px]">{`{{${k}}}`}</Badge>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SectionHeader({ icon, label, badge }: { icon: React.ReactNode; label: string; badge?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
      {icon}
      <span>{label}</span>
      {badge != null && <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1.5">{badge}</Badge>}
    </div>
  );
}

function Label({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <label className={`block ${className}`}>{children}</label>;
}

function KeyValueEditor({ vars, suggestions, onChange }: { vars: Vars; suggestions: string[]; onChange: (v: Vars) => void }) {
  const entries = Object.entries(vars);
  const addKey = (k: string) => {
    if (!k || vars[k] != null) return;
    onChange({ ...vars, [k]: '' });
  };
  const setKV = (k: string, v: string) => onChange({ ...vars, [k]: v });
  const removeKey = (k: string) => {
    const next = { ...vars };
    delete next[k];
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
      {entries.length === 0 && (
        <p className="text-[11px] text-muted-foreground italic">Nenhuma variável definida.</p>
      )}
      {entries.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[90px_1fr_auto] gap-1 items-center">
          <Badge variant="outline" className="font-mono text-[10px] justify-start h-7 px-2">{`{{${k}}}`}</Badge>
          <Input value={v} onChange={(e) => setKV(k, e.target.value)} className="h-7 text-xs" />
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeKey(k)}><X className="size-3" /></Button>
        </div>
      ))}
      <AddKey suggestions={suggestions.filter((s) => vars[s] == null)} onAdd={addKey} />
    </div>
  );
}

function AddKey({ suggestions, onAdd }: { suggestions: string[]; onAdd: (k: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1 pt-1">
      {suggestions.slice(0, 8).map((s) => (
        <Button key={s} variant="ghost" size="sm" className="h-6 text-[10px] font-mono px-1.5 gap-1" onClick={() => onAdd(s)}>
          <Plus className="size-2.5" /> {s}
        </Button>
      ))}
    </div>
  );
}

export default VariablePanel;
