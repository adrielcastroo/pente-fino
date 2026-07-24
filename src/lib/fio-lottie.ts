// Configuração das animações Lottie do Fio.
// Troque as URLs abaixo por outras do LottieFiles (menu "Asset & Embed" ->
// "Direct link" .lottie ou .json). Todas devem ser públicas em lottie.host
// ou em qualquer CDN que responda com CORS liberado.
//
// Estados suportados:
//  - idle      : loop calmo (respirando/piscando)
//  - hover     : anima ao passar o mouse no botão flutuante
//  - thinking  : enquanto o Fio está processando ("submitted"/"streaming")
//  - responding: burst curto quando termina de responder
//
// Se a URL não carregar (offline/erro), o componente cai automaticamente
// para o logo estático do Fio.

export type FioAnimationState = "idle" | "hover" | "thinking" | "responding";

export const FIO_LOTTIE_URLS: Record<FioAnimationState, string> = {
  idle: "https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.lottie",
  hover: "https://lottie.host/4db68bbd-31f6-4cd8-84eb-189de081159a/IGmMCqhzpt.lottie",
  thinking: "https://lottie.host/4c2a69ec-47c3-49ae-b296-8a4770ce5cf5/sl7OhHvAbk.json",
  responding: "https://lottie.host/4c2a69ec-47c3-49ae-b296-8a4770ce5cf5/sl7OhHvAbk.json",
};

// Velocidade por estado (multiplicador). Mantém "thinking" mais rápido
// para transmitir atividade e "idle" bem calmo.
export const FIO_LOTTIE_SPEED: Record<FioAnimationState, number> = {
  idle: 0.8,
  hover: 1.4,
  thinking: 1.2,
  responding: 1.6,
};
