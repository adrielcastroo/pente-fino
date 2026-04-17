import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, KeyRound, ArrowLeft, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we have an active session (from the recovery link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error('Sessão expirada ou link inválido.');
        navigate('/login');
      } else {
        setIsValidSession(true);
      }
    });
  }, [navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem.');
      return;
    }

    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Senha atualizada com sucesso!');
        // Sign out after password update to force fresh login
        await supabase.auth.signOut();
        navigate('/login');
      }
    } catch (err) {
      toast.error('Erro ao atualizar senha.');
    } finally {
      setLoading(false);
    }
  };

  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="border-none shadow-2xl bg-background/80 backdrop-blur-sm overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-primary/50 to-primary" />
          
          <CardHeader className="space-y-1 pb-6 pt-8 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
              <Logo className="w-9 h-9 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight">Nova Senha</CardTitle>
            <CardDescription>Crie uma senha forte para proteger sua conta</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 bg-muted/30"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 bg-muted/30"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11 font-bold shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Salvar Nova Senha
              </Button>
            </form>
          </CardContent>

          <CardFooter className="justify-center border-t border-border/10 py-4">
            <Button variant="link" size="sm" onClick={() => navigate('/login')} className="text-muted-foreground hover:text-primary">
              <ArrowLeft className="mr-2 h-3 w-3" /> Voltar ao Login
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
