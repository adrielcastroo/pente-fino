// Shim para sonner - redireciona todas as importações para nosso sistema customizado
// Isso permite que todos os componentes continuem importando de 'sonner' sem mudar código

import { toastAPI, Toaster } from './components/ui/ToastContext';

// Re-exportar como módulo sonner compatível
export const toast = toastAPI;
export const Toast = toastAPI; // alias para compatibilidade
export { Toaster };
export default toastAPI;

// Re-exportar tipos
export type { ToastType } from './components/ui/ToastContext';
