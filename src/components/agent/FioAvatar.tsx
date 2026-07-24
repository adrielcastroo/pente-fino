import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import fioIdle from "@/assets/fio-3d-idle.png";
import fioHover from "@/assets/fio-3d-hover.png";
import fioThinking from "@/assets/fio-3d-thinking.png";
import fioResponding from "@/assets/fio-3d-responding.png";

export type FioAnimationState = "idle" | "hover" | "thinking" | "responding";

const FIO_IMAGES: Record<FioAnimationState, string> = {
  idle: fioIdle,
  hover: fioHover,
  thinking: fioThinking,
  responding: fioResponding,
};

/**
 * Avatar 3D do Fio. Segue o cursor com tilt sutil (parallax), balança suavemente
 * em idle, faz bounce ao mudar de estado (thinking/responding) e troca a pose
 * de acordo com o estado do agente.
 */
export function FioAvatar({
  state = "idle",
  size = 48,
  className,
  hoverOnEnter = true,
  interactive = true,
  rounded = false,
}: {
  state?: FioAnimationState;
  size?: number;
  className?: string;
  hoverOnEnter?: boolean;
  /** Se true, faz tilt seguindo o mouse na área ao redor do avatar */
  interactive?: boolean;
  rounded?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [bounceKey, setBounceKey] = useState(0);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // Estado efetivo: thinking/responding têm prioridade sobre hover.
  const effective: FioAnimationState =
    state === "thinking" || state === "responding"
      ? state
      : hoverOnEnter && hovered
        ? "hover"
        : "idle";

  const src = FIO_IMAGES[effective];

  // Trigger bounce quando estado mudar para thinking/responding/hover
  useEffect(() => {
    setBounceKey((k) => k + 1);
  }, [effective]);

  // Mouse tracking (global) para tilt suave — só quando interactive
  useEffect(() => {
    if (!interactive) return;
    const handleMove = (e: MouseEvent) => {
      const el = imgRef.current;
      if (!el) return;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        // Distância máxima de influência (px)
        const maxDist = 380;
        const dist = Math.hypot(dx, dy);
        const influence = Math.max(0, 1 - dist / maxDist);
        // Ângulo/translação máxima
        const maxRotate = 12; // deg
        const maxTranslate = 4; // px
        const nx = dx / (rect.width || 1);
        const ny = dy / (rect.height || 1);
        const rotY = Math.max(-maxRotate, Math.min(maxRotate, nx * maxRotate)) * influence;
        const rotX = Math.max(-maxRotate, Math.min(maxRotate, -ny * maxRotate)) * influence;
        const tx = Math.max(-maxTranslate, Math.min(maxTranslate, nx * maxTranslate)) * influence;
        const ty = Math.max(-maxTranslate, Math.min(maxTranslate, ny * maxTranslate)) * influence;
        el.style.transform = `perspective(600px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0)`;
      });
    };
    window.addEventListener("mousemove", handleMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", handleMove);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [interactive]);

  const dimensions = { width: size, height: size };

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-visible",
        rounded && "rounded-2xl overflow-hidden",
        className,
      )}
      style={dimensions}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Glow pulsante quando thinking/responding */}
      {(effective === "thinking" || effective === "responding") && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 rounded-full blur-xl -z-0",
            effective === "thinking"
              ? "bg-primary/30 animate-pulse"
              : "bg-cyan-400/40 animate-ping",
          )}
        />
      )}

      {/* Camada de animação CSS (float/bounce/pop) */}
      <div
        key={`anim-${effective}-${bounceKey}`}
        className={cn(
          "relative h-full w-full",
          effective === "idle" && "animate-fio-float",
          effective === "hover" && "animate-fio-bounce",
          effective === "thinking" && "animate-fio-tilt",
          effective === "responding" && "animate-fio-pop",
        )}
      >
        {/* Camada de tilt controlada pelo mouse */}
        <img
          ref={imgRef}
          src={src}
          alt="Fio"
          width={size}
          height={size}
          draggable={false}
          loading="lazy"
          className="h-full w-full object-contain select-none pointer-events-none will-change-transform transition-transform duration-300 ease-out"
          style={{
            transform: "perspective(600px) rotateX(0deg) rotateY(0deg)",
            filter: "drop-shadow(0 6px 12px rgba(0, 102, 255, 0.25))",
          }}
        />
      </div>
    </div>
  );
}
