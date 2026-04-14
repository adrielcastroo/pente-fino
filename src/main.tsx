import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Check performance early to set a global class if needed
const cores = navigator.hardwareConcurrency || 4;
const isLowPerformance = cores < 4;

if (isLowPerformance) {
  document.documentElement.classList.add('low-perf');
}

createRoot(document.getElementById("root")!).render(<App />);