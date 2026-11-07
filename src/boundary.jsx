import React from "react";

// Shows a friendly message instead of a blank page if something unexpected fails.
export default class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { failed: false }; }
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(err) { console.error(err); }
  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div style={{ maxWidth: 640, margin: "60px auto", padding: 24, fontFamily: "system-ui, sans-serif", lineHeight: 1.5 }}>
        <h1 style={{ fontFamily: "Georgia, serif" }}>Something went wrong</h1>
        <p>The app hit an unexpected problem. Your data and sampling results were not changed. Reload the page to start again.</p>
        <p><button onClick={() => { history.replaceState(null, "", location.pathname); location.reload(); }} style={{ padding: "8px 16px", fontSize: 15 }}>Reload the app</button></p>
      </div>
    );
  }
}
