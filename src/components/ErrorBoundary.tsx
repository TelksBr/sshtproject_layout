import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from '../utils/icons';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
  inline?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch (e) {
        console.error('Error during ErrorBoundary onReset:', e);
      }
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.inline) {
        return (
          <div className="p-3 my-2 rounded-xl border border-rose-500/30 bg-rose-500/10 flex items-center justify-between gap-2 text-xs text-rose-400">
            <div className="flex items-center gap-2 truncate">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span className="truncate">{this.props.fallbackMessage || 'Erro ao carregar componente.'}</span>
            </div>
            <button
              type="button"
              onClick={this.handleReset}
              className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-medium transition-all touch-manipulation"
            >
              Tentar novamente
            </button>
          </div>
        );
      }

      return (
        <div
          className="min-h-[220px] p-6 rounded-2xl flex flex-col items-center justify-center text-center gap-4 my-2"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-rose-500/20 text-rose-400">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text)' }}>
              {this.props.fallbackTitle || 'Ocorreu um erro no componente'}
            </h3>
            <p className="text-xs max-w-sm" style={{ color: 'var(--text-muted)' }}>
              {this.props.fallbackMessage ||
                'O layout foi mantido seguro. Você pode tentar recarregar esta seção.'}
            </p>
          </div>
          <button
            type="button"
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-xs text-white touch-manipulation transition-all active:scale-[0.98]"
            style={{ background: 'var(--accent)' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recarregar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
