import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[9999] bg-black text-red-500 p-8 font-mono overflow-auto">
                    <h1 className="text-2xl font-bold mb-4">CRITICAL SYSTEM FAILURE</h1>
                    <div className="bg-slate-900 p-4 rounded border border-red-900 mb-4">
                        <h2 className="text-xl text-white mb-2">{this.state.error?.name}: {this.state.error?.message}</h2>
                        <pre className="text-xs text-slate-400 whitespace-pre-wrap">
                            {this.state.error?.stack}
                        </pre>
                    </div>
                    <div className="bg-slate-900 p-4 rounded border border-slate-800">
                        <h3 className="text-white mb-2">Component Stack:</h3>
                        <pre className="text-xs text-slate-500 whitespace-pre-wrap">
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-6 py-3 bg-red-600 text-white font-bold rounded hover:bg-red-500"
                    >
                        REBOOT SYSTEM (RELOAD)
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
