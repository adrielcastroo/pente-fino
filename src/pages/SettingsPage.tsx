import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { KeyRound, AlertTriangle, Loader2 } from 'lucide-react';
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
  LogOut,
  Zap,
  Eye,
  EyeOff,
  Activity,
  Trash2
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
import { supabase } from '@/integrations/supabase/client';

const categories = [
  { id: 'profile', name: 'Perfil / Conta', icon: User, description: 'Gerencie suas informações pessoais e de conta.' },
  { id: 'preferences', name: 'Preferências', icon: Settings, description: 'Ajuste o comportamento do sistema.' },
  { id: 'appearance', name: 'Aparência', icon: Palette, description: 'Personalize o visual e as cores.' },
  { id: 'integrations', name: 'Integrações', icon: LinkIcon, description: 'Conecte ferramentas externas.' },
  { id: 'security', name: 'Segurança', icon: Shield, description: 'Proteja sua conta.' },
  { id: 'users', name: 'Equipe', icon: Users, description: 'Gerencie membros e acessos.' },
];

export default function SettingsPage() {
  const { user, profile, isGuest, signOut } = useAuth();
  const [activeCategory, setActiveCategory] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState('');

  // Performance settings
  const [reduceAnimations, setReduceAnimations] = useState(localStorage.getItem('perf_reduce_animations') === 'true');
  const [lowDataMode, setLowDataMode] = useState(localStorage.getItem('perf_low_data') === 'true');

  useEffect(() => {
    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
  }, [profile]);

  const [orKey, setOrKey] = useState(localStorage.getItem('cft4_or_key') || '');
  const [orModel, setOrModel] = useState(localStorage.getItem('cft4_or_model') || 'anthropic/claude-3-haiku');

  // Security state
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast.error('A senha deve ter no mínimo 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error('Erro ao alterar senha: ' + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'EXCLUIR') {
      toast.error('Digite EXCLUIR para confirmar.');
      return;
    }
    setDeletingAccount(true);
    try {
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) throw error;
      toast.success('Conta excluída com sucesso.');
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error: any) {
      toast.error('Erro ao excluir conta: ' + error.message);
      setDeletingAccount(false);
    }
  };

  const saveSettings = async () => {
    try {
      if (activeCategory === 'integrations') {
        localStorage.setItem('cft4_or_key', orKey.trim());
        localStorage.setItem('cft4_or_model', orModel);
      } else if (activeCategory === 'profile' && !isGuest && user) {
        const { error } = await supabase
          .from('profiles')
          .update({ display_name: displayName.trim(), updated_at: new Date().toISOString() })
          .eq('id', user.id);
        if (error) throw error;
      } else if (activeCategory === 'performance') {
        localStorage.setItem('perf_reduce_animations', String(reduceAnimations));
        localStorage.setItem('perf_low_data', String(lowDataMode));
      }
      
      toast.success('Configurações salvas com sucesso!');
      setHasUnsavedChanges(false);
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    }
  };

  const filteredCategories = useMemo(() => 
    categories.filter(cat => 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      cat.description.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]);

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/10 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Configurações</h1>
          <p className="text-muted-foreground text-sm">Personalize sua experiência no Sistema Pente Fino.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="animate-pulse bg-amber-500/10 text-amber-500 border-amber-500/20 py-1">
              Alterações pendentes
            </Badge>
          )}
          <Button onClick={saveSettings} disabled={!hasUnsavedChanges} className="gap-2 shadow-lg shadow-primary/20 font-bold px-6">
            <Save className="w-4 h-4" />
            Salvar
          </Button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-64 space-y-4 shrink-0">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input 
              placeholder="Buscar..." 
              className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/30"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-1.5">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 group ${
                  activeCategory === cat.id 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10' 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <cat.icon className={`w-4 h-4 ${activeCategory === cat.id ? 'text-white' : 'group-hover:text-primary'}`} />
                <span className="truncate">{cat.name}</span>
              </button>
            ))}
          </nav>

          {!isGuest && (
            <div className="pt-4 mt-4 border-t border-border/10">
              <Button 
                variant="ghost" 
                onClick={() => signOut()} 
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/5 font-bold gap-3 rounded-2xl"
              >
                <LogOut className="w-4 h-4" />
                Sair do Sistema
              </Button>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <div className="flex-1 min-w-0 w-full lg:max-w-3xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-border/40 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden rounded-3xl">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      {categories.find(c => c.id === activeCategory)?.icon && 
                       (() => {
                         const Icon = categories.find(c => c.id === activeCategory)!.icon;
                         return <Icon className="w-5 h-5" />;
                       })()
                      }
                    </div>
                    <CardTitle className="text-xl font-black">{categories.find(c => c.id === activeCategory)?.name}</CardTitle>
                  </div>
                  <CardDescription className="text-sm font-medium opacity-70">
                    {categories.find(c => c.id === activeCategory)?.description}
                  </CardDescription>
                </CardHeader>
                
                <Separator className="bg-border/5" />
                
                <CardContent className="pt-6 space-y-6">
                  {activeCategory === 'profile' && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-5 p-4 rounded-2xl bg-muted/30 border border-border/20">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground">
                            {isGuest ? "Modo Visitante" : profile?.display_name || "Usuário"}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">{user?.email || "Sessão local"}</p>
                          <Badge className="mt-1.5 bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-wider">
                            {isGuest ? "Guest" : "Member"}
                          </Badge>
                        </div>
                      </div>

                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-[0.1em] opacity-60">Nome de Exibição</Label>
                          <Input 
                            value={displayName} 
                            onChange={(e) => { setDisplayName(e.target.value); setHasUnsavedChanges(true); }}
                            className="bg-muted/20 border-border/40 h-11 focus-visible:ring-primary/20"
                            placeholder="Seu nome no sistema"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-[0.1em] opacity-60">E-mail (Não alterável)</Label>
                          <Input 
                            value={user?.email || ''} 
                            disabled
                            className="bg-muted/10 border-border/20 opacity-50 cursor-not-allowed h-11"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'appearance' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-3">
                        {['light', 'dark', 'system'].map((t) => (
                          <button
                            key={t}
                            onClick={() => { setTheme(t); setHasUnsavedChanges(true); }}
                            className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center gap-3 ${
                              theme === t 
                                ? 'bg-primary/5 border-primary shadow-sm shadow-primary/5' 
                                : 'bg-muted/30 border-border/40 hover:border-border'
                            }`}
                          >
                            <div className={`p-2 rounded-xl ${theme === t ? 'bg-primary text-white' : 'bg-background text-muted-foreground'}`}>
                              {t === 'light' && <Sun className="w-5 h-5" />}
                              {t === 'dark' && <Moon className="w-5 h-5" />}
                              {t === 'system' && <Laptop className="w-5 h-5" />}
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${theme === t ? 'text-primary' : 'text-muted-foreground'}`}>
                              {t === 'light' ? 'Claro' : t === 'dark' ? 'Escuro' : 'Sistema'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeCategory === 'performance' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Reduzir Animações</Label>
                          <p className="text-xs text-muted-foreground">Melhora a fluidez em dispositivos lentos.</p>
                        </div>
                        <Switch 
                          checked={reduceAnimations} 
                          onCheckedChange={(val) => { setReduceAnimations(val); setHasUnsavedChanges(true); }}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Modo de Baixo Consumo</Label>
                          <p className="text-xs text-muted-foreground">Otimiza o carregamento de dados e gráficos.</p>
                        </div>
                        <Switch 
                          checked={lowDataMode} 
                          onCheckedChange={(val) => { setLowDataMode(val); setHasUnsavedChanges(true); }}
                        />
                      </div>
                      
                      <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-4">
                        <Activity className="w-5 h-5 text-amber-500 shrink-0" />
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-amber-500 uppercase">Dica de Performance</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Para dispositivos com pouca memória, ative a redução de animações para garantir uma navegação instantânea.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'integrations' && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold flex items-center gap-2">
                            OpenRouter AI
                            <Badge variant="outline" className={orKey ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-muted-foreground"}>
                              {orKey ? "Configurado" : "Pendente"}
                            </Badge>
                          </h4>
                          <Button variant="ghost" size="sm" className="text-xs font-bold text-primary" asChild>
                            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">Obter Chave</a>
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Chave de API</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              type="password"
                              value={orKey}
                              onChange={(e) => { setOrKey(e.target.value); setHasUnsavedChanges(true); }}
                              className="pl-9 font-mono text-sm bg-muted/20"
                              placeholder="sk-or-v1-..."
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Modelo Preferencial</Label>
                          <Select 
                            value={orModel} 
                            onValueChange={(val) => { setOrModel(val); setHasUnsavedChanges(true); }}
                          >
                            <SelectTrigger className="bg-muted/20 border-border/40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="anthropic/claude-3-haiku">Claude 3 Haiku (Rápido)</SelectItem>
                              <SelectItem value="anthropic/claude-3-sonnet">Claude 3 Sonnet (Preciso)</SelectItem>
                              <SelectItem value="google/gemini-pro-1.5">Gemini Pro 1.5</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {!['profile', 'appearance', 'performance', 'integrations'].includes(activeCategory) && (
                    <div className="py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto opacity-50">
                        <Settings className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold">Em breve</h4>
                        <p className="text-sm text-muted-foreground">Esta seção está sendo preparada para a próxima atualização.</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
