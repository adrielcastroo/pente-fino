import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Optimize for low-end devices like budget tablets (e.g. TCL Tab 10L)
const checkPerformance = () => {
  const cores = navigator.hardwareConcurrency || 4;
  // @ts-ignore - memory is not in all browser types
  const memory = navigator.deviceMemory || 4;
  const isLowPerf = cores <= 4 || memory <= 3;
  
  if (isLowPerf) {
    document.documentElement.classList.add('low-perf');
    // Disable heavy animations globally if needed
    console.log('Low performance mode enabled');
  }
};

checkPerformance();

createRoot(document.getElementById("root")!).render(<App />);