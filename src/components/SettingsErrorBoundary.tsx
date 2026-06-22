import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  panelName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Local error boundary for Settings panels. Prevents a crash in one panel
 * (e.g. realtime presence failure in TeamPanel) from collapsing the whole app.
 */
export class SettingsErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[SettingsErrorBoundary]', this.props.panelName, error, info);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="rounded-md border border-destructive/20 bg-destructive/5 p-6 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-md bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-6 h-6 text-destructive" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            Não foi possível carregar este painel
          </h3>
          <p className="text-xs text-muted-foreground">
            {this.state.error?.message || 'Ocorreu um erro inesperado.'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={this.reset} className="gap-2 rounded-md">
          <RefreshCw className="w-3.5 h-3.5" />
          Tentar novamente
        </Button>
      </div>
    );
  }
}

export default SettingsErrorBoundary;
