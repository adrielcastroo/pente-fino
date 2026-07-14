/**
 * Modo Designer — edita ZPL, dimensões, variáveis. Preserva editor visual em aba.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAtualizarTemplate, useEtiqueta } from '@/hooks/useEtiquetas';
import { AutoCompleteZPL } from '@/components/etiquetas/AutoCompleteZPL';
import { LiveZPLPreview } from '@/components/etiquetas/LiveZPLPreview';
import { VARIAVEIS_INTELIGENTES, type CategoriaEtiqueta, type TipoVariavel, type VariavelTemplate } from '@/types/etiquetas';
import AdvancedVisualEditor from '@/components/expedicao/etiquetas/components/AdvancedVisualEditor';

const TIPOS: TipoVariavel[] = ['text', 'select', 'date', 'barcode', 'qr', 'auto'];

export default function EditarEtiquetaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: template, isLoading } = useEtiqueta(id);
  const atualizar = useAtualizarTemplate();
  useDocumentTitle(template ? `Editar · ${template.nome}` : 'Editar Etiqueta');

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<CategoriaEtiqueta>('expedicao');
  const [largura, setLargura] = useState(100);
  const [altura, setAltura] = useState(150);
  const [zpl, setZpl] = useState('');
  const [variaveis, setVariaveis] = useState<VariavelTemplate[]>([]);

  useEffect(() => {
    if (!template) return;
    setNome(template.nome);
    setCategoria(template.categoria);
    setLargura(template.dimensoes.largura);
    setAltura(template.dimensoes.altura);
    setZpl(template.zpl);
    setVariaveis(template.variaveis);
  }, [template]);

  const salvar = async () => {
    if (!id) return;
    await atualizar.mutateAsync({
      id,
      data: {
        nome: nome.trim(),
        categoria,
        dimensoes: { largura, altura },
        zpl,
        variaveis,
      },
    });
  };

  const addVar = () => {
    setVariaveis((prev) => [
      ...prev,
      { chave: `campo${prev.length + 1}`, label: `Campo ${prev.length + 1}`, tipo: 'text', obrigatorio: false, ordem: prev.length },
    ]);
  };

  const removeVar = (i: number) => setVariaveis((prev) => prev.filter((_, idx) => idx !== i));

  const updateVar = (i: number, patch: Partial<VariavelTemplate>) => {
    setVariaveis((prev) => prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v)));
  };

  const importInteligente = (chave: string) => {
    const inteligente = VARIAVEIS_INTELIGENTES.find((v) => v.chave === chave);
    if (!inteligente) return;
    if (variaveis.some((v) => v.chave === inteligente.chave)) return;
    setVariaveis((prev) => [
      ...prev,
      {
        chave: inteligente.chave,
        label: inteligente.label,
        tipo: inteligente.tipo,
        obrigatorio: false,
        opcoes: inteligente.opcoes ? [...inteligente.opcoes] : undefined,
        padrao: inteligente.padrao,
        descricao: inteligente.desc,
        ordem: prev.length,
      },
    ]);
  };

  if (isLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>;
  if (!template) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-muted-foreground mb-4">Template não encontrado.</p>
        <Button onClick={() => navigate('/expedicao/etiquetas')}>Voltar</Button>
      </div>
    );
  }

  const valoresExemplo: Record<string, string> = {};
  variaveis.forEach((v) => {
    if (v.tipo === 'barcode') valoresExemplo[v.chave] = 'RO-2024-001234';
    else if (v.tipo === 'date') valoresExemplo[v.chave] = new Date().toLocaleDateString('pt-BR');
    else valoresExemplo[v.chave] = v.label;
  });

  return (
    <div className="p-4 md:p-6 space-y-4">
      <header className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="icon" onClick={() => navigate('/expedicao/etiquetas')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <span className="px-2 py-1 text-[10px] rounded bg-primary/10 text-primary font-medium">MODO DESIGNER</span>
          <h1 className="text-xl font-semibold truncate mt-1">{template.nome}</h1>
        </div>
        <Button variant="outline" onClick={() => navigate(`/expedicao/etiquetas/${template.id}/imprimir`)}>
          Imprimir
        </Button>
        <Button onClick={salvar} disabled={atualizar.isPending}>
          <Save className="mr-2 h-4 w-4" /> {atualizar.isPending ? 'Salvando...' : 'Salvar'}
        </Button>
      </header>

      <Tabs defaultValue="props" className="w-full">
        <TabsList>
          <TabsTrigger value="props">Propriedades</TabsTrigger>
          <TabsTrigger value="zpl">Editor ZPL</TabsTrigger>
          <TabsTrigger value="variaveis">Variáveis</TabsTrigger>
          <TabsTrigger value="visual">Editor Visual (avançado)</TabsTrigger>
        </TabsList>

        <TabsContent value="props" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 bg-card border border-border rounded-xl p-4">
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaEtiqueta)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expedicao">Expedição</SelectItem>
                  <SelectItem value="conferencia">Conferência</SelectItem>
                  <SelectItem value="devolucao">Devolução</SelectItem>
                  <SelectItem value="custom">Personalizada</SelectItem>
                </SelectContent>
              </Select>
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

          <div className="bg-white border border-border rounded-xl overflow-hidden" style={{ aspectRatio: `${largura} / ${altura}` }}>
            <LiveZPLPreview zpl={zpl} valores={valoresExemplo} dimensoes={{ largura, altura }} />
          </div>
        </TabsContent>

        <TabsContent value="zpl" className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs mb-1.5 block">
              Digite <code className="font-mono text-primary">{'{{'}</code> para inserir variáveis
            </Label>
            <AutoCompleteZPL value={zpl} onChange={setZpl} rows={22} />
          </div>
          <div className="bg-white border border-border rounded-xl overflow-hidden self-start" style={{ aspectRatio: `${largura} / ${altura}` }}>
            <LiveZPLPreview zpl={zpl} valores={valoresExemplo} dimensoes={{ largura, altura }} />
          </div>
        </TabsContent>

        <TabsContent value="variaveis" className="mt-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={addVar}>
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar variável
            </Button>
            <Select onValueChange={importInteligente}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Importar variável inteligente..." />
              </SelectTrigger>
              <SelectContent>
                {VARIAVEIS_INTELIGENTES.map((v) => (
                  <SelectItem key={v.chave} value={v.chave}>
                    {v.label} — {`{{${v.chave}}}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            {variaveis.map((v, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_140px_120px_auto] gap-2 items-end bg-card border border-border rounded-lg p-3">
                <div className="space-y-1">
                  <Label className="text-xs">Chave</Label>
                  <Input value={v.chave} onChange={(e) => updateVar(i, { chave: e.target.value })} className="font-mono text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Label</Label>
                  <Input value={v.label} onChange={(e) => updateVar(i, { label: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Tipo</Label>
                  <Select value={v.tipo} onValueChange={(val) => updateVar(i, { tipo: val as TipoVariavel })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Switch checked={v.obrigatorio} onCheckedChange={(c) => updateVar(i, { obrigatorio: c })} />
                  <span className="text-xs">Obrigatório</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeVar(i)} aria-label="Remover">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            {variaveis.length === 0 && (
              <div className="text-center text-sm text-muted-foreground p-6 border border-dashed border-border rounded-lg">
                Nenhuma variável. Clique em "Adicionar variável" para começar.
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="visual" className="mt-4">
          <div className="bg-card border border-border rounded-xl p-3">
            <p className="text-xs text-muted-foreground mb-3">
              Editor visual avançado com drag/snap/réguas. As alterações feitas aqui são preservadas localmente e não afetam o ZPL persistido.
            </p>
            <AdvancedVisualEditor />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
