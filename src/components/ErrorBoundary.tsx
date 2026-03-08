import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-[50vh] flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4 text-center px-4">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <h2 className="text-lg font-semibold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground max-w-md">
              The page failed to load. This can happen due to a network issue or after an update.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={this.handleRetry}>
                Try Again
              </Button>
              <Button onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
