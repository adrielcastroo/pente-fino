import { useSearchParams, useNavigate } from "react-router-dom";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { VerifyOtpForm } from "@/components/auth/VerifyOtpForm";

const VerifyOtp = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get("email") || "";

  const handleVerify = () => {
    navigate("/reset-password");
  };

  return (
    <AuthLayout
      title="Verificar código"
      subtitle={`Enviamos um código de 6 dígitos para o e-mail: ${email}`}
    >
      <VerifyOtpForm email={email} onVerify={handleVerify} />
    </AuthLayout>
  );
};

export default VerifyOtp;
