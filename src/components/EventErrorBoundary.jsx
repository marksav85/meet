import { Component } from "react";

class EventErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(previousProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }
  render() {
    return this.state.failed ? (
      <div role="alert">Events could not be displayed. <button onClick={this.props.onRetry}>Try again</button></div>
    ) : this.props.children;
  }
}
export default EventErrorBoundary;
