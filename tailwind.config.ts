import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    screens: {
      xs: "480px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
      // Desktop real: tem mouse (hover + pointer fine), OU tela muito larga (≥1366px) como fallback.
      // Não usamos mais `(min-width: 1024px) and (hover: hover)` aqui porque notebooks touch com mouse
      // Bluetooth entre 1024–1365px ficavam classificados como tablet — sidebar sumia e BottomTabBar
      // aparecia. Agora qualquer dispositivo com `hover:hover` + `pointer:fine` (mouse real) é desktop.
      desktop: { raw: "(hover: hover) and (pointer: fine), (min-width: 1366px)" },
      "tablet-landscape": { raw: "(min-width: 768px) and (max-width: 1365px) and (orientation: landscape) and (hover: none), (min-width: 768px) and (max-width: 1365px) and (orientation: landscape) and (pointer: coarse)" },
      "tablet-portrait": { raw: "(min-width: 600px) and (max-width: 1365px) and (orientation: portrait) and (hover: none), (min-width: 600px) and (max-width: 1365px) and (orientation: portrait) and (pointer: coarse)" },
    },
    extend: {
      fontFamily: {
        sans: ["'Geist Variable'", "'Geist'", "'Inter'", "system-ui", "sans-serif"],
        mono: ["'Geist Mono Variable'", "'Geist Mono'", "'IBM Plex Mono'", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        lock: {
          DEFAULT: "hsl(var(--lock))",
          foreground: "hsl(var(--lock-foreground))",
        },
        error: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        navy: {
          DEFAULT: "hsl(var(--navy))",
          2: "hsl(var(--navy-2))",
          3: "hsl(var(--navy-3))",
        },
        surface: {
          DEFAULT: "hsl(var(--surface))",
          2: "hsl(var(--surface-2))",
          3: "hsl(var(--surface-3))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "row-in": {
          from: { opacity: "0", transform: "translateY(-4px)" },
          to: { opacity: "1", transform: "none" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateX(10px)" },
          to: { opacity: "1", transform: "none" },
        },
        "fio-peek": {
          "0%": { transform: "translateY(0) rotate(0deg)" },
          "35%": { transform: "translateY(-12px) rotate(-6deg)" },
          "55%": { transform: "translateY(-14px) rotate(8deg)" },
          "75%": { transform: "translateY(-14px) rotate(-4deg)" },
          "100%": { transform: "translateY(-10px) rotate(0deg)" },
        },
        "fio-wave": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-18deg)" },
          "50%": { transform: "rotate(14deg)" },
          "75%": { transform: "rotate(-10deg)" },
        },
        "fio-float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "fio-bounce": {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.12) translateY(-3px)" },
          "70%": { transform: "scale(0.96)" },
          "100%": { transform: "scale(1)" },
        },
        "fio-tilt": {
          "0%, 100%": { transform: "rotate(-3deg) translateY(0)" },
          "50%": { transform: "rotate(3deg) translateY(-2px)" },
        },
        "fio-pop": {
          "0%": { transform: "scale(0.85)", opacity: "0.6" },
          "45%": { transform: "scale(1.18)", opacity: "1" },
          "70%": { transform: "scale(0.95)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "row-in": "row-in 0.3s ease",
        "toast-in": "toast-in 0.22s ease",
        "fio-peek": "fio-peek 0.9s ease-out forwards",
        "fio-wave": "fio-wave 1.1s ease-in-out 0.4s infinite",
        "fio-float": "fio-float 3.2s ease-in-out infinite",
        "fio-bounce": "fio-bounce 0.55s ease-out",
        "fio-tilt": "fio-tilt 1.4s ease-in-out infinite",
        "fio-pop": "fio-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
