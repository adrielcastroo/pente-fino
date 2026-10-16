import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

export const AuthLayout = ({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[400px] space-y-8"
      >
        <div className="text-center space-y-2">
          {/* Real Logo */}
          <div className="mx-auto w-12 h-12 bg-card border border-border/50 rounded-md flex items-center justify-center shadow mb-6 p-2">
            <Logo className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="bg-card border border-border/50 rounded-md p-6 shadow">
          {children}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ModernSaaS Inc. Securely managed.
        </p>
      </motion.div>
    </div>
  );
};
