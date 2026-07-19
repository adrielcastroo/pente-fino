import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, Loader2, UserPlus, LogIn, KeyRound, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { usePerformance } from '@/hooks/use-performance';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Logo from '@/components/Logo';
import Seo from '@/components/Seo';
import logoComb from '@/assets/logo-comb.webp';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  rememberMe: z.boolean().default(true),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
});

const forgotSchema = z.object({
  email: z.string().email('Email inválido'),
});

type PageMode = 'login' | 'signup' | 'forgot';

export default function LoginPage() {
  const [mode, setMode] = useState<PageMode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const { loginAsGuest } = useAuth();
  const { isLow } = usePerformance();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: true },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const forgotForm = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });

  const onLogin = async (values: z.infer<typeof loginSchema>) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error('Email ou senha incorretos.');
        } else {
          toast.error(error.message);
        }
      } else {
        if (values.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('rememberMe');
        }
        toast.success('Bem-vindo de volta!');
      }
    } catch (err) {
      toast.error('Ocorreu um erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const onSignup = async (values: z.infer<typeof signupSchema>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: { display_name: values.name },
        },
      });

      if (error) {
        toast.error(error.message);
      } else if (data.session) {
        toast.success('Cadastro realizado com sucesso!');
      } else {
        toast.success('Cadastro realizado! Verifique seu e-mail.');
        setMode('login');
      }
    } catch (err) {
      toast.error('Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async (values: z.infer<typeof forgotSchema>) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('E-mail de recuperação enviado!');
      }
    } catch (err) {
      toast.error('Erro ao enviar e-mail.');
    } finally {
      setLoading(false);
    }
  };

  // Switch modes smoothly
  const toggleMode = (newMode: PageMode) => {
    setMode(newMode);
    setShowPassword(false);
  };

  return (
    <>
      <Seo
        title="Login — Pente Fino | Gestão de Estoque Têxtil"
        description="Acesse o Sistema Pente Fino: conferência, endereçamento e expedição de estoque têxtil em tempo real."
        path="/login"
      />
    <main className="relative min-h-[100dvh] w-full flex items-center justify-center bg-background overflow-hidden px-4 py-10 sm:py-16">
      {/* Fundo temático "fio do pente" — camada absoluta atrás do card */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Dentes do pente: linhas verticais finas e próximas */}
        <div
          className="absolute inset-0 text-primary opacity-[0.10] dark:opacity-[0.14]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(to right, currentColor 0 1px, transparent 1px 10px)',
            WebkitMaskImage:
              'radial-gradient(ellipse 70% 60% at 50% 45%, black 0%, black 35%, transparent 80%)',
            maskImage:
              'radial-gradient(ellipse 70% 60% at 50% 45%, black 0%, black 35%, transparent 80%)',
          }}
        />
        {/* Barra horizontal do pente (topo), bem sutil */}
        <div
          className="absolute inset-x-0 top-0 h-[38%] text-primary opacity-[0.05] dark:opacity-[0.08]"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, currentColor 0%, currentColor 22%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 60% 100% at 50% 0%, black 0%, transparent 75%)',
            maskImage:
              'radial-gradient(ellipse 60% 100% at 50% 0%, black 0%, transparent 75%)',
          }}
        />
        {/* Halo radial sutil da cor primária */}
        {!isLow && (
          <>
            <div className="absolute -top-48 left-1/2 -translate-x-1/2 w-[640px] h-[640px] bg-primary/[0.07] rounded-full blur-[140px]" />
            <div className="absolute -bottom-48 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-primary/[0.04] rounded-full blur-[140px]" />
          </>
        )}
      </div>


      <div className="w-full max-w-[410px] relative z-10">
        {/* Header com logo + nome */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="flex flex-col items-center mb-6"
        >
          <div className="p-2.5 bg-card border border-border/60 rounded-lg shadow-sm mb-3">
            <img src={logoComb} alt="Logo Pente-Fino" className="w-10 h-10 object-contain" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Pente Fino</h1>
        </motion.div>



          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <Card className="border-border/60 shadow-lg rounded-xl overflow-hidden bg-card">
              <CardHeader className="space-y-1 pb-4 pt-6 px-5 sm:px-6">
                <h2 className="text-xl font-semibold leading-none tracking-tight">
                  {mode === 'login' && 'Bem-vindo de volta'}
                  {mode === 'signup' && 'Criar conta'}
                  {mode === 'forgot' && 'Recuperar senha'}
                </h2>
                <CardDescription className="text-xs sm:text-sm">
                  {mode === 'login' && 'Entre na sua conta para continuar'}
                  {mode === 'signup' && 'Cadastre-se para começar a usar'}
                  {mode === 'forgot' && 'Enviaremos um link para seu e-mail'}
                </CardDescription>
              </CardHeader>


              <CardContent className="px-4 sm:px-6">
                <AnimatePresence mode="wait">
                  {mode === 'login' && (
                    <motion.form
                      key="login"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onSubmit={loginForm.handleSubmit(onLogin)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-xs font-semibold">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-10 h-12 bg-muted/30 focus:bg-background transition-all border-border/60"
                            {...loginForm.register('email')}
                            autoFocus
                          />
                        </div>
                        {loginForm.formState.errors.email && (
                          <p className="text-[10px] text-destructive font-medium">{loginForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <Label htmlFor="password" className="text-xs font-semibold">Senha</Label>
                          <Link
                            to="/forgot-password"
                            className="text-[11px] text-primary hover:underline font-medium"
                          >
                            Esqueceu a senha?
                          </Link>
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10 h-12 bg-muted/30 focus:bg-background transition-all border-border/60"
                            {...loginForm.register('password')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            aria-pressed={showPassword}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                          </button>
                        </div>
                        {loginForm.formState.errors.password && (
                          <p className="text-[10px] text-destructive font-medium">{loginForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="remember"
                          checked={loginForm.watch('rememberMe')}
                          onCheckedChange={(checked) => loginForm.setValue('rememberMe', checked === true)}
                        />
                        <Label htmlFor="remember" className="text-xs font-medium cursor-pointer select-none">
                          Lembrar de mim
                        </Label>
                      </div>

                      <Button type="submit" className="w-full h-12 font-bold primary-btn text-base mt-2" disabled={loading}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <LogIn className="w-5 h-5 mr-2" />}
                        Entrar
                      </Button>
                    </motion.form>
                  )}

                  {mode === 'signup' && (
                    <motion.form
                      key="signup"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onSubmit={signupForm.handleSubmit(onSignup)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-xs font-semibold">Nome Completo</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="name"
                            placeholder="Seu nome"
                            className="pl-10 h-12 bg-muted/30 focus:bg-background transition-all border-border/60"
                            {...signupForm.register('name')}
                            autoFocus
                          />
                        </div>
                        {signupForm.formState.errors.name && (
                          <p className="text-[10px] text-destructive font-medium">{signupForm.formState.errors.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email-signup" className="text-xs font-semibold">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email-signup"
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-10 h-12 bg-muted/30 focus:bg-background transition-all border-border/60"
                            {...signupForm.register('email')}
                          />
                        </div>
                        {signupForm.formState.errors.email && (
                          <p className="text-[10px] text-destructive font-medium">{signupForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password-signup" className="text-xs font-semibold">Senha</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="password-signup"
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••"
                            className="pl-10 pr-10 h-12 bg-muted/30 focus:bg-background transition-all border-border/60"
                            {...signupForm.register('password')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            aria-pressed={showPassword}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" aria-hidden="true" /> : <Eye className="w-4 h-4" aria-hidden="true" />}
                          </button>
                        </div>
                        {signupForm.formState.errors.password && (
                          <p className="text-[10px] text-destructive font-medium">{signupForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <Button type="submit" className="w-full h-12 font-bold primary-btn text-base mt-2" disabled={loading}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <UserPlus className="w-5 h-5 mr-2" />}
                        Cadastrar
                      </Button>
                    </motion.form>
                  )}

                  {mode === 'forgot' && (
                    <motion.form
                      key="forgot"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      onSubmit={forgotForm.handleSubmit(onForgot)}
                      className="space-y-4"
                    >
                      <div className="space-y-2">
                        <Label htmlFor="email-forgot" className="text-xs font-semibold">Email de Recuperação</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="email-forgot"
                            type="email"
                            placeholder="seu@email.com"
                            className="pl-10 h-12 bg-muted/30 focus:bg-background transition-all border-border/60"
                            {...forgotForm.register('email')}
                            autoFocus
                          />
                        </div>
                        {forgotForm.formState.errors.email && (
                          <p className="text-[10px] text-destructive font-medium">{forgotForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <Button type="submit" className="w-full h-12 font-bold primary-btn text-base mt-2" disabled={loading}>
                        {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <KeyRound className="w-5 h-5 mr-2" />}
                        Enviar Link
                      </Button>

                      <button
                        type="button"
                        onClick={() => toggleMode('login')}
                        className="w-full text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center pt-2"
                      >
                        <ChevronLeft className="w-3 h-3 mr-1" />
                        Voltar ao login
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>
              </CardContent>

              <CardFooter className="flex flex-col space-y-4 border-t border-border/40 pt-6 pb-6 bg-muted/50">
                {mode !== 'forgot' && (
                  <div className="text-xs text-center text-muted-foreground">
                    {mode === 'login' ? (
                      <>
                        Ainda não tem conta?{' '}
                        <button onClick={() => toggleMode('signup')} className="text-primary font-bold hover:underline">
                          Cadastre-se
                        </button>
                      </>
                    ) : (
                      <>
                        Já tem uma conta?{' '}
                        <button onClick={() => toggleMode('login')} className="text-primary font-bold hover:underline">
                          Fazer login
                        </button>
                      </>
                    )}
                  </div>
                )}
                
                <div className="relative w-full">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border/40" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase">
                    <span className="bg-muted/10 backdrop-blur-sm px-2 text-muted-foreground/60 font-medium">Ou continue como</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  className="w-full h-11 text-xs font-semibold bg-background hover:bg-muted border-border/60 transition-all"
                  onClick={() => {
                    setGuestName('');
                    setGuestDialogOpen(true);
                  }}
                >
                  Entrar como Visitante
                </Button>
              </CardFooter>
            </Card>
          </motion.div>

          <p className="text-center text-[10px] text-muted-foreground mt-8">
            © {new Date().getFullYear()} Sistema Pente Fino. Todos os direitos reservados.
          </p>
      </div>


      <Dialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen}>
        <DialogContent className="sm:max-w-[420px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Entrar como Visitante</DialogTitle>
            <DialogDescription>
              Informe seu nome para continuar. Este nome será usado como identificação do conferente.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const trimmed = guestName.trim();
              if (trimmed.length < 2) {
                toast.warning('Digite um nome com pelo menos 2 caracteres.');
                return;
              }
              loginAsGuest(trimmed);
              setGuestDialogOpen(false);
              toast.success(`Bem-vindo, ${trimmed}!`);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="guest-name" className="text-xs font-semibold">Nome do Conferente</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="guest-name"
                  placeholder="Seu nome"
                  className="pl-10 h-12 bg-muted/30 focus:bg-background transition-all border-border/60"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  maxLength={60}
                  autoFocus
                  required
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setGuestDialogOpen(false)}
                className="h-11"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="h-11 font-bold primary-btn"
                disabled={guestName.trim().length < 2}
              >
                Entrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </main>
    </>
  );
}
