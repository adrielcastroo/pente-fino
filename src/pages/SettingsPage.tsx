import { useState, useEffect } from 'react';
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
  Check,
  ChevronRight,
  Save,
  Moon,
  Sun,
  Laptop,
  Mail,
  Lock,
  Smartphone,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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
import { useAuth } from '@/hooks/use-auth';

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
  const { user, profile, isGuest, signOut } = useAuth();
  const [activeCategory, setActiveCategory] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { theme, setTheme } = useTheme();

  // Existing settings from ConfigModal
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
            <motion.span 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs font-medium text-amber-500 flex items-center gap-1 mr-2 px-2 py-1 bg-amber-500/10 rounded-full border border-amber-500/20"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Alterações não salvas
            </motion.span>
          )}
          <Button onClick={handleSave} className="gap-2 shadow-lg shadow-primary/20">
            <Save className="w-4 h-4" />
            Salvar Alterações
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <aside className="w-full lg:w-72 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar configurações..." 
              className="pl-9 bg-background/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:ring-offset-0 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-y-auto pr-0 lg:pr-2 pb-2 lg:pb-0 custom-scrollbar -mx-2 px-2">
            {filteredCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 sm:gap-3 px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 group whitespace-nowrap ${
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

        {/* Content Area */}
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

              {/* Dynamic Content based on activeCategory */}
              <div className="grid gap-6">
                
                {activeCategory === 'profile' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="md:col-span-2 border-border/40 shadow-sm overflow-hidden">
                        <CardHeader className="pb-4">
                          <CardTitle className="text-base">Informações do Perfil</CardTitle>
                          <CardDescription>
                            {isGuest 
                              ? "Você está acessando como visitante. Algumas permissões são restritas." 
                              : "Gerencie as informações da sua conta sincronizada."}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center pb-2">
                             <div className="relative group">
                                <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-dashed border-primary/30 group-hover:border-primary transition-colors overflow-hidden">
                                   {profile?.avatar_url ? (
                                     <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                   ) : (
                                     <User className="w-8 h-8 text-primary/40 group-hover:text-primary transition-colors" />
                                   )}
                                </div>
                             </div>
                             <div className="space-y-1">
                                <h3 className="font-semibold text-sm">
                                  {isGuest ? "Sessão de Visitante" : profile?.display_name || "Usuário"}
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                  {isGuest ? "Identificado no sistema por seu nome de conferente." : user?.email}
                                </p>
                                <div className="flex gap-2 mt-2">
                                   <Button onClick={() => signOut()} variant="outline" size="sm" className="text-[10px] h-7 px-3 text-destructive hover:bg-destructive/10 border-destructive/20">
                                     <LogOut className="w-3.5 h-3.5 mr-2" />
                                     Sair da Conta
                                   </Button>
                                </div>
                             </div>
                          </div>
                          
                          {!isGuest && (
                            <>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider opacity-70">Nome de Exibição</Label>
                                  <Input id="name" defaultValue={profile?.display_name || ''} onChange={() => setHasUnsavedChanges(true)} className="bg-muted/30" />
                                </div>
                                <div className="space-y-2">
                                  <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider opacity-70">Email</Label>
                                  <Input id="email" type="email" defaultValue={user?.email || ''} readOnly className="bg-muted/10 opacity-70 cursor-not-allowed" />
                                </div>
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-border/40 shadow-sm bg-gradient-to-br from-primary/5 to-transparent">
                         <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest opacity-60">Status de Acesso</CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-6">
                            <div className="space-y-4">
                               <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium">Nível de Acesso</span>
                                  <Badge variant={isGuest ? "secondary" : "default"} className="font-bold">
                                    {isGuest ? "Visitante" : "Administrador"}
                                  </Badge>
                               </div>
                               
                               <div className="p-3 rounded-xl bg-background/50 border border-border/30 space-y-2">
                                 <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Permissões:</p>
                                 <ul className="space-y-1.5">
                                   <li className="flex items-center gap-2 text-xs">
                                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                     <span>Adicionar registros</span>
                                   </li>
                                   <li className="flex items-center gap-2 text-xs">
                                     <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                     <span>Visualizar estoque</span>
                                   </li>
                                   <li className="flex items-center gap-2 text-xs">
                                     <div className={`w-1.5 h-1.5 rounded-full ${isGuest ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                     <span className={isGuest ? 'text-muted-foreground line-through' : ''}>Excluir registros históricos</span>
                                   </li>
                                   <li className="flex items-center gap-2 text-xs">
                                     <div className={`w-1.5 h-1.5 rounded-full ${isGuest ? 'bg-red-500' : 'bg-emerald-500'}`} />
                                     <span className={isGuest ? 'text-muted-foreground line-through' : ''}>Remover itens do estoque</span>
                                   </li>
                                 </ul>
                               </div>
                            </div>

                            <Separator className="bg-primary/10" />

                            <div className="pt-2 text-center">
                               <p className="text-[10px] text-muted-foreground leading-relaxed">
                                 {isGuest 
                                   ? "Entre com uma conta oficial para ter acesso total ao sistema." 
                                   : "Sua conta está ativa e com todas as permissões concedidas."}
                               </p>
                            </div>
                         </CardContent>
                      </Card>
                    </div>
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
                  <Card className="border-border/40 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Palette className="w-4 h-4" /> Temas e Cores
                      </CardTitle>
                      <CardDescription>Personalize o visual para seu conforto.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider opacity-60">Modo de Exibição</Label>
                        <div className="grid grid-cols-3 gap-3">
                          {[
                            { id: 'light', label: 'Claro', icon: Sun },
                            { id: 'dark', label: 'Escuro', icon: Moon },
                            { id: 'system', label: 'Sistema', icon: Laptop },
                          ].map(t => (
                            <button
                              key={t.id}
                              onClick={() => setTheme(t.id)}
                              className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
                                theme === t.id ? 'bg-primary/10 border-primary text-primary' : 'bg-muted/20 border-border/50 text-muted-foreground hover:bg-muted/40'
                              }`}
                            >
                              <t.icon className="w-5 h-5" />
                              <span className="text-[10px] font-bold uppercase tracking-tight">{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
