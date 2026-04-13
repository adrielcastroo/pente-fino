import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Settings, 
  Link as LinkIcon, 
  Bell, 
  Shield, 
  Palette, 
  Cpu, 
  Users,
  Search,
  ChevronRight,
  Save,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

const categories = [
  { id: 'profile', name: 'Perfil / Conta', icon: User, description: 'Gerencie suas informações pessoais e de conta.' },
  { id: 'preferences', name: 'Preferências do Sistema', icon: Settings, description: 'Ajuste o comportamento do sistema para suas necessidades.' },
  { id: 'integrations', name: 'Integrações', icon: LinkIcon, description: 'Conecte ferramentas externas e gerencie chaves de API.' },
  { id: 'notifications', name: 'Notificações', icon: Bell, description: 'Configure como e quando você quer ser notificado.' },
  { id: 'security', name: 'Segurança', icon: Shield, description: 'Proteja sua conta com senhas e autenticação de dois fatores.' },
  { id: 'appearance', name: 'Aparência', icon: Palette, description: 'Personalize o visual e as cores da interface.' },
  { id: 'advanced', name: 'Configurações Avançadas', icon: Cpu, description: 'Opções técnicas e de performance para usuários experientes.' },
  { id: 'users', name: 'Usuários e Permissões', icon: Users, description: 'Gerencie membros da equipe e níveis de acesso.' },
];

export default function SettingsPage() {
  const [activeCategory, setActiveCategory] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { theme, setTheme } = useTheme();

  const [orKey, setOrKey] = useState(localStorage.getItem('cft4_or_key') || '');
  const [orModel, setOrModel] = useState(localStorage.getItem('cft4_or_model') || 'anthropic/claude-3-haiku');

  const saveIntegrations = () => {
    if (!orKey.trim()) {
      toast.error('Insira uma chave válida.');
      return;
    }
    localStorage.setItem('cft4_or_key', orKey.trim());
    localStorage.setItem('cft4_or_model', orModel);
    toast.success('Configurações de integração salvas!');
    setHasUnsavedChanges(false);
  };

  const handleSave = () => {
    if (activeCategory === 'integrations') {
      saveIntegrations();
    } else {
      toast.success('Alterações salvas com sucesso!');
      setHasUnsavedChanges(false);
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Gerencie as preferências e ajustes do seu sistema.</p>
        </div>
        
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs font-medium text-amber-500 animate-pulse flex items-center gap-1 mr-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Alterações não salvas
            </span>
          )}
          <Button onClick={handleSave} className="gap-2 shadow-lg shadow-primary/20">
            <Save className="w-4 h-4" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
        <aside className="w-full lg:w-72 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar configurações..." 
              className="pl-9 bg-background/50 border-border/50 focus:border-primary/50 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <nav className="flex flex-col gap-1 overflow-y-auto pr-2 custom-scrollbar">
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    activeCategory === cat.id 
                      ? 'bg-primary text-primary-foreground shadow-md' 
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${activeCategory === cat.id ? 'text-white' : 'text-muted-foreground group-hover:text-primary'}`} />
                  <span className="flex-1 text-left">{cat.name}</span>
                  <ChevronRight className={`w-4 h-4 opacity-0 transition-opacity ${activeCategory === cat.id ? 'opacity-100' : 'group-hover:opacity-50'}`} />
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <header>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  {categories.find(c => c.id === activeCategory)?.name}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {categories.find(c => c.id === activeCategory)?.description}
                </p>
              </header>

              <Separator className="bg-border/50" />

              <div className="grid gap-6">
                
                {activeCategory === 'profile' && (
                  <>
                    <Card className="border-border/40 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Informações Pessoais</CardTitle>
                        <CardDescription>Estes dados serão visíveis para outros membros da equipe.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="name">Nome Completo</Label>
                            <Input id="name" defaultValue="Usuário Administrador" onChange={() => setHasUnsavedChanges(true)} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" defaultValue="admin@pentefino.com.br" onChange={() => setHasUnsavedChanges(true)} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bio">Bio</Label>
                          <Input id="bio" placeholder="Uma breve descrição sobre você..." onChange={() => setHasUnsavedChanges(true)} />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-border/40 shadow-sm border-destructive/20">
                      <CardHeader>
                        <CardTitle className="text-base text-destructive">Zona de Perigo</CardTitle>
                        <CardDescription>Ações irreversíveis que afetam sua conta.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button variant="destructive" size="sm">Excluir minha conta</Button>
                      </CardContent>
                    </Card>
                  </>
                )}

                {activeCategory === 'integrations' && (
                  <Card className="border-border/40 shadow-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            ⚡ OpenRouter
                            <span className={`text-[10px] font-normal px-2 py-0.5 rounded-full ${orKey ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {orKey ? 'Conectado' : 'Desconectado'}
                            </span>
                          </CardTitle>
                          <CardDescription>Configure a inteligência artificial para leitura automática.</CardDescription>
                        </div>
                        <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm">Obter Chave</Button>
                        </a>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="or-key">Chave de API (OpenRouter)</Label>
                        <Input 
                          id="or-key" 
                          type="password" 
                          value={orKey} 
                          onChange={(e) => {
                            setOrKey(e.target.value);
                            setHasUnsavedChanges(true);
                          }} 
                          placeholder="sk-or-v1-..."
                          className="font-mono"
                        />
                        <p className="text-[11px] text-muted-foreground">Sua chave é armazenada localmente de forma segura.</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="or-model">Modelo de IA</Label>
                        <Select value={orModel} onValueChange={(val) => {
                          setOrModel(val);
                          setHasUnsavedChanges(true);
                        }}>
                          <SelectTrigger id="or-model">
                            <SelectValue placeholder="Selecione um modelo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="anthropic/claude-3-haiku">Claude 3 Haiku — rápido</SelectItem>
                            <SelectItem value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet — preciso</SelectItem>
                            <SelectItem value="openai/gpt-4o-mini">GPT-4o Mini — rápido</SelectItem>
                            <SelectItem value="openai/gpt-4o">GPT-4o — máxima precisão</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[11px] text-muted-foreground">Escolha o modelo que melhor se adapta à sua necessidade de velocidade vs. precisão.</p>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 border-t p-4">
                       <p className="text-xs text-muted-foreground">💡 Leitura automática via OCR avançado disponível somente com OpenRouter.</p>
                    </CardFooter>
                  </Card>
                )}

                {activeCategory === 'appearance' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="border-border/40 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Tema do Aplicativo</CardTitle>
                        <CardDescription>Escolha entre os temas claro, escuro ou seguir o sistema.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid grid-cols-3 gap-3">
                        <Button 
                          variant={theme === 'light' ? 'default' : 'outline'} 
                          className="flex flex-col gap-2 h-auto py-4"
                          onClick={() => setTheme('light')}
                        >
                          <Sun className="w-5 h-5" />
                          <span className="text-xs">Claro</span>
                        </Button>
                        <Button 
                          variant={theme === 'dark' ? 'default' : 'outline'} 
                          className="flex flex-col gap-2 h-auto py-4"
                          onClick={() => setTheme('dark')}
                        >
                          <Moon className="w-5 h-5" />
                          <span className="text-xs">Escuro</span>
                        </Button>
                        <Button 
                          variant={theme === 'system' ? 'default' : 'outline'} 
                          className="flex flex-col gap-2 h-auto py-4"
                          onClick={() => setTheme('system')}
                        >
                          <Laptop className="w-5 h-5" />
                          <span className="text-xs">Sistema</span>
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-border/40 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-base">Layout e Densidade</CardTitle>
                        <CardDescription>Ajuste o espaçamento e visualização das tabelas.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                         <div className="flex items-center justify-between">
                            <Label htmlFor="dense-mode">Modo Compacto</Label>
                            <Switch id="dense-mode" onCheckedChange={() => setHasUnsavedChanges(true)} />
                         </div>
                         <div className="flex items-center justify-between">
                            <Label htmlFor="animations">Animações de Transição</Label>
                            <Switch id="animations" defaultChecked onCheckedChange={() => setHasUnsavedChanges(true)} />
                         </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {activeCategory === 'notifications' && (
                  <Card className="border-border/40 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base">Notificações por Email</CardTitle>
                      <CardDescription>Escolha quais alertas você deseja receber no seu email.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                             <Label className="text-sm font-semibold">Resumo Semanal</Label>
                             <p className="text-xs text-muted-foreground">Receba um relatório consolidado da movimentação de estoque toda segunda-feira.</p>
                          </div>
                          <Switch defaultChecked onCheckedChange={() => setHasUnsavedChanges(true)} />
                       </div>
                       <Separator />
                       <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                             <Label className="text-sm font-semibold">Alertas de Estoque Baixo</Label>
                             <p className="text-xs text-muted-foreground">Notificar quando um item atingir o estoque mínimo configurado.</p>
                          </div>
                          <Switch defaultChecked onCheckedChange={() => setHasUnsavedChanges(true)} />
                       </div>
                    </CardContent>
                  </Card>
                )}

                {['preferences', 'security', 'advanced', 'users'].includes(activeCategory) && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-muted/20 rounded-2xl border border-dashed border-border/60">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                       {categories.find(c => c.id === activeCategory)?.icon && (
                         (() => {
                           const Icon = categories.find(c => c.id === activeCategory)!.icon;
                           return <Icon className="w-8 h-8 text-muted-foreground" />;
                         })()
                       )}
                    </div>
                    <div>
                      <h3 className="font-semibold">Módulo em Desenvolvimento</h3>
                      <p className="text-sm text-muted-foreground max-w-xs">Esta seção de configurações será habilitada na próxima atualização do sistema.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setActiveCategory('profile')}>Voltar para Perfil</Button>
                  </div>
                )}

              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
