import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/store/useAuthStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Mail, Moon } from "lucide-react";

type ProfileFields = {
  email_notifications?: boolean;
  opt_out_reports?: boolean;
  display_mode?: string;
  ai_customization_rules?: string;
};

const Profile = () => {
  const { user, profile, setProfile } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const updateSetting = async (field: keyof ProfileFields, value: any) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ [field]: value } as any)
        .eq("id", user.id);
      
      if (error) throw error;
      setProfile({ ...profile, [field]: value });
      toast.success("Configuração atualizada!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Configurações Pessoais</h1>
        <p className="text-muted-foreground">Estes dados são privados e acessíveis apenas por você.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Preferências de E-mail
          </CardTitle>
          <CardDescription>Gerencie como e quando você recebe relatórios.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="email-notif">Notificações por Email</Label>
              <p className="text-sm text-muted-foreground">Ativar/desativar o recebimento de relatórios da operação.</p>
            </div>
            <Switch
              id="email-notif"
              checked={profile?.email_notifications ?? true}
              onCheckedChange={(checked) => updateSetting("email_notifications", checked)}
              disabled={loading}
            />
          </div>

          <div className="flex items-start space-x-3 space-y-0 border p-4 rounded-lg bg-destructive/5 border-destructive/20">
            <Checkbox
              id="opt-out"
              checked={profile?.opt_out_reports ?? false}
              onCheckedChange={(checked) => updateSetting("opt_out_reports", checked)}
              disabled={loading}
              className="mt-1"
            />
            <div className="grid gap-1.5 leading-none">
              <Label
                htmlFor="opt-out"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-destructive"
              >
                Opt-out Definitivo
              </Label>
              <p className="text-sm text-muted-foreground">
                Ao marcar esta opção, você deixará de receber relatórios por e-mail definitivamente.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" />
            Preferências de Exibição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label>Modo Escuro</Label>
              <p className="text-sm text-muted-foreground">Alternar entre o tema claro e escuro.</p>
            </div>
            <Switch checked={false} disabled />
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">IA Personalizada</CardTitle>
          <CardDescription>Suas regras de notificação processadas pelo chat.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-3 bg-background border rounded-md text-sm italic">
            {profile?.ai_customization_rules || "Você ainda não definiu regras específicas via chat da IA."}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <a href="/ai-chat">Configurar via Chat</a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Profile;
