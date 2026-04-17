import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ResetPassword = () => {
  const [isValidSession, setIsValidSession] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // Also check if we just verified OTP (which signs the user in)
        // Or if we have a recovery token in the URL
        const hash = window.location.hash;
        if (hash.includes('type=recovery') || hash.includes('access_token')) {
          setIsValidSession(true);
        } else {
          toast.error("Sessão inválida ou expirada.");
          navigate("/login");
        }
      } else {
        setIsValidSession(true);
      }
      setIsChecking(false);
    };

    checkSession();
  }, [navigate]);

  const handleSuccess = () => {
    // Navigate directly to dashboard as the user is already authenticated
    // after a successful password update in a recovery session.
    navigate("/", { replace: true });
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AuthLayout
      title="Redefinir Senha"
      subtitle="Escolha uma senha forte e segura para proteger sua conta."
    >
      <ResetPasswordForm onSuccess={handleSuccess} />
    </AuthLayout>
  );
};

export default ResetPassword;
