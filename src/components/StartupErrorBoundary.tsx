import { Component, type ErrorInfo, type ReactNode } from "react";

type RootErrorBoundaryState = { error: Error | null };

export class RootErrorBoundary extends Component<
  { children: ReactNode },
  RootErrorBoundaryState
> {
  state: RootErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RootErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("APPLICATION ROOT ERROR", error, errorInfo);
  }

  render() {
    if (!this.state.error) return this.props.children;
    const isConfigurationError = this.state.error.message.includes(
      "VITE_CONVEX_URL",
    );
    const safeMessage = isConfigurationError
      ? "Application configuration error: VITE_CONVEX_URL is missing."
      : "An unexpected application error occurred. Please reload and try again.";

    return <StartupError title="Application error" message={safeMessage} />;
  }
}

export function StartupError({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <section className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-lg">
        <p className="text-xs font-heading tracking-[0.2em] text-primary uppercase">
          Musalhu Creative Studio
        </p>
        <h1 className="mt-3 text-xl font-heading font-semibold">{title}</h1>
        <p className="mt-3 text-sm text-muted-foreground">{message}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Reload application
        </button>
      </section>
    </main>
  );
}
