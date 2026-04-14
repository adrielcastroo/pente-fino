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

  handleReset = () => {
    // Clear all localStorage to reset the app to a clean state
    localStorage.clear();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-100 font-sans selection:bg-primary/30">
          <div className="w-20 h-20 bg-destructive/10 text-destructive rounded-3xl flex items-center justify-center mb-8 border border-destructive/20 animate-pulse">
             <span className="text-4xl font-black">!</span>
          </div>
          
          <h1 className="text-3xl font-black tracking-tight mb-2">Ops! Algo deu errado</h1>
          <p className="text-slate-400 font-medium mb-8 max-w-md mx-auto leading-relaxed">
            O aplicativo encontrou um erro inesperado (provavelmente um loop de renderização ou falta de memória).
          </p>

          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-8 text-left overflow-hidden shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Detalhes Técnicos:</p>
            <pre className="text-xs font-mono text-destructive/80 whitespace-pre-wrap break-all max-h-[200px] overflow-y-auto custom-scrollbar leading-relaxed">
              {this.state.error?.name}: {this.state.error?.message}
              {"\n\n"}
              {this.state.error?.stack?.split('\n').slice(0, 3).join('\n')}
            </pre>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full h-14 bg-primary text-primary-foreground rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
            >
              Tentar Novamente
            </button>
            <button 
              onClick={this.handleReset} 
              className="w-full h-14 bg-slate-800 text-slate-300 rounded-2xl font-bold hover:bg-slate-700 transition-all border border-slate-700/50"
            >
              Resetar Dados Locais
            </button>
          </div>
          
          <p className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">Pente Fino v4.0</p>
        </div>
      );
    }
    return this.props.children;
  }
}
