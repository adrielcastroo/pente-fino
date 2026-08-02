import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props { children: ReactNode }
interface State { hasError: boolean; error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  private reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div role="alert" className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card/60 backdrop-blur-xl border border-white/10 rounded-md p-8 shadow-2xl text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-md bg-destructive/15 text-destructive flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Não foi possível carregar esta área</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Um erro inesperado interrompeu o carregamento. Nada do seu trabalho foi perdido —
              tente novamente ou volte ao início.
            </p>
            {this.state.error?.message && (
              <p className="text-[11px] font-mono text-muted-foreground/70 mt-3 break-all">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-center pt-2">
            <Button onClick={this.reset} className="gap-2" aria-label="Tentar novamente">
              <RefreshCw className="w-4 h-4" /> Tentar novamente
            </Button>
            <Button
              variant="outline"
              onClick={() => { window.location.href = '/'; }}
              className="gap-2"
              aria-label="Ir para o início"
            >
              <Home className="w-4 h-4" /> Início
            </Button>
          </div>
        </div>
      </div>
    );
  }
}
