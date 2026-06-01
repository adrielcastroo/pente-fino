import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
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
import { KeyRound, AlertTriangle, Loader2, ShieldCheck, QrCode, Copy, RefreshCw } from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import TeamPanel from '@/components/settings/TeamPanel';
import LotesMestresPanel from '@/components/settings/LotesMestresPanel';
import LabelLayoutPanel from '@/components/settings/LabelLayoutPanel';
import SettingsErrorBoundary from '@/components/SettingsErrorBoundary';

const categories = [
  { id: 'profile', name: 'Perfil / Conta', icon: User, description: 'Gerencie suas informações pessoais e de conta.' },
  { id: 'preferences', name: 'Preferências', icon: Settings, description: 'Ajuste o comportamento do sistema.' },
  { id: 'appearance', name: 'Aparência', icon: Palette, description: 'Personalize o visual e as cores.' },
  { id: 'label-layout', name: 'Layout Etiqueta', icon: QrCode, description: 'Personalize o layout e tamanho da etiqueta de estocagem.' },
  { id: 'integrations', name: 'Integrações', icon: LinkIcon, description: 'Conecte ferramentas externas.' },
  { id: 'lotes-mestres', name: 'Lotes Mestres', icon: Palette, description: 'Tonalidades de referência para classificar lâminas de madeira.' },
  { id: 'security', name: 'Segurança', icon: Shield, description: 'Proteja sua conta com senhas e autenticação de dois fatores.' },
  { id: 'users', name: 'Equipe', icon: Users, description: 'Gerencie membros e acessos.' },
];

export default function SettingsPage() {
  const { user, profile, isGuest, signOut } = useAuth();
  const [activeCategory, setActiveCategory] = useState('profile');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const setFormData = useAppStore(s => s.setFormData);
  const dashboardDialogTheme = useAppStore(s => s.dashboardDialogTheme);
  const setDashboardDialogTheme = useAppStore(s => s.setDashboardDialogTheme);

  useEffect(() => {
    setFormData({ activeTab: 'settings' });
  }, [setFormData]);


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
  const [newEmail, setNewEmail] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);

  // Preferences
  const [prefSidebarCollapsed, setPrefSidebarCollapsed] = useState(localStorage.getItem('pref_sidebar_collapsed') === 'true');
  const [prefDefaultTab, setPrefDefaultTab] = useState(localStorage.getItem('pref_default_tab') || 'inicio');
  const [prefConfirmDelete, setPrefConfirmDelete] = useState(localStorage.getItem('pref_confirm_delete') !== 'false');
  const [prefSoundFeedback, setPrefSoundFeedback] = useState(localStorage.getItem('pref_sound_feedback') === 'true');
  const [prefAutoArchive, setPrefAutoArchive] = useState(localStorage.getItem('pref_auto_archive') === 'true');
  const [prefCompactTables, setPrefCompactTables] = useState(localStorage.getItem('pref_compact_tables') === 'true');

  // MFA state
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaEnrolling, setMfaEnrolling] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaVerifyCode, setMfaVerifyCode] = useState('');
  const [mfaVerifying, setMfaVerifying] = useState(false);

  const loadMfaFactors = async () => {
    if (isGuest || !user) return;
    setMfaLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      setMfaFactors(data?.totp || []);
    } catch (e: any) {
      console.error('MFA list error:', e);
    } finally {
      setMfaLoading(false);
    }
  };

  useEffect(() => {
    if (activeCategory === 'security' && !isGuest && user) {
      loadMfaFactors();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, isGuest, user]);

  const startMfaEnroll = async () => {
    setMfaEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
      if (error) throw error;
      setMfaQrCode(data.totp.qr_code);
      setMfaSecret(data.totp.secret);
      setMfaFactorId(data.id);
    } catch (e: any) {
      toast.error('Erro ao iniciar MFA: ' + e.message);
      setMfaEnrolling(false);
    }
  };

  const verifyMfaEnroll = async () => {
    if (!mfaFactorId || mfaVerifyCode.length !== 6) {
      toast.error('Digite o código de 6 dígitos.');
      return;
    }
    setMfaVerifying(true);
    try {
      const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challengeErr) throw challengeErr;
      const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaVerifyCode,
      });
      if (verifyErr) throw verifyErr;
      toast.success('Autenticação de dois fatores ativada!');
      setMfaQrCode(null);
      setMfaSecret(null);
      setMfaFactorId(null);
      setMfaVerifyCode('');
      setMfaEnrolling(false);
      await loadMfaFactors();
    } catch (e: any) {
      toast.error('Código inválido: ' + e.message);
    } finally {
      setMfaVerifying(false);
    }
  };

  const cancelMfaEnroll = async () => {
    if (mfaFactorId) {
      try { await supabase.auth.mfa.unenroll({ factorId: mfaFactorId }); } catch {}
    }
    setMfaQrCode(null);
    setMfaSecret(null);
    setMfaFactorId(null);
    setMfaVerifyCode('');
    setMfaEnrolling(false);
  };

  const removeMfaFactor = async (factorId: string) => {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      toast.success('MFA desativado.');
      await loadMfaFactors();
    } catch (e: any) {
      toast.error('Erro ao remover MFA: ' + e.message);
    }
  };

  const copySecret = () => {
    if (mfaSecret) {
      navigator.clipboard.writeText(mfaSecret);
      toast.success('Segredo copiado!');
    }
  };

  const handleSignOutAll = async () => {
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' } as any);
      if (error) throw error;
      toast.success('Todas as sessões foram encerradas.');
      navigate('/login');
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    }
  };

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

  const handleChangeEmail = async () => {
    const trimmed = newEmail.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Digite um e-mail válido.');
      return;
    }
    setChangingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed });
      if (error) throw error;
      toast.success('Confirmação enviada para o novo e-mail. Verifique sua caixa de entrada.');
      setNewEmail('');
    } catch (e: any) {
      toast.error('Erro ao alterar e-mail: ' + e.message);
    } finally {
      setChangingEmail(false);
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
      } else if (activeCategory === 'preferences') {
        localStorage.setItem('pref_sidebar_collapsed', String(prefSidebarCollapsed));
        localStorage.setItem('pref_default_tab', prefDefaultTab);
        localStorage.setItem('pref_confirm_delete', String(prefConfirmDelete));
        localStorage.setItem('pref_sound_feedback', String(prefSoundFeedback));
        localStorage.setItem('pref_auto_archive', String(prefAutoArchive));
        localStorage.setItem('pref_compact_tables', String(prefCompactTables));
      }
      
      toast.success('Configurações salvas com sucesso!');
      setHasUnsavedChanges(false);
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    }
  };

  const labelSettings = useAppStore(s => s.labelSettings);
  const setLabelSettings = useAppStore(s => s.setLabelSettings);

  const filteredCategories = useMemo(() => 
    categories.filter(cat => 
      cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      cat.description.toLowerCase().includes(searchQuery.toLowerCase())
    ), [searchQuery]);

  return (
    <div className="flex flex-col h-full space-y-4 sm:space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto px-1 sm:px-0">
      <header className="flex flex-row items-center justify-between gap-3 border-b border-border/10 pb-4 sm:pb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight text-foreground">Configurações</h1>
          <p className="text-muted-foreground text-[10px] sm:text-sm hidden sm:block">Gerencie sua conta e preferências.</p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="animate-pulse bg-amber-500/10 text-amber-500 border-amber-500/20 py-1">
              Alterações pendentes
            </Badge>
          )}
          <Button onClick={saveSettings} disabled={!hasUnsavedChanges} className="gap-1.5 sm:gap-2 shadow-lg shadow-primary/20 font-bold px-4 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm">
            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Salvar
          </Button>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 items-start">
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

          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar -mx-1 px-1">
            {filteredCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all duration-300 group whitespace-nowrap lg:whitespace-normal shrink-0 lg:shrink ${
                  activeCategory === cat.id 
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/10' 
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                <cat.icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${activeCategory === cat.id ? 'text-white' : 'group-hover:text-primary'}`} />
                <span>{cat.name}</span>
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
                            {profile?.display_name || "Usuário"}
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

                  {activeCategory === 'preferences' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Iniciar com Sidebar Recolhida</Label>
                          <p className="text-xs text-muted-foreground">O menu lateral abrirá fechado por padrão. Maximiza a área de trabalho.</p>
                        </div>
                        <Switch checked={prefSidebarCollapsed} onCheckedChange={(v) => { setPrefSidebarCollapsed(v); setHasUnsavedChanges(true); }} />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Tabelas Compactas</Label>
                          <p className="text-xs text-muted-foreground">Reduz espaçamento das tabelas para exibir mais dados por tela.</p>
                        </div>
                        <Switch checked={prefCompactTables} onCheckedChange={(v) => { setPrefCompactTables(v); setHasUnsavedChanges(true); }} />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Confirmar Exclusões</Label>
                          <p className="text-xs text-muted-foreground">Exibe diálogo de confirmação antes de excluir registros.</p>
                        </div>
                        <Switch checked={prefConfirmDelete} onCheckedChange={(v) => { setPrefConfirmDelete(v); setHasUnsavedChanges(true); }} />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Feedback Sonoro de Bipagem</Label>
                          <p className="text-xs text-muted-foreground">Emite som ao bipar códigos com sucesso ou erro.</p>
                        </div>
                        <Switch checked={prefSoundFeedback} onCheckedChange={(v) => { setPrefSoundFeedback(v); setHasUnsavedChanges(true); }} />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/20 border border-border/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Arquivamento Automático</Label>
                          <p className="text-xs text-muted-foreground">Arquiva conferências automaticamente ao trocar de processo/NF.</p>
                        </div>
                        <Switch checked={prefAutoArchive} onCheckedChange={(v) => { setPrefAutoArchive(v); setHasUnsavedChanges(true); }} />
                      </div>

                      <div className="p-4 rounded-2xl bg-muted/20 border border-border/10 space-y-2">
                        <Label className="text-sm font-bold">Tela Inicial</Label>
                        <p className="text-xs text-muted-foreground">Aba aberta ao iniciar o aplicativo.</p>
                        <Select value={prefDefaultTab} onValueChange={(v) => { setPrefDefaultTab(v); setHasUnsavedChanges(true); }}>
                          <SelectTrigger className="bg-background/50 mt-2"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inicio">Início (Dashboard)</SelectItem>
                            <SelectItem value="tecido">Tecido</SelectItem>
                            <SelectItem value="madeira">Madeira</SelectItem>
                            <SelectItem value="motor">Motor/Controle</SelectItem>
                            <SelectItem value="estoque">Estoque</SelectItem>
                            <SelectItem value="saida">Saída</SelectItem>
                            <SelectItem value="table">Tabela</SelectItem>
                            <SelectItem value="history">Histórico</SelectItem>
                          </SelectContent>
                        </Select>
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

                      <div className="p-4 rounded-2xl bg-muted/20 border border-border/10 space-y-4 mt-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-bold">Tema dos Diálogos do Dashboard</Label>
                            <p className="text-xs text-muted-foreground">Escolha o tema para os popups detalhados do Dashboard.</p>
                          </div>
                          <div className="flex bg-background/50 p-1 rounded-xl border border-border/20">
                            <button 
                              onClick={() => { setDashboardDialogTheme('light'); setHasUnsavedChanges(true); }}
                              className={cn(
                                "p-2 rounded-lg transition-all",
                                dashboardDialogTheme === 'light' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Sun className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => { setDashboardDialogTheme('dark'); setHasUnsavedChanges(true); }}
                              className={cn(
                                "p-2 rounded-lg transition-all",
                                dashboardDialogTheme === 'dark' ? "bg-slate-900 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Moon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
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

                      <div className="space-y-4 pt-4 border-t border-border/10">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-bold flex items-center gap-2">
                              Impressão Automática PPLA
                              <Badge variant="outline" className={labelSettings.autoPrint ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5" : "text-muted-foreground"}>
                                {labelSettings.autoPrint ? "Ativa" : "Desativada"}
                              </Badge>
                            </h4>
                            <p className="text-xs text-muted-foreground">Dispara etiqueta para n8n local ao bipar.</p>
                          </div>
                          <Switch 
                            checked={labelSettings.autoPrint} 
                            onCheckedChange={(val) => { setLabelSettings({ autoPrint: val }); setHasUnsavedChanges(true); }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">URL do Webhook (n8n)</Label>
                          <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input 
                              value={labelSettings.webhookUrl}
                              onChange={(e) => { setLabelSettings({ webhookUrl: e.target.value }); setHasUnsavedChanges(true); }}
                              className="pl-9 text-sm bg-muted/20 font-mono"
                              placeholder="http://172.18.224.1:5678/webhook-test/..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeCategory === 'label-layout' && (
                    <LabelLayoutPanel />
                  )}

                  {activeCategory === 'security' && (
                    <div className="space-y-8">
                      {isGuest ? (
                        <div className="py-12 text-center space-y-3">
                          <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto">
                            <Shield className="w-7 h-7 text-muted-foreground" />
                          </div>
                          <h4 className="font-bold">Acesso Restrito</h4>
                          <p className="text-sm text-muted-foreground">Faça login para gerenciar a segurança da sua conta.</p>
                        </div>
                      ) : (
                        <>
                          {/* Change Email */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-primary" />
                              <h4 className="text-sm font-black uppercase tracking-wider">Alterar E-mail</h4>
                            </div>
                            <div className="space-y-3 p-5 rounded-2xl bg-muted/20 border border-border/20">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">E-mail Atual</Label>
                                <Input value={user?.email || ''} disabled className="bg-muted/10 border-border/20 opacity-60 h-11" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Novo E-mail</Label>
                                <div className="relative">
                                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    type="email"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                    placeholder="novo@email.com"
                                    className="pl-9 bg-background/50 h-11"
                                  />
                                </div>
                                <p className="text-[10px] text-muted-foreground">Você receberá um link de confirmação no novo endereço.</p>
                              </div>
                              <Button onClick={handleChangeEmail} disabled={changingEmail || !newEmail} className="w-full font-bold">
                                {changingEmail ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                                Atualizar E-mail
                              </Button>
                            </div>
                          </div>

                          {/* Change Display Name */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              <h4 className="text-sm font-black uppercase tracking-wider">Alterar Nome de Exibição</h4>
                            </div>
                            <div className="space-y-3 p-5 rounded-2xl bg-muted/20 border border-border/20">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nome de Exibição</Label>
                                <Input
                                  value={displayName}
                                  onChange={(e) => { setDisplayName(e.target.value); setHasUnsavedChanges(true); }}
                                  className="bg-background/50 h-11"
                                  placeholder="Seu nome no sistema"
                                />
                              </div>
                              <Button
                                onClick={async () => {
                                  if (!user) return;
                                  try {
                                    const { error } = await supabase.from('profiles').update({ display_name: displayName.trim(), updated_at: new Date().toISOString() }).eq('id', user.id);
                                    if (error) throw error;
                                    toast.success('Nome atualizado com sucesso!');
                                    setHasUnsavedChanges(false);
                                  } catch (e: any) { toast.error('Erro: ' + e.message); }
                                }}
                                disabled={!displayName.trim()}
                                className="w-full font-bold"
                              >
                                <User className="w-4 h-4 mr-2" />
                                Atualizar Nome
                              </Button>
                            </div>
                          </div>

                          {/* Change Password */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <KeyRound className="w-4 h-4 text-primary" />
                              <h4 className="text-sm font-black uppercase tracking-wider">Alterar Senha</h4>
                            </div>
                            <div className="space-y-3 p-5 rounded-2xl bg-muted/20 border border-border/20">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Nova Senha</Label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="pl-9 pr-10 bg-background/50 h-11"
                                    placeholder="Mínimo 8 caracteres"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                  >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Confirmar Nova Senha</Label>
                                <div className="relative">
                                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                  <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="pl-9 bg-background/50 h-11"
                                    placeholder="Repita a senha"
                                  />
                                </div>
                              </div>
                              <Button
                                onClick={handleChangePassword}
                                disabled={changingPassword || !newPassword || !confirmPassword}
                                className="w-full font-bold"
                              >
                                {changingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <KeyRound className="w-4 h-4 mr-2" />}
                                Atualizar Senha
                              </Button>
                            </div>
                          </div>

                          {/* MFA */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-primary" />
                              <h4 className="text-sm font-black uppercase tracking-wider">Autenticação em Dois Fatores (2FA)</h4>
                            </div>
                            <div className="p-5 rounded-2xl bg-muted/20 border border-border/20 space-y-4">
                              {mfaLoading ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : mfaFactors.filter(f => f.status === 'verified').length > 0 ? (
                                <div className="space-y-3">
                                  {mfaFactors.filter(f => f.status === 'verified').map(factor => (
                                    <div key={factor.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                      <div className="flex items-center gap-3">
                                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                                        <div>
                                          <p className="text-sm font-bold">App Autenticador</p>
                                          <p className="text-xs text-muted-foreground">Ativado em {new Date(factor.created_at).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                      </div>
                                      <Button variant="ghost" size="sm" onClick={() => removeMfaFactor(factor.id)} className="text-destructive hover:text-destructive font-bold">
                                        Remover
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : mfaQrCode ? (
                                <div className="space-y-4">
                                  <p className="text-xs text-muted-foreground">
                                    Escaneie o QR Code com seu app autenticador (Google Authenticator, Authy, 1Password, etc.) e digite o código de 6 dígitos abaixo.
                                  </p>
                                  <div className="flex justify-center p-4 bg-white rounded-xl">
                                    <div dangerouslySetInnerHTML={{ __html: mfaQrCode }} />
                                  </div>
                                  {mfaSecret && (
                                    <div className="space-y-1">
                                      <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Ou insira manualmente</Label>
                                      <div className="flex gap-2">
                                        <Input value={mfaSecret} readOnly className="font-mono text-xs bg-background/50" />
                                        <Button variant="outline" size="icon" onClick={copySecret}>
                                          <Copy className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Código de Verificação</Label>
                                    <Input
                                      value={mfaVerifyCode}
                                      onChange={(e) => setMfaVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                      placeholder="000000"
                                      className="font-mono text-center text-lg tracking-[0.5em] h-12"
                                      maxLength={6}
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button onClick={cancelMfaEnroll} variant="outline" className="flex-1 font-bold" disabled={mfaVerifying}>
                                      Cancelar
                                    </Button>
                                    <Button onClick={verifyMfaEnroll} disabled={mfaVerifying || mfaVerifyCode.length !== 6} className="flex-1 font-bold">
                                      {mfaVerifying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                                      Ativar 2FA
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  <div className="flex items-start gap-3">
                                    <QrCode className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                                    <div className="space-y-1">
                                      <p className="text-sm font-bold">Proteja sua conta com 2FA</p>
                                      <p className="text-xs text-muted-foreground leading-relaxed">
                                        Adicione uma camada extra de segurança exigindo um código do seu app autenticador além da senha.
                                      </p>
                                    </div>
                                  </div>
                                  <Button onClick={startMfaEnroll} disabled={mfaEnrolling} className="w-full font-bold">
                                    {mfaEnrolling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                                    Configurar 2FA
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Sign out all */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <LogOut className="w-4 h-4 text-primary" />
                              <h4 className="text-sm font-black uppercase tracking-wider">Sessões</h4>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/20">
                                <div className="space-y-0.5">
                                  <Label className="text-sm font-bold">Encerrar Sessão Atual</Label>
                                  <p className="text-xs text-muted-foreground">Sair desta conta neste dispositivo.</p>
                                </div>
                                <Button variant="outline" onClick={() => signOut()} className="font-bold">
                                  <LogOut className="w-4 h-4 mr-2" />
                                  Sair
                                </Button>
                              </div>
                              <div className="flex items-center justify-between p-5 rounded-2xl bg-muted/20 border border-border/20">
                                <div className="space-y-0.5">
                                  <Label className="text-sm font-bold">Encerrar Todas as Sessões</Label>
                                  <p className="text-xs text-muted-foreground">Desconectar de todos os dispositivos.</p>
                                </div>
                                <Button variant="outline" onClick={handleSignOutAll} className="font-bold">
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Encerrar Tudo
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Danger Zone */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-destructive" />
                              <h4 className="text-sm font-black uppercase tracking-wider text-destructive">Zona de Perigo</h4>
                            </div>
                            <div className="p-5 rounded-2xl bg-destructive/5 border border-destructive/20 space-y-4">
                              <div className="flex items-start gap-3">
                                <Trash2 className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                <div className="space-y-1">
                                  <h5 className="text-sm font-bold text-foreground">Excluir Conta Permanentemente</h5>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    Esta ação não pode ser desfeita. Todos os seus dados, conferências e configurações serão removidos permanentemente.
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="destructive"
                                onClick={() => setDeleteConfirmOpen(true)}
                                className="w-full font-bold"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir Minha Conta
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {activeCategory === 'users' && (
                    <SettingsErrorBoundary panelName="Equipe">
                      <TeamPanel />
                    </SettingsErrorBoundary>
                  )}

                  {activeCategory === 'lotes-mestres' && (
                    <LotesMestresPanel />
                  )}

                  {!['profile', 'appearance', 'performance', 'integrations', 'security', 'preferences', 'users', 'label-layout', 'lotes-mestres'].includes(activeCategory) && (
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

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Excluir conta permanentemente?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <span className="block">
                Esta ação <strong className="text-destructive">não pode ser desfeita</strong>. Sua conta, perfil, histórico de conferências e todas as configurações serão removidos permanentemente.
              </span>
              <span className="block pt-2">
                Para confirmar, digite <strong className="font-mono text-foreground">EXCLUIR</strong> abaixo:
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Digite EXCLUIR"
            className="font-mono"
            autoFocus
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingAccount} onClick={() => setDeleteConfirmText('')}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteAccount(); }}
              disabled={deletingAccount || deleteConfirmText !== 'EXCLUIR'}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAccount ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
