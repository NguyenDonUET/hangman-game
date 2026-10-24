import { Component, type ErrorInfo, type ReactNode } from "react";
import { TextButton } from "./Buttons";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  override render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="screen" style={{ alignItems: "center", justifyContent: "center", gap: 24 }}>
        <h1>Something went wrong</h1>
        <p>Reload the game and try again.</p>
        <TextButton onClick={() => window.location.reload()}>Reload</TextButton>
      </main>
    );
  }
}
