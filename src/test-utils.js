import userEvent from "@testing-library/user-event";
import { act } from "@testing-library/react";

// RTL 13 predates user-event 14's async wrapping integration. Await each
// interaction inside act so warnings remain visible instead of being suppressed.
const setup = (options) => {
  const user = userEvent.setup(options);
  return {
    ...user,
    ...Object.fromEntries(["click", "type", "clear"].map((method) => [method, async (...args) => {
      await act(async () => { await user[method](...args); });
    }])),
  };
};
export default { setup };
