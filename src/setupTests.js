// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";

jest.setTimeout(30000);

const { ResizeObserver } = window;

beforeEach(() => {
  //@ts-ignore
  delete window.ResizeObserver;
  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
});

afterEach(() => {
  window.ResizeObserver = ResizeObserver;
  jest.restoreAllMocks();
});

// Tests always use fixtures; never infer API access from the test runner's URL.
jest.mock("./api", () => ({
  ...jest.requireActual("./api"),
  getEvents: jest.fn(),
  startAuthentication: jest.fn(),
}));

beforeEach(() => {
  const { getEvents, startAuthentication } = require("./api");
  getEvents.mockReset();
  startAuthentication.mockReset();
  getEvents.mockResolvedValue(require("./mock-data").default);
});
