import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
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
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10">
                    <div className="flex items-center gap-2 text-destructive mb-2">
                        <AlertTriangle className="h-5 w-5" />
                        <h3 className="font-semibold">Something went wrong</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                        {this.state.error?.message}
                    </p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => this.setState({ hasError: false })}
                    >
                        Try again
                    </Button>
                </div>
            );
        }

        return this.props.children;
    }
}
