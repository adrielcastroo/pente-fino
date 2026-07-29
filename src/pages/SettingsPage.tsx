import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
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
import { KeyRound, AlertTriangle, Loader2, ShieldCheck, QrCode, Copy, RefreshCw, Info } from 'lucide-react';
import { 
  User, 
  Settings, 
  Link as LinkIcon, 
  Bell, 
  Shield, 
  Palette, 
  Cpu, 
  Users,
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/use-auth';
import { usePerformance } from '@/hooks/use-performance';

import { ROLE_LABEL, atLeast, type Role } from '@/lib/permissions';
import { supabase } from '@/integrations/supabase/client';
import TeamPanel from '@/components/settings/TeamPanel';
import LabelLayoutPanel from '@/components/settings/LabelLayoutPanel';
import ExpedicaoPanel from '@/components/settings/ExpedicaoPanel';
import { Truck } from 'lucide-react';
import SettingsErrorBoundary from '@/components/SettingsErrorBoundary';
import { setBipSoundEnabled, isBipSoundEnabled, bipSuccess } from '@/lib/bip-feedback';
import AugeUserCredentialsDialog from '@/components/auge/AugeUserCredentialsDialog';

type ModuleScope = 'estoque' | 'expedicao';
type Category = {
  id: string;
  name: string;
  icon: any;
  description: string;
  minRole?: Role;
  module?: ModuleScope; // se definido, só aparece dentro daquele módulo
};

const MODULE_LABEL: Record<ModuleScope, string> = {
  estoque: 'Estoque',
  expedicao: 'Expedição',
};

const CATEGORY_GROUPS: { id: 'account' | 'system'; label: string; minRole?: Role; items: Category[] }[] = [
  {
    id: 'account',
    label: 'Minha Conta',
    items: [
      { id: 'profile', name: 'Perfil / Conta', icon: User, description: 'Gerencie suas informações pessoais e de conta.' },
      { id: 'auge-account', name: 'Minha conta Auge', icon: KeyRound, description: 'Configure suas credenciais do Auge para ações no ERP.' },
      { id: 'appearance', name: 'Aparência', icon: Palette, description: 'Personalize o visual e as cores.' },
      { id: 'preferences', name: 'Preferências', icon: Settings, description: 'Ajuste o comportamento do sistema.' },
    ],
  },
  {
    id: 'system',
    label: 'Sistema',
    items: [
      { id: 'users', name: 'Equipe', icon: Users, description: 'Gerencie membros e acessos.', minRole: 'supervisor' },
      { id: 'security', name: 'Segurança', icon: Shield, description: 'Senha, autenticação de dois fatores e sessões.' },
      { id: 'integrations', name: 'Integrações', icon: LinkIcon, description: 'Conecte ferramentas externas.' },
      { id: 'label-layout', name: 'Layout Etiqueta', icon: QrCode, description: 'Personalize o layout e tamanho da etiqueta de estocagem.', module: 'estoque' },
      { id: 'expedicao', name: 'Expedição', icon: Truck, description: 'Transportadoras, webhooks de e-mail e importação automática de NF-e.', minRole: 'supervisor', module: 'expedicao' },
    ],
  },
];

// Compatibilidade com referências antigas a `categories`
const categories: Category[] = CATEGORY_GROUPS.flatMap(g => g.items);

export default function SettingsPage() {
  useDocumentTitle('Configurações');
  const { user, profile, isGuest, signOut, role } = useAuth();
  const [activeCategory, setActiveCategory] = useState('profile');
  
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveStateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSettingsRef = useRef<() => Promise<void>>();
  const { theme, setTheme } = useTheme();
  const [displayName, setDisplayName] = useState('');
  const [cargo, setCargo] = useState('');
  const [setor, setSetor] = useState('');
  const [telefone, setTelefone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const setFormData = useAppStore(s => s.setFormData);
  const dashboardDialogTheme = useAppStore(s => s.dashboardDialogTheme);
  const setDashboardDialogTheme = useAppStore(s => s.setDashboardDialogTheme);

  useEffect(() => {
    setFormData({ activeTab: 'settings' });
  }, [setFormData]);


  // Performance settings
  const [reduceAnimations, setReduceAnimations] = useState(localStorage.getItem('perf_reduce_animations') === 'true');
  const [lowDataMode, setLowDataMode] = useState(localStorage.getItem('perf_low_data') === 'true');
  const { level: perfLevel, isAuto: perfIsAuto, setLevel: perfSetLevel } = usePerformance();


  useEffect(() => {
    if (profile?.display_name) setDisplayName(profile.display_name);
    if ((profile as any)?.cargo !== undefined) setCargo((profile as any).cargo || '');
    if ((profile as any)?.setor !== undefined) setSetor((profile as any).setor || '');
    if ((profile as any)?.telefone !== undefined) setTelefone((profile as any).telefone || '');
    if (profile?.avatar_url) setAvatarUrl(profile.avatar_url);
    const remotePref = (profile as any)?.preferences?.disable_browser_print;
    if (typeof remotePref === 'boolean') {
      setPrefDisableBrowserPrint(remotePref);
      localStorage.setItem('pref_disable_browser_print', String(remotePref));
    }
    const remoteDirect = (profile as any)?.preferences?.disable_direct_print;
    if (typeof remoteDirect === 'boolean') {
      setPrefDisableDirectPrint(remoteDirect);
      localStorage.setItem('pref_disable_direct_print', String(remoteDirect));
    }
    const remoteN8n = (profile as any)?.preferences?.disable_n8n_print;
    if (typeof remoteN8n === 'boolean') {
      setPrefDisableN8nPrint(remoteN8n);
      localStorage.setItem('pref_disable_n8n_print', String(remoteN8n));
    }
  }, [profile]);

  const handleAvatarUpload = async (file: File) => {
    if (!user || isGuest) { toast.error('Faça login para alterar o avatar.'); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error('Imagem maior que 2MB.'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido. Use JPG, PNG ou WebP.'); return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
        upsert: true, contentType: file.type,
      });
      if (upErr) throw upErr;
      const { data: signed, error: signErr } = await supabase.storage
        .from('avatars').createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signErr) throw signErr;
      const url = signed.signedUrl;
      const { error: updErr } = await (supabase.from('profiles') as any)
        .update({ avatar_url: url, updated_at: new Date().toISOString() })
        .eq('id', user.id);
      if (updErr) throw updErr;
      setAvatarUrl(url);
      toast.success('Avatar atualizado!');
    } catch (e: any) {
      toast.error('Erro ao enviar avatar: ' + e.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const [orKey, setOrKey] = useState(localStorage.getItem('cft4_or_key') || '');
  const [orModel, setOrModel] = useState(localStorage.getItem('cft4_or_model') || 'anthropic/claude-3-haiku');
  const [n8nSapUrl, setN8nSapUrl] = useState(localStorage.getItem('n8n_sap_webhook_url') || '');
  const [n8nSapEnabled, setN8nSapEnabled] = useState(localStorage.getItem('n8n_sap_enabled') === 'true');
  const [n8nSapTesting, setN8nSapTesting] = useState(false);
  const [n8nSapTestCode, setN8nSapTestCode] = useState('');

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
  const [prefSoundFeedback, setPrefSoundFeedback] = useState(() => {
    try { return isBipSoundEnabled(); } catch { return true; }
  });
  const [prefAutoArchive, setPrefAutoArchive] = useState(localStorage.getItem('pref_auto_archive') === 'true');
  const [prefCompactTables, setPrefCompactTables] = useState(localStorage.getItem('pref_compact_tables') === 'true');
  const [prefDisableDirectPrint, setPrefDisableDirectPrint] = useState(localStorage.getItem('pref_disable_direct_print') === 'true');
  const [prefDisableBrowserPrint, setPrefDisableBrowserPrint] = useState(localStorage.getItem('pref_disable_browser_print') === 'true');
  const [prefDisableN8nPrint, setPrefDisableN8nPrint] = useState(localStorage.getItem('pref_disable_n8n_print') === 'true');
  const [prefSilentBrowserPrint, setPrefSilentBrowserPrint] = useState(localStorage.getItem('pref_silent_browser_print') === 'true');

  // Auge credentials state
  const [augeCredentialsOpen, setAugeCredentialsOpen] = useState(false);
  const [augeCredentialsConfigured, setAugeCredentialsConfigured] = useState<boolean | null>(null);
  const [augeCredentialsLoading, setAugeCredentialsLoading] = useState(false);

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

  const loadAugeCredentialsStatus = async () => {
    if (isGuest || !user) return;
    setAugeCredentialsLoading(true);
    try {
      const { data, error } = await (supabase.rpc as any)('i_have_auge_credentials');
      if (error) throw error;
      setAugeCredentialsConfigured(!!data);
    } catch (e: any) {
      console.error('Erro ao verificar credenciais do Auge:', e);
      setAugeCredentialsConfigured(false);
    } finally {
      setAugeCredentialsLoading(false);
    }
  };

  useEffect(() => {
    if (activeCategory === 'auge-account' && !isGuest && user) {
      loadAugeCredentialsStatus();
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
    setSaveState('saving');
    try {
      if (activeCategory === 'integrations') {
        localStorage.setItem('cft4_or_key', orKey.trim());
        localStorage.setItem('cft4_or_model', orModel);
        localStorage.setItem('n8n_sap_webhook_url', n8nSapUrl.trim());
        localStorage.setItem('n8n_sap_enabled', String(n8nSapEnabled));
      } else if (activeCategory === 'profile' && !isGuest && user) {
        const telefoneTrim = telefone.trim();
        if (telefoneTrim && !/^[0-9+\-\s()]{0,20}$/.test(telefoneTrim)) {
          toast.error('Telefone inválido. Use apenas dígitos, espaços, +, -, ( ).');
          return;
        }
        const { error } = await (supabase.from('profiles') as any)
          .update({
            display_name: displayName.trim(),
            cargo: cargo.trim() || null,
            setor: setor.trim() || null,
            telefone: telefoneTrim || null,
            updated_at: new Date().toISOString(),
          })
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
        localStorage.setItem('pref_disable_direct_print', String(prefDisableDirectPrint));
        localStorage.setItem('pref_disable_browser_print', String(prefDisableBrowserPrint));
        localStorage.setItem('pref_disable_n8n_print', String(prefDisableN8nPrint));
        localStorage.setItem('pref_silent_browser_print', String(prefSilentBrowserPrint));
        if (!isGuest && user) {
          const currentPrefs = ((profile as any)?.preferences && typeof (profile as any).preferences === 'object')
            ? (profile as any).preferences
            : {};
          const { error } = await supabase
            .from('profiles')
            .update({
              preferences: {
                ...currentPrefs,
                disable_direct_print: prefDisableDirectPrint,
                disable_browser_print: prefDisableBrowserPrint,
                disable_n8n_print: prefDisableN8nPrint,
              },
              updated_at: new Date().toISOString(),
            } as any)
            .eq('id', user.id);
          if (error) throw error;
        }
      }
      
      setHasUnsavedChanges(false);
      setSaveState('saved');
      if (saveStateTimeoutRef.current) clearTimeout(saveStateTimeoutRef.current);
      saveStateTimeoutRef.current = setTimeout(() => setSaveState('idle'), 1500);
    } catch (error: any) {
      setSaveState('idle');
      toast.error('Erro ao salvar: ' + error.message);
    }
  };

  // Mantém ref atualizada com o saveSettings mais recente (closure-safe para debounce)
  saveSettingsRef.current = saveSettings;

  // Auto-save com debounce de 800ms após qualquer alteração
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handle = setTimeout(() => {
      saveSettingsRef.current?.();
    }, 800);
    return () => clearTimeout(handle);
  }, [hasUnsavedChanges]);

  useEffect(() => () => {
    if (saveStateTimeoutRef.current) clearTimeout(saveStateTimeoutRef.current);
  }, []);



  const labelSettings = useAppStore(s => s.labelSettings);
  const setLabelSettings = useAppStore(s => s.setLabelSettings);

  const location = useLocation();
  const currentModule: ModuleScope | null = location.pathname.startsWith('/expedicao')
    ? 'expedicao'
    : location.pathname.startsWith('/estoque')
      ? 'estoque'
      : null;

  const visibleGroups = useMemo(
    () => CATEGORY_GROUPS
      .map(g => ({
        ...g,
        items: g.items.filter(item =>
          (!item.minRole || atLeast(role, item.minRole)) &&
          (!item.module || item.module === currentModule)
        ),
      }))
      .filter(g => g.items.length > 0 && (!g.minRole || atLeast(role, g.minRole))),
    [role, currentModule]
  );
  const allVisible = useMemo(() => visibleGroups.flatMap(g => g.items), [visibleGroups]);
  const activeMeta = allVisible.find(c => c.id === activeCategory) ?? allVisible[0];

  useEffect(() => {
    if (activeMeta && activeMeta.id !== activeCategory) {
      setActiveCategory(activeMeta.id);
    }
  }, [activeMeta, activeCategory]);

  const roleLabel = role ? ROLE_LABEL[role] : (isGuest ? 'Visitante' : 'Sem perfil');

  return (
    <TooltipProvider>
    <div className="flex flex-col h-full space-y-4 sm:space-y-6 animate-in fade-in duration-500 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pb-24">
      <header className="flex flex-col gap-4 sm:gap-6 pb-6 sm:pb-8 pt-4 sm:pt-2 no-print">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground leading-tight">
              Configurações
            </h1>
            <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground font-medium mt-1">
              <span>Configurações</span>
              <span className="opacity-50">/</span>
              <span className="text-foreground/80">{activeMeta?.name ?? '—'}</span>
            </nav>
          </div>
        </motion.div>
      </header>

      {/* Horizontal tabs — alinhado com o resto do app (full-width, sem sidebar lateral) */}
      <div className="border-b border-border/40 -mx-2 sm:-mx-4 lg:-mx-6 px-2 sm:px-4 lg:px-6">
        <div className="flex items-end gap-6 overflow-x-auto no-scrollbar">
          {visibleGroups.flatMap(g => g.items).map((cat) => {
            const active = activeCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-1 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  active
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{cat.name}</span>
                {cat.module && (
                  <span
                    className="ml-1 inline-flex items-center rounded-sm border border-primary/30 bg-primary/10 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-primary"
                    title={`Configuração exclusiva do módulo ${MODULE_LABEL[cat.module]}`}
                  >
                    {MODULE_LABEL[cat.module]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:gap-6 items-start">
        {/* Content Area — full-width */}
        <div className="flex-1 min-w-0 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="settings-card rounded-md border border-border bg-card shadow-sm overflow-hidden">
                <CardHeader className="p-5 sm:p-6 border-b border-border/40">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-md bg-primary/10 border border-primary/20 text-primary">
                      {categories.find(c => c.id === activeCategory)?.icon && 
                       (() => {
                         const Icon = categories.find(c => c.id === activeCategory)!.icon;
                         return <Icon className="w-5 h-5" strokeWidth={1.75} />;
                       })()
                      }
                    </div>
                    <CardTitle className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                      {categories.find(c => c.id === activeCategory)?.name}
                      {(() => {
                        const mod = categories.find(c => c.id === activeCategory)?.module;
                        return mod ? (
                          <span className="inline-flex items-center rounded-sm border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                            Somente {MODULE_LABEL[mod]}
                          </span>
                        ) : null;
                      })()}
                    </CardTitle>
                  </div>
                  <CardDescription className="text-sm text-muted-foreground">
                    {categories.find(c => c.id === activeCategory)?.description}
                  </CardDescription>
                </CardHeader>

                
                <CardContent className="pt-6 space-y-6">
                  {activeCategory === 'profile' && (
                    <div className="space-y-6">
                      <div className="flex items-center gap-5 p-4 rounded-md bg-muted/30 border border-border/20">
                        <div className="relative group">
                          <div className="w-16 h-16 rounded-md bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-8 h-8 text-primary" />
                            )}
                          </div>
                          {!isGuest && (
                            <label
                              htmlFor="avatar-upload"
                              className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-md opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
                              title="Alterar avatar"
                            >
                              {uploadingAvatar ? (
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                              ) : (
                                <Palette className="w-5 h-5 text-white" />
                              )}
                              <input
                                id="avatar-upload"
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                className="hidden"
                                disabled={uploadingAvatar}
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) handleAvatarUpload(f);
                                  e.target.value = '';
                                }}
                              />
                            </label>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-foreground">
                            {profile?.display_name || "Usuário"}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">{user?.email || "Sessão local"}</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="mt-1.5 bg-muted text-muted-foreground border border-border/60 text-xs font-medium normal-case tracking-normal cursor-help">
                                {isGuest ? 'Visitante' : roleLabel}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs text-xs">
                              {isGuest
                                ? 'Sessão local sem persistência. Faça login para acessar todas as funcionalidades.'
                                : role === 'admin' ? 'Acesso total: gerenciar usuários, sistema, auditoria, e todas as operações.'
                                : role === 'gerente' ? 'Acesso a relatórios executivos, auditoria e operações de supervisão.'
                                : role === 'supervisor' ? 'Pode editar registros antigos, excluir e gerenciar cadastros/estoque.'
                                : 'Acesso operacional: criar registros e dar saída em estoque.'}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Nome de Exibição</Label>
                          <Input
                            value={displayName}
                            onChange={(e) => { setDisplayName(e.target.value); setHasUnsavedChanges(true); }}
                            className="bg-muted/20 border-border/40 h-11"
                            placeholder="Seu nome no sistema"
                            maxLength={80}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                            E-mail
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-muted-foreground cursor-help">(?)</span>
                              </TooltipTrigger>
                              <TooltipContent className="text-xs">Usado para login — não editável aqui.</TooltipContent>
                            </Tooltip>
                          </Label>
                          <Input
                            value={user?.email || ''}
                            disabled
                            className="bg-muted/10 border-border/20 opacity-50 cursor-not-allowed h-11"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Cargo</Label>
                          <Input
                            value={cargo}
                            onChange={(e) => { setCargo(e.target.value); setHasUnsavedChanges(true); }}
                            className="bg-muted/20 border-border/40 h-11"
                            placeholder="Ex: Operador de Estoque"
                            maxLength={60}
                            disabled={isGuest}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Setor</Label>
                          <Input
                            value={setor}
                            onChange={(e) => { setSetor(e.target.value); setHasUnsavedChanges(true); }}
                            className="bg-muted/20 border-border/40 h-11"
                            placeholder="Ex: Logística"
                            maxLength={60}
                            disabled={isGuest}
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label className="text-sm font-medium text-muted-foreground">Telefone</Label>
                          <Input
                            value={telefone}
                            onChange={(e) => { setTelefone(e.target.value); setHasUnsavedChanges(true); }}
                            className="bg-muted/20 border-border/40 h-11"
                            placeholder="(11) 99999-0000"
                            maxLength={20}
                            disabled={isGuest}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'auge-account' && (
                    <div className="space-y-6">
                      {isGuest ? (
                        <div className="py-12 text-center space-y-3">
                          <div className="w-14 h-14 bg-muted rounded-md flex items-center justify-center mx-auto">
                            <KeyRound className="w-7 h-7 text-muted-foreground" />
                          </div>
                          <h4 className="font-bold">Acesso Restrito</h4>
                          <p className="text-sm text-muted-foreground">Faça login para configurar suas credenciais do Auge.</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-4 p-4 rounded-md bg-muted/30 border border-border/20">
                            <div className="space-y-1">
                              <h4 className="text-sm font-semibold flex items-center gap-2">
                                <KeyRound className="w-4 h-4 text-primary" />
                                Credenciais do Auge
                              </h4>
                              <p className="text-xs text-muted-foreground max-w-md">
                                Para realizar transferências, entradas e outras ações no Auge pelo Pente Fino,
                                você precisa informar suas próprias credenciais de acesso ao ERP.
                              </p>
                            </div>
                            {augeCredentialsLoading ? (
                              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                            ) : augeCredentialsConfigured ? (
                              <Badge variant="outline" className="text-success border-emerald-500/20 bg-emerald-500/5 shrink-0">
                                Configuradas
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-600 border-amber-500/20 bg-amber-500/5 shrink-0">
                                Pendentes
                              </Badge>
                            )}
                          </div>

                          <div className="p-4 rounded-md border border-border/20 bg-muted/20 space-y-3">
                            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span>
                                Suas credenciais ficam vinculadas apenas à sua conta e são usadas para autenticar
                                você — e somente você — no Auge. Nenhum outro usuário tem acesso.
                              </span>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-muted-foreground">
                              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <span>
                                Sem essas credenciais, as ações no Auge ficam bloqueadas para você.
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                            <Button
                              onClick={() => setAugeCredentialsOpen(true)}
                              className="h-11 gap-2"
                            >
                              <KeyRound className="w-4 h-4" />
                              {augeCredentialsConfigured ? 'Atualizar credenciais' : 'Configurar credenciais'}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={loadAugeCredentialsStatus}
                              disabled={augeCredentialsLoading}
                              className="h-11 gap-2"
                            >
                              {augeCredentialsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                              Verificar status
                            </Button>
                          </div>
                        </>
                      )}

                      <AugeUserCredentialsDialog
                        open={augeCredentialsOpen}
                        onOpenChange={setAugeCredentialsOpen}
                        onSaved={() => {
                          setAugeCredentialsConfigured(true);
                          toast.success('Credenciais do Auge atualizadas.');
                        }}
                      />
                    </div>
                  )}

                  {activeCategory === 'preferences' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-md bg-muted/20 border border-border/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Iniciar com Sidebar Recolhida</Label>
                          <p className="text-xs text-muted-foreground">O menu lateral abrirá fechado por padrão. Maximiza a área de trabalho.</p>
                        </div>
                        <Switch checked={prefSidebarCollapsed} onCheckedChange={(v) => { setPrefSidebarCollapsed(v); setHasUnsavedChanges(true); }} />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-md bg-muted/20 border border-border/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Tabelas Compactas</Label>
                          <p className="text-xs text-muted-foreground">Reduz espaçamento das tabelas para exibir mais dados por tela.</p>
                        </div>
                        <Switch checked={prefCompactTables} onCheckedChange={(v) => { setPrefCompactTables(v); setHasUnsavedChanges(true); }} />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-md bg-muted/20 border border-border/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Confirmar Exclusões</Label>
                          <p className="text-xs text-muted-foreground">Exibe diálogo de confirmação antes de excluir registros.</p>
                        </div>
                        <Switch checked={prefConfirmDelete} onCheckedChange={(v) => { setPrefConfirmDelete(v); setHasUnsavedChanges(true); }} />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-md bg-muted/20 border border-border/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Feedback Sonoro de Bipagem</Label>
                          <p className="text-xs text-muted-foreground">Emite som ao bipar códigos com sucesso ou erro.</p>
                        </div>
                        <Switch checked={prefSoundFeedback} onCheckedChange={(v) => { setPrefSoundFeedback(v); setBipSoundEnabled(v); setHasUnsavedChanges(true); if (v) bipSuccess(); }} />
                      </div>


                      <div className="flex items-center justify-between p-4 rounded-md bg-muted/20 border border-border/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Arquivamento Automático</Label>
                          <p className="text-xs text-muted-foreground">Arquiva conferências automaticamente ao trocar de processo/NF.</p>
                        </div>
                        <Switch checked={prefAutoArchive} onCheckedChange={(v) => { setPrefAutoArchive(v); setHasUnsavedChanges(true); }} />
                      </div>

                      <div className="p-4 rounded-md bg-muted/20 border border-border/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-bold">Desabilitar Impressão pelo Navegador</Label>
                            <p className="text-xs text-muted-foreground">Bloqueia o diálogo de impressão do navegador. O disparo via n8n (webhook) continua funcionando normalmente.</p>
                          </div>
                          <Switch checked={prefDisableBrowserPrint} onCheckedChange={(v) => { setPrefDisableBrowserPrint(v); setHasUnsavedChanges(true); }} />
                        </div>

                        {/* Sub-opção: impressão silenciosa (filha da impressão pelo navegador) */}
                        <div className={`ml-4 pl-4 border-l-2 border-border/30 pt-2 ${prefDisableBrowserPrint ? 'opacity-50 pointer-events-none' : ''}`}>
                          <div className="flex items-center justify-between gap-4">
                            <div className="space-y-0.5">
                              <Label className="text-sm font-bold">Impressão Silenciosa (sem diálogo)</Label>
                              <p className="text-xs text-muted-foreground">
                                Imprime direto na impressora padrão, <b>sem abrir a janela de impressão</b>.
                                Ideal para quem imprime várias etiquetas seguidas e não quer clicar em "Imprimir" toda vez.
                              </p>
                            </div>
                            <Switch
                              checked={prefSilentBrowserPrint}
                              disabled={prefDisableBrowserPrint}
                              onCheckedChange={(v) => { setPrefSilentBrowserPrint(v); setHasUnsavedChanges(true); }}
                            />
                          </div>
                          {prefSilentBrowserPrint && (
                            <div className="mt-3 p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-xs space-y-2">
                              <p className="font-bold text-warning">⚠️ Requer configuração no navegador</p>
                              <p className="text-muted-foreground">
                                Por segurança, navegadores <b>não permitem</b> impressão silenciosa por padrão.
                                Para funcionar, é preciso abrir o Chrome/Edge com uma "flag" especial:
                              </p>
                              <div className="rounded bg-background/60 border border-border/40 p-2 font-mono text-[11px] break-all">
                                chrome.exe --kiosk-printing
                              </div>
                              <p className="text-muted-foreground">
                                <b>Como fazer no Windows:</b> clique com o direito no atalho do Chrome →
                                Propriedades → em "Destino", adicione <code className="bg-background/60 px-1 rounded">--kiosk-printing</code> no final →
                                OK. Abra o Chrome por esse atalho.
                              </p>
                              <p className="text-muted-foreground">
                                Sem a flag, o diálogo continuará abrindo normalmente (o app não quebra).
                                A impressora padrão do sistema é a que será usada.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>


                      <div className="p-4 rounded-md bg-muted/20 border border-border/10 space-y-2">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {['light', 'dark', 'system'].map((t) => (
                          <button
                            key={t}
                            onClick={() => { setTheme(t); setHasUnsavedChanges(true); }}
                            className={`p-4 rounded-md border transition-all duration-300 flex flex-col items-center gap-3 ${
                              theme === t 
                                ? 'bg-primary/5 border-primary shadow-sm shadow-primary/5' 
                                : 'bg-muted/30 border-border/40 hover:border-border'
                            }`}
                          >
                            <div className={`p-2 rounded-md ${theme === t ? 'bg-primary text-white' : 'bg-background text-muted-foreground'}`}>
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

                      <div className="p-4 rounded-md bg-muted/20 border border-border/10 space-y-4 mt-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <Label className="text-sm font-bold">Tema dos Diálogos do Dashboard</Label>
                            <p className="text-xs text-muted-foreground">Escolha o tema para os popups detalhados do Dashboard.</p>
                          </div>
                          <div className="flex bg-background/50 p-1 rounded-md border border-border/20 self-start sm:self-center">
                            <button 
                              onClick={() => { setDashboardDialogTheme('light'); setHasUnsavedChanges(true); }}
                              title="Modo Claro"
                              className={cn(
                                "p-2 rounded-lg transition-all flex items-center gap-2",
                                dashboardDialogTheme === 'light' ? "bg-white shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Sun className="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase sm:hidden">Claro</span>
                            </button>
                            <button 
                              onClick={() => { setDashboardDialogTheme('dark'); setHasUnsavedChanges(true); }}
                              title="Modo Escuro"
                              className={cn(
                                "p-2 rounded-lg transition-all flex items-center gap-2",
                                dashboardDialogTheme === 'dark' ? "bg-slate-900 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Moon className="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase sm:hidden">Escuro</span>
                            </button>
                            <button 
                              onClick={() => { setDashboardDialogTheme('system'); setHasUnsavedChanges(true); }}
                              title="Modo Sistema"
                              className={cn(
                                "p-2 rounded-lg transition-all flex items-center gap-2",
                                dashboardDialogTheme === 'system' ? "bg-background/80 shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <Laptop className="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase sm:hidden">Sistema</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCategory === 'performance' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 rounded-md bg-muted/20 border border-border/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Modo Lite (Performance)</Label>
                          <p className="text-xs text-muted-foreground">
                            Desativa animações pesadas, blurs e gráficos secundários. {perfIsAuto ? 'Detecção automática ativa.' : (perfLevel === 'low' ? 'Forçado: ligado.' : 'Forçado: desligado.')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={perfLevel === 'low'}
                            onCheckedChange={(val) => perfSetLevel(val ? 'low' : 'high')}
                          />
                          {!perfIsAuto && (
                            <button
                              onClick={() => perfSetLevel('auto')}
                              className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-primary"
                              title="Restaurar detecção automática baseada no dispositivo"
                            >
                              Auto
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-md bg-muted/20 border border-border/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Reduzir Animações</Label>
                          <p className="text-xs text-muted-foreground">Melhora a fluidez em dispositivos lentos.</p>
                        </div>
                        <Switch 
                          checked={reduceAnimations} 
                          onCheckedChange={(val) => { setReduceAnimations(val); setHasUnsavedChanges(true); }}
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-md bg-muted/20 border border-border/10">
                        <div className="space-y-0.5">
                          <Label className="text-sm font-bold">Modo de Baixo Consumo</Label>
                          <p className="text-xs text-muted-foreground">Otimiza o carregamento de dados e gráficos.</p>
                        </div>
                        <Switch 
                          checked={lowDataMode} 
                          onCheckedChange={(val) => { setLowDataMode(val); setHasUnsavedChanges(true); }}
                        />
                      </div>
                      
                      <div className="p-4 rounded-md bg-amber-500/5 border border-amber-500/10 flex gap-4">
                        <Activity className="w-5 h-5 text-warning shrink-0" />
                        <div className="space-y-1">
                          <h5 className="text-xs font-bold text-warning uppercase">Dica de Performance</h5>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            O Modo Lite é ativado automaticamente em tablets de entrada (≤4GB RAM, ≤4 núcleos ou rede 3G). Você pode forçar manual e voltar ao automático no botão "Auto".
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
                            <Badge variant="outline" className={orKey ? "text-success border-emerald-500/20 bg-emerald-500/5" : "text-muted-foreground"}>
                              {orKey ? "Configurado" : "Pendente"}
                            </Badge>
                          </h4>
                          <Button variant="ghost" size="sm" className="text-xs font-bold text-primary" asChild>
                            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">Obter Chave</a>
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Chave de API</Label>
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
                          <Label className="text-sm font-medium text-muted-foreground">Modelo Preferencial</Label>
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
                              Impressão Automática (PNG)
                              <Badge variant="outline" className={labelSettings.autoPrint ? "text-success border-emerald-500/20 bg-emerald-500/5" : "text-muted-foreground"}>
                                {labelSettings.autoPrint ? "Ativa" : "Desativada"}
                              </Badge>
                            </h4>
                            <p className="text-xs text-muted-foreground">Renderiza a etiqueta como imagem PNG e envia para o n8n, que repassa para a impressora.</p>
                          </div>
                          <Switch 
                            checked={labelSettings.autoPrint} 
                            onCheckedChange={(val) => { setLabelSettings({ autoPrint: val }); setHasUnsavedChanges(true); }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Webhook do n8n (fixo)</Label>
                          <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value="http://localhost:5678/webhook/imprimir-etiqueta"
                              readOnly
                              disabled
                              className="pl-9 text-sm bg-muted/20 font-mono cursor-not-allowed"
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Endereço fixo do n8n local responsável por receber o PNG e encaminhar para a impressora.
                          </p>
                        </div>

                      </div>

                      <div className="space-y-4 pt-4 border-t border-border/10">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-bold flex items-center gap-2">
                              Consulta Item SAP (n8n)
                              <Badge variant="outline" className={n8nSapEnabled && n8nSapUrl ? "text-success border-emerald-500/20 bg-emerald-500/5" : "text-muted-foreground"}>
                                {n8nSapEnabled && n8nSapUrl ? "Ativa" : "Desativada"}
                              </Badge>
                            </h4>
                            <p className="text-xs text-muted-foreground">Webhook n8n que autentica no Auge e retorna código, descrição e estoque atual do item consultado.</p>
                          </div>
                          <Switch
                            checked={n8nSapEnabled}
                            onCheckedChange={(val) => { setN8nSapEnabled(val); setHasUnsavedChanges(true); }}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">URL do Webhook</Label>
                          <div className="relative">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              value={n8nSapUrl}
                              onChange={(e) => { setN8nSapUrl(e.target.value); setHasUnsavedChanges(true); }}
                              placeholder="https://n8n.seudominio.com/webhook/consultar-item-sap"
                              className="pl-9 text-sm bg-muted/20 font-mono"
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground">
                            Envie POST com JSON <code className="font-mono">{'{ "codigo_pesquisado": "..." }'}</code>. Retorno esperado: <code className="font-mono">{'{ codigo, descricao, estoque_atual }'}</code>.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-muted-foreground">Testar Consulta</Label>
                          <div className="flex gap-2">
                            <Input
                              value={n8nSapTestCode}
                              onChange={(e) => setN8nSapTestCode(e.target.value)}
                              placeholder="Código do item (ex.: 000123)"
                              className="text-sm bg-muted/20 font-mono"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              disabled={!n8nSapUrl || !n8nSapTestCode.trim() || n8nSapTesting}
                              onClick={async () => {
                                setN8nSapTesting(true);
                                try {
                                  const response = await fetch(n8nSapUrl.trim(), {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json; charset=utf-8' },
                                    body: JSON.stringify({ codigo_pesquisado: n8nSapTestCode.trim() }),
                                  });
                                  if (!response.ok) throw new Error(`Webhook respondeu ${response.status}`);
                                  const data: any = await response.json();
                                  toast.success(`OK: ${data?.descricao ?? 'sem descrição'} • Estoque: ${data?.estoque_atual ?? '—'}`);
                                } catch (e: any) {
                                  toast.error('Falha: ' + (e?.message || 'erro desconhecido'));
                                } finally {
                                  setN8nSapTesting(false);
                                }
                              }}
                            >
                              {n8nSapTesting ? 'Testando…' : 'Testar'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {activeCategory === 'label-layout' && (
                    <LabelLayoutPanel />
                  )}

                  {activeCategory === 'expedicao' && (
                    <ExpedicaoPanel />
                  )}




                  {activeCategory === 'security' && (
                    <div className="space-y-8">
                      {isGuest ? (
                        <div className="py-12 text-center space-y-3">
                          <div className="w-14 h-14 bg-muted rounded-md flex items-center justify-center mx-auto">
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
                              <h4 className="text-sm font-semibold text-foreground">Alterar E-mail</h4>
                            </div>
                            <div className="space-y-3 p-5 rounded-md bg-muted/20 border border-border/20">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">E-mail Atual</Label>
                                <Input value={user?.email || ''} disabled className="bg-muted/10 border-border/20 opacity-60 h-11" />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">Novo E-mail</Label>
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
                              <h4 className="text-sm font-semibold text-foreground">Alterar Nome de Exibição</h4>
                            </div>
                            <div className="space-y-3 p-5 rounded-md bg-muted/20 border border-border/20">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">Nome de Exibição</Label>
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
                              <h4 className="text-sm font-semibold text-foreground">Alterar Senha</h4>
                            </div>
                            <div className="space-y-3 p-5 rounded-md bg-muted/20 border border-border/20">
                              <div className="space-y-2">
                                <Label className="text-sm font-medium text-muted-foreground">Nova Senha</Label>
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
                                <Label className="text-sm font-medium text-muted-foreground">Confirmar Nova Senha</Label>
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
                              <h4 className="text-sm font-semibold text-foreground">Autenticação em Dois Fatores (2FA)</h4>
                            </div>
                            <div className="p-5 rounded-md bg-muted/20 border border-border/20 space-y-4">
                              {mfaLoading ? (
                                <div className="flex items-center justify-center py-4">
                                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                                </div>
                              ) : mfaFactors.filter(f => f.status === 'verified').length > 0 ? (
                                <div className="space-y-3">
                                  {mfaFactors.filter(f => f.status === 'verified').map(factor => (
                                    <div key={factor.id} className="flex items-center justify-between p-3 rounded-md bg-emerald-500/5 border border-emerald-500/20">
                                      <div className="flex items-center gap-3">
                                        <ShieldCheck className="w-5 h-5 text-success" />
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
                                  <div className="flex justify-center p-4 bg-white rounded-md">
                                    <div dangerouslySetInnerHTML={{ __html: mfaQrCode }} />
                                  </div>
                                  {mfaSecret && (
                                    <div className="space-y-1">
                                      <Label className="text-sm font-medium text-muted-foreground">Ou insira manualmente</Label>
                                      <div className="flex gap-2">
                                        <Input value={mfaSecret} readOnly className="font-mono text-xs bg-background/50" />
                                        <Button variant="outline" size="icon" onClick={copySecret}>
                                          <Copy className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-muted-foreground">Código de Verificação</Label>
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
                              <h4 className="text-sm font-semibold text-foreground">Sessões</h4>
                            </div>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-5 rounded-md bg-muted/20 border border-border/20">
                                <div className="space-y-0.5">
                                  <Label className="text-sm font-bold">Encerrar Sessão Atual</Label>
                                  <p className="text-xs text-muted-foreground">Sair desta conta neste dispositivo.</p>
                                </div>
                                <Button variant="outline" onClick={() => signOut()} className="font-bold">
                                  <LogOut className="w-4 h-4 mr-2" />
                                  Sair
                                </Button>
                              </div>
                              <div className="flex items-center justify-between p-5 rounded-md bg-muted/20 border border-border/20">
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
                              <h4 className="text-sm font-semibold text-destructive">Zona de Perigo</h4>
                            </div>
                            <div className="p-5 rounded-md bg-destructive/5 border border-destructive/20 space-y-4">
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

                  {!['profile', 'appearance', 'performance', 'integrations', 'security', 'preferences', 'users', 'label-layout'].includes(activeCategory) && (
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

      {(saveState !== 'idle' || hasUnsavedChanges) && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-2 rounded-md bg-card/95 backdrop-blur-xl border border-border/40 shadow-lg text-xs font-medium">
          {saveState === 'saving' && (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">Salvando…</span>
            </>
          )}
          {saveState === 'saved' && (
            <>
              <Check className="w-3.5 h-3.5 text-success" />
              <span className="text-success dark:text-success">Salvo automaticamente</span>
            </>
          )}
          {saveState === 'idle' && hasUnsavedChanges && (
            <>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-muted-foreground">Alterações pendentes…</span>
            </>
          )}
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
