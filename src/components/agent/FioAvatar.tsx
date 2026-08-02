import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

// Estados de animação + expressões da marca Fio.
export type FioAnimationState = "idle" | "hover" | "thinking" | "responding";
export type FioExpression =
  | "neutro" | "feliz" | "pensando" | "analisando"
  | "surpreso" | "respondendo" | "confirmando" | "curioso" | "descansando";

/**
 * Avatar 3D do Fio — mascote da marca (loop figura-oito vítreo, olhos ovais,
 * paleta neon cyan→azul→índigo). SVG vetorial: escala sem perda, anima os
 * estados e suporta as 8 expressões do manual de marca.
 *
 * API compatível com o componente anterior (drop-in):
 *   state, size, className, hoverOnEnter, interactive, rounded
 * Novo (opcional): expression — força uma das 8 expressões da marca.
 */
export function FioAvatar({
  state = "idle",
  expression,
  size = 48,
  className,
  hoverOnEnter = true,
  interactive = true,
  rounded = false,
}: {
  state?: FioAnimationState;
  expression?: FioExpression;
  size?: number;
  className?: string;
  hoverOnEnter?: boolean;
  interactive?: boolean;
  rounded?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<SVGSVGElement>(null);
  const rafRef = useRef<number | null>(null);
  // id único por instância (evita colisão de gradientes/filtros no DOM)
  const uid = useRef(`fio-${Math.random().toString(36).slice(2, 8)}`).current;

  const effective: FioAnimationState =
    state === "thinking" || state === "responding"
      ? state
      : hoverOnEnter && hovered
        ? "hover"
        : "idle";

  // Expressão: explícita (prop) tem prioridade; senão deriva do estado.
  const expr: FioExpression =
    expression ??
    (effective === "thinking"
      ? "pensando"
      : effective === "responding"
        ? "respondendo"
        : effective === "hover"
          ? "feliz"
          : "neutro");


  // Tilt 3D seguindo o mouse (parallax) — só quando interactive.
  useEffect(() => {
    if (!interactive) return;
    const handleMove = (e: MouseEvent) => {
      const el = bodyRef.current;
      if (!el) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const maxDist = 380;
        const influence = Math.max(0, 1 - Math.hypot(dx, dy) / maxDist);
        const max = 12;
        const rotY = Math.max(-max, Math.min(max, (dx / (rect.width || 1)) * max)) * influence;
        const rotX = Math.max(-max, Math.min(max, (-dy / (rect.height || 1)) * max)) * influence;
        el.style.transform = `perspective(700px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      });
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [interactive]);

  const showAura = effective === "thinking" || effective === "responding";

  return (
    <div
      ref={wrapRef}
      className={cn(
        "relative shrink-0 select-none pointer-events-auto",
        rounded && "rounded-2xl overflow-hidden",
        className
      )}
      style={{ width: size, height: size }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* aura / glow */}
      {showAura && (
        <div
          className={cn(
            "absolute inset-0 blur-2xl opacity-40 animate-pulse -z-10",
            effective === "thinking" ? "bg-primary" : "bg-cyan-400"
          )}
        />
      )}

      <svg
        ref={bodyRef}
        viewBox="0 0 140 140"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full will-change-transform transition-transform duration-300 ease-out"
        style={{
          animation: floatAnim(effective),
          filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.15))"
        }}
      >
        <defs>
          <linearGradient id={`${uid}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00D5FF" />
            <stop offset="50%" stopColor="#0077FF" />
            <stop offset="100%" stopColor="#5A3DFF" />
          </linearGradient>
          
          <filter id={`${uid}-blur`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
          </filter>
          
          <mask id={`${uid}-mask`}>
            <path d={LOOP} fill="white" />
          </mask>
          
          <linearGradient id={`${uid}-energy`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="50%" stopColor="white" stopOpacity="0.8" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* sombra de contato */}
        <ellipse cx="70" cy="125" rx="30" ry="6" fill="black" opacity="0.1" />

        <g className="fio-body">
          {/* corpo: loop figura-oito com espessura */}
          <path
            d={LOOP}
            stroke={`url(#${uid}-grad)`}
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
            opacity="0.9"
          />
          {/* sombra interna (volume) */}
          <path d={LOOP} stroke="black" strokeWidth="18" opacity="0.05" fill="none" />
          
          {/* highlight especular */}
          <path
            d="M60 40 C50 40 45 50 50 55"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.3"
          />
          
          {/* fluxo de energia */}
          <path
            d={LOOP}
            stroke={`url(#${uid}-energy)`}
            strokeWidth="2"
            fill="none"
            strokeDasharray="40 80"
            className={effective === "responding" ? "fio-flow-fast" : "fio-flow-slow"}
          />
          
          {/* rosto por expressão */}
          <FioFace expr={expr} />
        </g>
      </svg>
    </div>
  );
}

const LOOP =
  "M70 30 C40 30 40 62 70 68 C100 74 100 106 70 106 C40 106 40 74 70 68 C100 62 100 30 70 30 Z";

function floatAnim(state: FioAnimationState) {
  if (state === "thinking") return "fio-tilt3d 1.8s ease-in-out infinite";
  return "fio-floaty 4s ease-in-out infinite";
}

/** Rostos das 8 expressões da marca (viewBox 140). */
function FioFace({ expr }: { expr: FioExpression }) {
  const base = (
    <>
      <ellipse className="fio-eye" cx="58" cy="68" rx="4" ry="7" fill="white" />
      <ellipse className="fio-eye" cx="82" cy="68" rx="4" ry="7" fill="white" />
    </>
  );
  
  switch (expr) {
    case "feliz":
      return (
        <g>
          {base}
          <path d="M64 78 Q70 82 76 78" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
      );
    case "pensando":
      return (
        <g>
          <ellipse className="fio-eye" cx="58" cy="65" rx="4" ry="7" fill="white" />
          <ellipse className="fio-eye" cx="82" cy="65" rx="4" ry="7" fill="white" />
          <rect x="62" y="78" width="16" height="2" rx="1" fill="white" opacity="0.8" />
        </g>
      );
    case "analisando":
      return (
        <g>
          <rect x="54" y="66" width="10" height="3" rx="1.5" fill="white" />
          <rect x="76" y="66" width="10" height="3" rx="1.5" fill="white" />
          <circle cx="70" cy="82" r="2" fill="white" opacity="0.6" />
        </g>
      );
    case "surpreso":
      return (
        <g>
          <circle className="fio-eye" cx="58" cy="66" r="5" fill="white" />
          <circle className="fio-eye" cx="82" cy="66" r="5" fill="white" />
          <circle cx="70" cy="84" r="4" fill="white" opacity="0.9" />
        </g>
      );
    case "respondendo":
      return (
        <g>
          {base}
          <g className="fio-flow-fast">
             <circle cx="70" cy="85" r="2" fill="white" />
             <circle cx="62" cy="85" r="1.5" fill="white" opacity="0.4" />
             <circle cx="78" cy="85" r="1.5" fill="white" opacity="0.4" />
          </g>
        </g>
      );
    case "confirmando":
      return (
        <g>
          <path d="M52 68 L58 74 L68 62" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M76 68 L82 74 L92 62" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      );
    case "curioso":
      return (
        <g>
          <ellipse className="fio-eye" cx="58" cy="64" rx="4" ry="7" fill="white" transform="rotate(-10 58 64)" />
          <ellipse className="fio-eye" cx="82" cy="68" rx="4" ry="7" fill="white" />
          <path d="M68 82 Q70 85 72 82" stroke="white" strokeWidth="2" fill="none" />
        </g>
      );
    case "descansando":
      return (
        <g opacity="0.6">
          <path d="M54 70 Q58 72 62 70" stroke="white" strokeWidth="2.5" fill="none" />
          <path d="M78 70 Q82 72 86 70" stroke="white" strokeWidth="2.5" fill="none" />
          <text x="90" y="55" fill="white" fontSize="12" fontWeight="bold" opacity="0.5">z</text>
          <text x="100" y="45" fill="white" fontSize="8" fontWeight="bold" opacity="0.3">z</text>
        </g>
      );
    default:
      return <g>{base}</g>;
  }
}
