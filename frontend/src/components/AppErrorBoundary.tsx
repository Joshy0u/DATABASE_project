import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: "100vh",
            padding: 24,
            background: "#09090b",
            color: "#e4e4e7",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1 style={{ color: "#f87171", fontSize: 18, marginBottom: 12 }}>
            The app hit a render error
          </h1>
          <p style={{ marginBottom: 8, opacity: 0.9 }}>
            Copy this to fix or report it:
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontSize: 13,
              background: "#18181b",
              padding: 12,
              borderRadius: 8,
              border: "1px solid #3f3f46",
            }}
          >
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
