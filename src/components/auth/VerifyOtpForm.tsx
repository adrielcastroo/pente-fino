import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const verifyOtpSchema = z.object({
  otp: z.string().length(6, "O código deve ter 6 dígitos"),
});

type VerifyOtpValues = z.infer<typeof verifyOtpSchema>;

export const VerifyOtpForm = ({
  email,
  onVerify,
}: {
  email: string;
  onVerify: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const {
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<VerifyOtpValues>({
    resolver: zodResolver(verifyOtpSchema),
  });

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const onSubmit = async (data: VerifyOtpValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: data.otp,
        type: "recovery", // Correct type for password recovery
      });

      if (error) throw error;

      toast.success("Código verificado com sucesso.");
      onVerify();
    } catch (error: any) {
      toast.error(error.message || "Código inválido ou expirado.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setCanResend(false);
    setCountdown(60);
    try {
      // Re-invoke the Edge Function to send OTP securely and generics-wise
      const { error } = await supabase.functions.invoke("auth-actions", {
        body: { email, type: "otp", action: "forgot-password" },
      });
      if (error) throw error;
      toast.success("Um novo código foi enviado se houver uma conta associada.");
    } catch (error: any) {
      toast.error(error.message || "Erro ao reenviar código.");
      setCanResend(true);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="space-y-2 text-center w-full">
          <Label className="text-sm font-medium">Código de verificação</Label>
          <div className="flex justify-center pt-2">
            <InputOTP
              maxLength={6}
              onChange={(value) => setValue("otp", value)}
              className="gap-2"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-10 h-12" />
                <InputOTPSlot index={1} className="w-10 h-12" />
                <InputOTPSlot index={2} className="w-10 h-12" />
              </InputOTPGroup>
              <InputOTPGroup>
                <InputOTPSlot index={3} className="w-10 h-12" />
                <InputOTPSlot index={4} className="w-10 h-12" />
                <InputOTPSlot index={5} className="w-10 h-12" />
              </InputOTPGroup>
            </InputOTP>
          </div>
          {errors.otp && (
            <p className="text-xs text-destructive mt-2">{errors.otp.message}</p>
          )}
        </div>

        <div className="w-full space-y-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 rounded-xl font-medium transition-all active:scale-[0.98]"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <>
                Verificar código
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            disabled={!canResend}
            onClick={handleResend}
            className="w-full h-11 rounded-xl text-sm font-medium border-border/50"
          >
            {canResend ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reenviar código
              </>
            ) : (
              `Reenviar em ${countdown}s`
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};
