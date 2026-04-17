import { ReactNode } from "react";
import { motion } from "framer-motion";

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
          {/* Mock Logo */}
          <div className="mx-auto w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 mb-6">
            <div className="w-5 h-5 bg-white rounded-sm rotate-45" />
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
