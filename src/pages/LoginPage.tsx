import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { UserCircle2, ArrowRight, Loader2, UserPlus, LogIn, KeyRound, ArrowLeft, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Logo from '@/components/Logo';
import logoComb from '@/assets/logo-comb.png';

type PageMode = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<PageMode>('login');
  const [rememberMe, setRememberMe] = useState(true);
  const { loginAsGuest } = useAuth();
  const [guestName, setGuestName] = useState('');
  const [showGuestInput, setShowGuestInput] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (!name.trim()) {
          toast.error('Por favor, informe seu nome para o cadastro.');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          toast.error('A senha deve ter no mínimo 6 caracteres.');
          setLoading(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name },
          },
        });
        if (error) {
          toast.error(error.message);
        } else if (data.session) {
          if (rememberMe) localStorage.setItem('rememberMe', 'true');
          toast.success('Cadastro realizado com sucesso! Bem-vindo.');
        } else {
          toast.success('Cadastro realizado! Verifique seu e-mail para confirmar.');
          setMode('login');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Email ou senha incorretos. Verifique e tente novamente.');
          } else {
            toast.error(error.message);
          }
        } else {
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          } else {
            localStorage.removeItem('rememberMe');
          }
          toast.success('Bem-vindo de volta!');
        }
      }
    } catch {
      toast.error('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Por favor, informe seu e-mail.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
      }
    } catch {
      toast.error('Erro ao enviar e-mail. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Check if we're in a password reset flow (redirected from email)
  useEffect(() => {
    const hash = window.location.hash;
    const params = new URLSearchParams(window.location.search);
    if (hash.includes('type=recovery') || (params.get('reset') === 'true' && hash.includes('access_token'))) {
      window.location.href = `${window.location.origin}/reset-password${window.location.hash}`;
    }
  }, []);

  const handleGuestLogin = () => {
    if (!showGuestInput) {
      setShowGuestInput(true);
      return;
    }
    if (!guestName.trim()) {
      toast.error('Por favor, insira seu nome para entrar como visitante.');
      return;
    }
    loginAsGuest(guestName);
    toast.success('Entrou como visitante!');
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup': return 'Criar Conta';
      case 'forgot': return 'Recuperar Senha';
      default: return 'Sistema Pente Fino';
    }
  };

  const getDescription = () => {
    switch (mode) {
      case 'signup': return 'Crie sua conta para começar';
      case 'forgot': return 'Informe seu e-mail para receber o link de recuperação';
      default: return 'Faça login para gerenciar sua conferência';
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 relative overflow-hidden bg-background app-bg-pattern select-none">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] animate-pulse delay-700" />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border border-white/20 shadow-2xl bg-white/70 dark:bg-card/70 backdrop-blur-xl overflow-hidden rounded-[2rem]">
          {/* Top accent bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-primary/50 to-primary" />

          <CardHeader className="space-y-2 pb-6 pt-10 text-center relative">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-24 h-24 bg-white/50 dark:bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-primary/20 shadow-xl group transition-all hover:bg-white/80 dark:hover:bg-primary/15 p-2"
            >
              <img 
                src={logoComb} 
                alt="Logo Pente Fino" 
                className="w-16 h-16 object-contain drop-shadow-md transition-transform group-hover:rotate-3"
              />
            </motion.div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <CardTitle className="text-3xl font-extrabold tracking-tight text-foreground/90">
                  {getTitle()}
                </CardTitle>
                <CardDescription className="text-base mt-2 font-medium text-muted-foreground/80">
                  {getDescription()}
                </CardDescription>
              </motion.div>
            </AnimatePresence>
          </CardHeader>

          <CardContent className="space-y-6 px-6 sm:px-10 pb-8">
            <AnimatePresence mode="wait">
              {/* === FORGOT PASSWORD === */}
              {mode === 'forgot' ? (
                <motion.form 
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleForgotPassword} 
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                      Email de Recuperação
                    </Label>
                    <div className="relative group">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="exemplo@empresa.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-12 pl-11 bg-muted/40 border-muted/60 rounded-xl focus:ring-primary/20 transition-all text-base"
                        required
                        aria-label="Email para recuperação"
                      />
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-12 font-bold rounded-xl primary-btn group" 
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <KeyRound className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    )}
                    Enviar Link
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="w-full h-10 text-sm font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-lg" 
                    onClick={() => setMode('login')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar ao login
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="login-signup"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-5"
                >
                  <form onSubmit={handleAuth} className="space-y-4">
                    <AnimatePresence mode="wait">
                      {mode === 'signup' && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-2 overflow-hidden"
                        >
                          <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                            Nome Completo
                          </Label>
                          <div className="relative group">
                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                            <Input
                              id="name"
                              placeholder="Seu nome"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="h-12 pl-11 bg-muted/40 border-muted/60 rounded-xl focus:ring-primary/20 transition-all text-base"
                              required={mode === 'signup'}
                              autoFocus
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        Endereço de Email
                      </Label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="exemplo@empresa.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 pl-11 bg-muted/40 border-muted/60 rounded-xl focus:ring-primary/20 transition-all text-base"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between ml-1">
                        <Label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          Senha de Acesso
                        </Label>
                        {mode === 'login' && (
                          <Link
                            to="/forgot-password"
                            className="text-xs font-semibold text-primary/80 hover:text-primary transition-colors hover:underline underline-offset-4"
                          >
                            Esqueceu?
                          </Link>
                        )}
                      </div>
                      <div className="relative group">
                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 pl-11 pr-11 bg-muted/40 border-muted/60 rounded-xl focus:ring-primary/20 transition-all text-base"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      {mode === 'login' ? (
                        <div className="flex items-center space-x-2.5 group cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                          <Checkbox
                            id="remember"
                            checked={rememberMe}
                            onCheckedChange={(checked) => setRememberMe(checked === true)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <label htmlFor="remember" className="text-sm font-semibold text-muted-foreground/80 group-hover:text-foreground transition-colors cursor-pointer">
                            Lembrar conexão
                          </label>
                        </div>
                      ) : <div />}
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 font-bold rounded-xl primary-btn group relative overflow-hidden" 
                      disabled={loading}
                    >
                      <motion.div
                        className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                      />
                      {loading ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      ) : mode === 'signup' ? (
                        <UserPlus className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                      ) : (
                        <LogIn className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      )}
                      <span className="relative z-10">
                        {mode === 'signup' ? 'Cadastrar Agora' : 'Acessar Painel'}
                      </span>
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        className="text-sm font-medium text-muted-foreground/70 hover:text-primary transition-colors py-1 px-4 rounded-lg hover:bg-primary/5"
                        onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                      >
                        {mode === 'signup' ? (
                          <>Já tem uma conta? <span className="text-primary font-bold">Faça login</span></>
                        ) : (
                          <>Ainda não tem conta? <span className="text-primary font-bold">Crie uma agora</span></>
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="relative pt-2">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full bg-border/40" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/80 dark:bg-card px-3 text-muted-foreground/50 font-bold tracking-widest">OU</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {!showGuestInput ? (
                      <Button
                        variant="outline"
                        onClick={() => setShowGuestInput(true)}
                        className="w-full h-12 font-bold text-muted-foreground/80 hover:text-foreground hover:bg-muted/50 border-muted-foreground/20 rounded-xl transition-all group"
                      >
                        <UserCircle2 className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                        Acesso Visitante
                      </Button>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-4 p-5 bg-muted/30 rounded-2xl border border-muted-foreground/10"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="guestName" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Identificação do Visitante
                          </Label>
                          <Input
                            id="guestName"
                            placeholder="Seu nome"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            className="h-11 bg-background/50 border-muted/60 focus:ring-primary/20 rounded-xl text-base"
                            autoFocus
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            onClick={() => setShowGuestInput(false)} 
                            className="flex-1 h-11 font-bold text-muted-foreground rounded-xl"
                          >
                            Voltar
                          </Button>
                          <Button
                            onClick={handleGuestLogin}
                            className="flex-[2] h-11 font-extrabold secondary-btn group"
                          >
                            Entrar <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>

          <CardFooter className="bg-muted/30 border-t border-white/10 py-5 justify-center backdrop-blur-md">
            <div className="flex flex-col items-center gap-1">
              <p className="text-xs font-bold text-muted-foreground/60 tracking-wider">
                © 2024 PENTE FINO SISTEMAS
              </p>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tighter">
                  Servidor Online • Versão 1.2.4
                </p>
              </div>
            </div>
          </CardFooter>
        </Card>
        
        {/* Footer links */}
        <div className="mt-8 flex justify-center gap-6">
          <button className="text-[11px] font-bold text-muted-foreground/40 hover:text-muted-foreground transition-colors uppercase tracking-widest">Privacidade</button>
          <button className="text-[11px] font-bold text-muted-foreground/40 hover:text-muted-foreground transition-colors uppercase tracking-widest">Suporte</button>
          <button className="text-[11px] font-bold text-muted-foreground/40 hover:text-muted-foreground transition-colors uppercase tracking-widest">Termos</button>
        </div>
      </motion.div>
    </div>
  );
}
}
