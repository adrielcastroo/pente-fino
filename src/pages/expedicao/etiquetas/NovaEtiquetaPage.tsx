/**
 * Wizard de criação de etiqueta — 3 passos.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useCriarTemplate } from '@/hooks/useEtiquetas';
import {
  PRESETS_TAMANHO,
  VARIAVEIS_INTELIGENTES,
  VARIAVEIS_PADRAO,
  ZPL_PADRAO,
  type CategoriaEtiqueta,
  type VariavelTemplate,
} from '@/types/etiquetas';

const CATEGORIAS: { key: CategoriaEtiqueta; label: string; desc: string }[] = [
  { key: 'expedicao', label: 'Expedição', desc: 'Etiquetas de romaneio e envio' },
  { key: 'conferencia', label: 'Conferência', desc: 'Etiquetas de double-check' },
  { key: 'devolucao', label: 'Devolução', desc: 'Retornos e trocas' },
  { key: 'custom', label: 'Personalizada', desc: 'Uso livre' },
];

export default function NovaEtiquetaPage() {
  useDocumentTitle('Nova Etiqueta · Expedição');
  const navigate = useNavigate();
  const criar = useCriarTemplate();
  const [step, setStep] = useState(1);

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaEtiqueta>('expedicao');
  const [preset, setPreset] = useState<string>(PRESETS_TAMANHO[0].nome);
  const [largura, setLargura] = useState(100);
  const [altura, setAltura] = useState(150);
  const [chavesSelecionadas, setChavesSelecionadas] = useState<Set<string>>(
    new Set(VARIAVEIS_PADRAO.map((v) => v.chave)),
  );

  const aplicaPreset = (nomePreset: string) => {
    setPreset(nomePreset);
    const p = PRESETS_TAMANHO.find((x) => x.nome === nomePreset);
    if (p) {
      setLargura(p.largura);
      setAltura(p.altura);
    }
  };

  const toggleVar = (chave: string) => {
    setChavesSelecionadas((prev) => {
      const n = new Set(prev);
      if (n.has(chave)) n.delete(chave);
      else n.add(chave);
      return n;
    });
  };

  const finalizar = async () => {
    const variaveis: VariavelTemplate[] = Array.from(chavesSelecionadas).map((chave, i) => {
      const inteligente = VARIAVEIS_INTELIGENTES.find((v) => v.chave === chave);
      return {
        chave,
        label: inteligente?.label ?? chave,
        tipo: inteligente?.tipo ?? 'text',
        obrigatorio: chave === 'romaneio' || chave === 'cliente',
        opcoes: inteligente?.opcoes ? [...inteligente.opcoes] : undefined,
        padrao: inteligente?.padrao,
        descricao: inteligente?.desc,
        ordem: i,
      };
    });

    const criado = await criar.mutateAsync({
      nome: nome.trim() || `Etiqueta ${new Date().toLocaleDateString('pt-BR')}`,
      categoria,
      dimensoes: { largura, altura },
      zpl: ZPL_PADRAO,
      variaveis,
    });
    navigate(`/expedicao/etiquetas/${criado.id}/editar`);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/expedicao/etiquetas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Nova Etiqueta</h1>
          <p className="text-xs text-muted-foreground">Passo {step} de 3</p>
        </div>
      </header>

      <div className="flex items-center gap-2">
        {[1, 2, 3].map((n) => (
          <div key={n} className={cn('h-1.5 flex-1 rounded-full transition-colors', n <= step ? 'bg-primary' : 'bg-muted')} />
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4 bg-card border border-border rounded-xl p-6">
          <h2 className="font-medium">1. Nome e categoria</h2>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome do template</Label>
            <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Romaneio Expedição Padrão" />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <RadioGroup value={categoria} onValueChange={(v) => setCategoria(v as CategoriaEtiqueta)} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIAS.map((c) => (
                <label
                  key={c.key}
                  htmlFor={`cat-${c.key}`}
                  className={cn(
                    'border border-border rounded-lg p-3 cursor-pointer flex items-start gap-3 transition-colors',
                    categoria === c.key ? 'border-primary bg-primary/5' : 'hover:bg-accent',
                  )}
                >
                  <RadioGroupItem value={c.key} id={`cat-${c.key}`} className="mt-0.5" />
                  <div>
                    <div className="text-sm font-medium">{c.label}</div>
                    <div className="text-xs text-muted-foreground">{c.desc}</div>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 bg-card border border-border rounded-xl p-6">
          <h2 className="font-medium">2. Tamanho</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PRESETS_TAMANHO.map((p) => (
              <button
                key={p.nome}
                type="button"
                onClick={() => aplicaPreset(p.nome)}
                className={cn(
                  'border border-border rounded-lg p-3 text-left transition-colors',
                  preset === p.nome ? 'border-primary bg-primary/5' : 'hover:bg-accent',
                )}
              >
                <div className="text-sm font-medium">{p.nome}</div>
                <div className="text-xs text-muted-foreground">
                  {p.largura}×{p.altura}mm
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">{p.uso}</div>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="larg">Largura (mm)</Label>
              <Input id="larg" type="number" value={largura} onChange={(e) => setLargura(parseInt(e.target.value, 10) || 0)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alt">Altura (mm)</Label>
              <Input id="alt" type="number" value={altura} onChange={(e) => setAltura(parseInt(e.target.value, 10) || 0)} />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 bg-card border border-border rounded-xl p-6">
          <h2 className="font-medium">3. Variáveis</h2>
          <p className="text-xs text-muted-foreground">Selecione as variáveis iniciais. Você pode ajustar depois no Modo Designer.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-96 overflow-auto">
            {VARIAVEIS_INTELIGENTES.map((v) => {
              const sel = chavesSelecionadas.has(v.chave);
              return (
                <button
                  key={v.chave}
                  type="button"
                  onClick={() => toggleVar(v.chave)}
                  className={cn(
                    'text-left border border-border rounded-md p-2.5 transition-colors flex items-start gap-2',
                    sel ? 'border-primary bg-primary/5' : 'hover:bg-accent',
                  )}
                >
                  <div className={cn('mt-0.5 w-4 h-4 rounded border flex items-center justify-center', sel ? 'border-primary bg-primary text-primary-foreground' : 'border-border')}>
                    {sel && <Check className="w-3 h-3" />}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{v.label}</div>
                    <div className="text-[11px] text-muted-foreground font-mono">{`{{${v.chave}}}`}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep((s) => s + 1)}>
            Continuar <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={finalizar} disabled={criar.isPending}>
            {criar.isPending ? 'Criando...' : 'Criar template'}
            <Check className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
