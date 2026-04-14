import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Global error handling for early detection
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global Error Caught:", { message, source, lineno, colno, error });
  // You can even try to show a minimal UI if the root is empty
  const root = document.getElementById("root");
  if (root && !root.innerHTML) {
    root.innerHTML = `<div style="padding: 20px; font-family: sans-serif; text-align: center;">
      <h2>Erro de Carregamento</h2>
      <p>Ocorreu um problema ao carregar o aplicativo.</p>
      <p style="font-size: 12px; color: #666;">${message}</p>
      <button onclick="window.location.reload()" style="padding: 8px 16px; margin-top: 10px; cursor: pointer;">Recarregar</button>
    </div>`;
  }
};

// Optimize for low-end devices like budget tablets (e.g. TCL Tab 10L)
const checkPerformance = () => {
  try {
    const cores = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
    // @ts-ignore - memory is not in all browser types
    const memory = (typeof navigator !== 'undefined' && navigator.deviceMemory) || 4;
    const isLowPerf = cores <= 4 || memory <= 3;
    
    if (isLowPerf) {
      document.documentElement.classList.add('low-perf');
      console.log('Low performance mode enabled');
    }
  } catch (e) {
    console.warn('Performance check failed:', e);
  }
};

checkPerformance();

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("Root element not found");
}