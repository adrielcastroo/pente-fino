import { Component, ErrorInfo, ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center p-4 text-center bg-background">
          <h1 className="text-2xl font-bold mb-4">Algo deu errado</h1>
          <p className="text-muted-foreground mb-6">Não foi possível carregar a página.</p>
          <pre className="text-xs bg-muted p-4 rounded mb-6 max-w-full overflow-auto">
            {this.state.error?.message}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Tentar novamente
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
