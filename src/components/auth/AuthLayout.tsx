import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Logo } from "@/components/Logo";

export const AuthLayout = ({ children, title, subtitle }: { children: ReactNode; title: string; subtitle: string }) => {
  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-[#0F1115] flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[400px] space-y-8"
      >
        <div className="text-center space-y-2">
          {/* Real Logo */}
          <div className="mx-auto w-12 h-12 bg-white dark:bg-card border border-border/50 rounded-2xl flex items-center justify-center shadow-sm mb-6 p-2">
            <Logo className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground max-w-[320px] mx-auto leading-relaxed">
            {subtitle}
          </p>
        </div>

        <div className="bg-white dark:bg-[#1A1D23] border border-border/50 rounded-2xl p-6 shadow-sm">
          {children}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ModernSaaS Inc. Securely managed.
        </p>
      </motion.div>
    </div>
  );
};
