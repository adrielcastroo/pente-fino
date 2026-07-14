/**
 * Criação de modelo de etiqueta — formulário único unificado.
 *
 * Alinhado à Central de Etiquetas: modelo único (sem categorias na UI),
 * cartões semânticos, tokens do design system, dark mode automático.
 * A coluna `categoria` no banco é preservada com valor fixo 'expedicao'.
 */
import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Layers, Ruler, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useCriarTemplate } from '@/hooks/useEtiquetas';
import {
  PRESETS_TAMANHO,
  VARIAVEIS_INTELIGENTES,
  VARIAVEIS_PADRAO,
  ZPL_PADRAO,
  type VariavelTemplate,
} from '@/types/etiquetas';

export default function NovaEtiquetaPage() {
  useDocumentTitle('Novo Modelo · Etiquetas');
  const navigate = useNavigate();
  const criar = useCriarTemplate();

  const [nome, setNome] = useState('');
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

  const podeCriar = useMemo(
    () => largura > 0 && altura > 0 && chavesSelecionadas.size > 0,
    [largura, altura, chavesSelecionadas],
  );

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
      nome: nome.trim() || `Modelo ${new Date().toLocaleDateString('pt-BR')}`,
      categoria: 'expedicao',
      dimensoes: { largura, altura },
      zpl: ZPL_PADRAO,
      variaveis,
    });
    navigate(`/expedicao/etiquetas/${criado.id}/editar`);
  };

  return (
    <>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <html lang="pt-BR" />
      </Helmet>

      <main
        className="max-w-4xl mx-auto p-4 md:p-6 space-y-5"
        aria-label="Novo modelo de etiqueta"
      >
        {/* Header */}
        <header className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/expedicao/etiquetas')}
            aria-label="Voltar para a Central de Etiquetas"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">
              Novo modelo de etiqueta
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Defina identificação, tamanho e variáveis iniciais. Ajustes finos ficam no editor visual.
            </p>
          </div>
        </header>

        {/* Identificação */}
        <section
          className="border border-border/60 rounded-xl bg-card p-5 space-y-4"
          aria-labelledby="sec-nome"
        >
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h2 id="sec-nome" className="text-sm font-medium">Identificação</h2>
          </div>
          <div className="space-y-1.5 max-w-xl">
            <Label htmlFor="nome">Nome do modelo</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Romaneio Expedição Padrão"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Se ficar em branco usamos a data de hoje como referência.
            </p>
          </div>
        </section>

        {/* Tamanho */}
        <section
          className="border border-border/60 rounded-xl bg-card p-5 space-y-4"
          aria-labelledby="sec-tam"
        >
          <div className="flex items-center gap-2">
            <Ruler className="h-4 w-4 text-primary" />
            <h2 id="sec-tam" className="text-sm font-medium">Tamanho da etiqueta</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {PRESETS_TAMANHO.map((p) => {
              const sel = preset === p.nome;
              return (
                <button
                  key={p.nome}
                  type="button"
                  onClick={() => aplicaPreset(p.nome)}
                  aria-pressed={sel}
                  className={cn(
                    'border rounded-lg p-3 text-left transition-colors',
                    sel
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                      : 'border-border/60 hover:bg-accent',
                  )}
                >
                  <div className="text-sm font-medium">{p.nome}</div>
                  <div className="text-xs text-muted-foreground font-mono">
                    {p.largura}×{p.altura}mm
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-1">{p.uso}</div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div className="space-y-1.5">
              <Label htmlFor="larg">Largura (mm)</Label>
              <Input
                id="larg"
                type="number"
                min={10}
                value={largura}
                onChange={(e) => setLargura(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alt">Altura (mm)</Label>
              <Input
                id="alt"
                type="number"
                min={10}
                value={altura}
                onChange={(e) => setAltura(parseInt(e.target.value, 10) || 0)}
              />
            </div>
          </div>
        </section>

        {/* Variáveis */}
        <section
          className="border border-border/60 rounded-xl bg-card p-5 space-y-4"
          aria-labelledby="sec-vars"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 id="sec-vars" className="text-sm font-medium">Variáveis iniciais</h2>
            </div>
            <Badge variant="outline" className="text-[10px] font-mono">
              {chavesSelecionadas.size} selecionadas
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground -mt-1">
            Escolha as informações que o modelo vai imprimir. Você refina no editor visual depois.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 max-h-[360px] overflow-auto pr-1">
            {VARIAVEIS_INTELIGENTES.map((v) => {
              const sel = chavesSelecionadas.has(v.chave);
              return (
                <button
                  key={v.chave}
                  type="button"
                  onClick={() => toggleVar(v.chave)}
                  aria-pressed={sel}
                  className={cn(
                    'text-left border rounded-md p-2.5 transition-colors flex items-start gap-2',
                    sel
                      ? 'border-primary bg-primary/5'
                      : 'border-border/60 hover:bg-accent',
                  )}
                >
                  <div
                    className={cn(
                      'mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0',
                      sel
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border',
                    )}
                  >
                    {sel && <Check className="w-3 h-3" />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{v.label}</div>
                    <div className="text-[11px] text-muted-foreground font-mono truncate">
                      {`{{${v.chave}}}`}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Ações */}
        <div className="flex items-center justify-between gap-2 sticky bottom-0 bg-background/80 backdrop-blur-sm py-3 -mx-4 md:-mx-6 px-4 md:px-6 border-t border-border/60">
          <Button
            variant="ghost"
            onClick={() => navigate('/expedicao/etiquetas')}
            disabled={criar.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={finalizar}
            disabled={!podeCriar || criar.isPending}
            className="gap-2"
          >
            {criar.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Criando...
              </>
            ) : (
              <>
                Criar modelo <Check className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </main>
    </>
  );
}
