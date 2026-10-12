import { Component } from "react";

/**
 * Contains rendering failures in the event cards and analytics instead of losing the whole UI.
 * App supplies the retry action and a resetKey that allows refreshed data to render again.
 */
class EventErrorBoundary extends Component {
  state = { failed: false };
  // Switch to the fallback when a descendant throws during rendering.
  static getDerivedStateFromError() {
    return { failed: true };
  }
  // Retry rendering only when App provides a changed reset key after a failure.
  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }
  // The retry button delegates data reload to App; this boundary does not fetch events.
  render() {
    return this.state.failed ? (
      <div role="alert">Events could not be displayed. <button onClick={this.props.onRetry}>Try again</button></div>
    ) : this.props.children;
  }
}
export default EventErrorBoundary;
