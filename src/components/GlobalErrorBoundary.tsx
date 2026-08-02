import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
          <div className="w-20 h-20 rounded-md bg-destructive/10 flex items-center justify-center mb-8 animate-in zoom-in-95 duration-500">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          
          <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-3">
            O sistema precisou parar aqui
          </h1>
          
          <p className="text-muted-foreground max-w-md mb-8 font-medium">
            Um erro inesperado interrompeu esta tela. Seus dados e conferências em andamento
            estão preservados — recarregar costuma resolver.
          </p>

          <div className="bg-muted/30 border border-border/50 rounded-md p-6 mb-10 w-full max-w-lg text-left overflow-auto max-h-[200px]">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">Detalhes técnicos (para o suporte)</p>
            <code className="text-xs font-mono text-destructive font-bold break-all">
              {this.state.error?.name}: {this.state.error?.message}
            </code>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
            <Button 
              onClick={this.handleReset} 
              className="flex-1 h-12 rounded-md font-bold gap-2 shadow-lg shadow-primary/20"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar Página
            </Button>
            
            <Button 
              variant="outline" 
              onClick={this.handleGoHome} 
              className="flex-1 h-12 rounded-md font-bold gap-2"
            >
              <Home className="w-4 h-4" />
              Voltar ao Início
            </Button>
          </div>
          
          <p className="mt-12 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/40">
            Pente Fino • Erro Crítico
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;
