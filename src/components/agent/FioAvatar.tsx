import { useEffect, useRef, useState } from "react";
import { DotLottieReact, type DotLottie } from "@lottiefiles/dotlottie-react";
import { cn } from "@/lib/utils";
import fallbackLogo from "@/assets/fio-logo.png";
import {
  FIO_LOTTIE_URLS,
  FIO_LOTTIE_SPEED,
  type FioAnimationState,
} from "@/lib/fio-lottie";

/**
 * Avatar animado do Fio. Renderiza um Lottie do estado atual e reage a hover.
 * - Se `state` for informado (thinking/responding), ele sobrepõe o hover.
 * - Se o Lottie falhar em carregar, cai para o logo estático (nada quebra).
 */
export function FioAvatar({
  state = "idle",
  size = 48,
  className,
  hoverOnEnter = true,
  loop = true,
  autoplay = true,
  rounded = true,
}: {
  state?: FioAnimationState;
  size?: number;
  className?: string;
  hoverOnEnter?: boolean;
  loop?: boolean;
  autoplay?: boolean;
  rounded?: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [failed, setFailed] = useState(false);
  const dotlottieRef = useRef<DotLottie | null>(null);

  // Estado efetivo: thinking/responding têm prioridade sobre hover.
  const effective: FioAnimationState =
    state === "thinking" || state === "responding"
      ? state
      : hoverOnEnter && hovered
        ? "hover"
        : "idle";

  const src = FIO_LOTTIE_URLS[effective];
  const speed = FIO_LOTTIE_SPEED[effective] ?? 1;

  useEffect(() => {
    if (!dotlottieRef.current) return;
    try {
      dotlottieRef.current.setSpeed(speed);
    } catch {
      // ignore
    }
  }, [speed, src]);

  const dimensions = { width: size, height: size };

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden",
        rounded && "rounded-2xl",
        className,
      )}
      style={dimensions}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {failed ? (
        <img
          src={fallbackLogo}
          alt="Fio"
          width={size}
          height={size}
          className={cn("h-full w-full object-cover", rounded && "rounded-2xl")}
        />
      ) : (
        <DotLottieReact
          key={src}
          src={src}
          loop={loop}
          autoplay={autoplay}
          dotLottieRefCallback={(ref) => {
            dotlottieRef.current = ref;
            try {
              ref?.setSpeed(speed);
            } catch {
              // ignore
            }
          }}
          onLoadError={() => setFailed(true)}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}
