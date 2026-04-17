import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { ChevronLeft } from "lucide-react";

const ForgotPassword = () => {
  const navigate = useNavigate();

  const handleNext = (email: string, method: "link" | "otp") => {
    if (method === "otp") {
      navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
    } else {
      // For link-based, they just wait for the email.
      // In a real app, you might show a success message or redirect to a "Check Email" page.
      // For this UX, let's keep it simple.
    }
  };

  return (
    <AuthLayout
      title="Recuperação de senha"
      subtitle="Insira seu e-mail abaixo e enviaremos as instruções para você redefinir sua senha de forma segura."
    >
      <div className="space-y-6">
        <ForgotPasswordForm onNext={handleNext} />
        
        <div className="flex justify-center pt-2">
          <Link
            to="/login"
            className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ChevronLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para o login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
