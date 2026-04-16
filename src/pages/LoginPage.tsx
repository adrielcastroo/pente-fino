import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Mail, UserCircle2, ArrowRight, Loader2, UserPlus, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { loginAsGuest } = useAuth();
  const [guestName, setGuestName] = useState('');
  const [showGuestInput, setShowGuestInput] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (isSignUp) {
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
            data: {
              display_name: name,
            }
          }
        });
        if (error) {
          toast.error(error.message);
        } else if (data.session) {
          // Auto-confirmed: save remember preference and enter
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          }
          toast.success('Cadastro realizado com sucesso! Bem-vindo.');
        } else {
          toast.success('Cadastro realizado! Verifique seu e-mail para confirmar.');
          setIsSignUp(false);
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
          // Save remember-me preference
          if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
          } else {
            localStorage.removeItem('rememberMe');
          }
          toast.success('Bem-vindo de volta!');
        }
      }
    } catch (error: any) {
      toast.error('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-2xl bg-background/80 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-primary/50 to-primary" />
          
          <CardHeader className="space-y-1 pb-6 pt-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <span className="text-2xl font-black text-primary italic">PF</span>
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Sistema Pente Fino</CardTitle>
            <CardDescription>
              {isSignUp ? 'Crie sua conta para começar' : 'Faça login para gerenciar sua conferência'}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <form onSubmit={handleAuth} className="space-y-3">
              <AnimatePresence mode="wait">
                {isSignUp && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-1.5"
                  >
                    <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider opacity-70">Nome Completo</Label>
                    <Input 
                      id="name" 
                      placeholder="Seu nome" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 bg-muted/30 focus-visible:ring-primary/30"
                      required={isSignUp}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider opacity-70">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="exemplo@empresa.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 bg-muted/30 focus-visible:ring-primary/30"
                  required 
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider opacity-70">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 bg-muted/30 focus-visible:ring-primary/30"
                  required 
                />
              </div>

              {!isSignUp && (
                <div className="flex items-center space-x-2 py-1">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe} 
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Lembrar-me e entrar automaticamente
                  </label>
                </div>
              )}

              <Button type="submit" className="w-full h-11 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : isSignUp ? (
                  <UserPlus className="mr-2 h-4 w-4" />
                ) : (
                  <LogIn className="mr-2 h-4 w-4" />
                )}
                {isSignUp ? 'Criar Conta' : 'Entrar no Sistema'}
              </Button>

              <Button 
                type="button" 
                variant="link" 
                className="w-full text-xs text-muted-foreground hover:text-primary transition-colors"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se agora'}
              </Button>
            </form>

            <div className="pt-2">
              <Separator className="bg-border/50 mb-4" />
              
              {!showGuestInput ? (
                <Button 
                  variant="ghost" 
                  onClick={() => setShowGuestInput(true)}
                  className="w-full h-11 font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all"
                >
                  <UserCircle2 className="mr-2 h-4 w-4" />
                  Entrar como Visitante
                </Button>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="guestName" className="text-xs font-bold uppercase tracking-wider opacity-70">Nome do Conferente</Label>
                    <Input 
                      id="guestName" 
                      placeholder="Digite seu nome para identificar suas conferências" 
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="h-11 bg-muted/30 focus-visible:ring-primary/30"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowGuestInput(false)}
                      className="flex-1 h-11 font-semibold"
                    >
                      Voltar
                    </Button>
                    <Button 
                      onClick={handleGuestLogin}
                      className="flex-[2] h-11 font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 transition-all active:scale-95"
                    >
                      Acessar <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="bg-muted/20 border-t border-border/10 py-4 justify-center">
            <p className="text-xs text-muted-foreground">
              © 2024 Pente Fino • Versão 1.0.0
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
