import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Mail, ArrowRight, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const forgotPasswordSchema = z.object({
  email: z.string().email("Por favor, insira um e-mail válido"),
  method: z.enum(["link", "otp"]),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordForm = ({
  onNext,
}: {
  onNext: (email: string, method: "link" | "otp") => void;
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { method: "otp" },
  });

  const selectedMethod = watch("method");

  const onSubmit = async (data: ForgotPasswordValues) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke("auth-actions", {
        body: { 
          email: data.email, 
          type: data.method, 
          action: "forgot-password" 
        },
      });

      if (error) throw error;

      toast.success("Se as instruções de recuperação foram enviadas para seu e-mail.");
      onNext(data.email, data.method);
    } catch (error: any) {
      toast.error(error.message || "Ocorreu um erro. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm font-medium">
          E-mail de recuperação
        </Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="nome@exemplo.com"
            className="pl-10 h-11"
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-destructive mt-1">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <Label className="text-sm font-semibold">Como você prefere recuperar?</Label>
          <p className="text-[11px] text-muted-foreground leading-tight">
            Você receberá um e-mail contendo tanto um link de acesso rápido quanto um código de 6 dígitos.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setValue("method", "link")}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden group ${
              selectedMethod === "link"
                ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                : "border-border/40 hover:border-border/80 bg-muted/20"
            }`}
          >
            <div className={`p-2 rounded-full mb-2 transition-colors ${selectedMethod === "link" ? "bg-primary/10" : "bg-muted"}`}>
              <Mail className={`h-5 w-5 ${selectedMethod === "link" ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider">Link Seguro</span>
            {selectedMethod === "link" && (
              <motion.div layoutId="active-method" className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none" />
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setValue("method", "otp")}
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden group ${
              selectedMethod === "otp"
                ? "border-primary bg-primary/5 shadow-md scale-[1.02]"
                : "border-border/40 hover:border-border/80 bg-muted/20"
            }`}
          >
            <div className={`p-2 rounded-full mb-2 transition-colors ${selectedMethod === "otp" ? "bg-primary/10" : "bg-muted"}`}>
              <KeyRound className={`h-5 w-5 ${selectedMethod === "otp" ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider">Código OTP</span>
            {selectedMethod === "otp" && (
              <motion.div layoutId="active-method" className="absolute inset-0 border-2 border-primary rounded-2xl pointer-events-none" />
            )}
          </button>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 rounded-xl font-semibold transition-all active:scale-[0.98] shadow-md hover:shadow-lg bg-primary text-primary-foreground"
      >
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <>
            Enviar recuperação de senha
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
};
