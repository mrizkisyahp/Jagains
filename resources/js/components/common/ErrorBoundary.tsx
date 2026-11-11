import React, { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    public override state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public override componentDidCatch(
        error: Error,
        errorInfo: React.ErrorInfo,
    ) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    public override render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (
                <div className="flex size-full min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/20 p-6 text-center">
                    <p className="text-body-sm font-medium text-muted-foreground">
                        Komponen peta sementara tidak dapat dimuat.
                    </p>
                </div>
            );
        }

        return this.props.children;
    }
}
