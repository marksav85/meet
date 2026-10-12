import React from "react";
import { render, screen, within, act, fireEvent } from "@testing-library/react";
import userEvent from "../test-utils";
import App from "../App";
import Event, { formatEventStart } from "../components/Event";
import EventErrorBoundary from "../components/EventErrorBoundary";
import { getEvents, extractLocations } from "../api";

const fixture = { id: "one", summary: "React meeting", location: "Berlin", start: { dateTime: "2026-10-11T18:30:00+02:00" } };
const openApp = async () => {
  render(<App />);
  await screen.findAllByRole("button", { name: "Show details" });
};

test("timed event shows start rather than creation time", () => {
  render(<Event event={{ ...fixture, created: "1999-01-01T00:00:00Z" }} />);
  expect(screen.getByText(new Date(fixture.start.dateTime).toLocaleString("en-US"))).toBeVisible();
  expect(screen.queryByText("1999-01-01T00:00:00Z")).not.toBeInTheDocument();
});
test("all-day event retains its calendar date", () => {
  render(<Event event={{ ...fixture, start: { date: "2026-01-01" } }} />);
  expect(screen.getByText("1/1/2026 (all day)")).toBeVisible();
});
test.each([undefined, {}, { dateTime: "bad" }, { dateTime: 123 }, { dateTime: "2026-02-30T12:00:00Z" }, { date: "2026-02-30" }, { date: "bad" }])("invalid start %p has a graceful fallback", (start) => {
  expect(formatEventStart(start)).toBe("Date unavailable");
});

test.each([undefined, null, {}, [null], ["bad"]])("malformed event response %p reports an error and retries", async (response) => {
  getEvents.mockResolvedValueOnce(response);
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Events could not be loaded");
  await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findAllByRole("button", { name: "Show details" })).toHaveLength(35);
});
test("rejected request is handled", async () => {
  getEvents.mockRejectedValueOnce(new Error("network"));
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Events could not be loaded");
});
test("empty events show useful feedback", async () => {
  getEvents.mockResolvedValueOnce([]);
  render(<App />);
  expect(await screen.findByText("No events found.")).toBeVisible();
});
test("missing optional strings do not break cards, search, or charts", async () => {
  getEvents.mockResolvedValue([{ id: "empty", summary: {}, location: null, description: [] }]);
  await openApp();
  expect(screen.getByText("Untitled event")).toBeVisible();
  expect(screen.getByText("Location unavailable")).toBeVisible();
  expect(extractLocations([{ location: null }, {}, { location: "Berlin" }])).toEqual(["Berlin"]);
});
test("late request cannot overwrite a newer connectivity reload", async () => {
  let resolveOld;
  getEvents.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
  getEvents.mockResolvedValueOnce([{ ...fixture, summary: "New result" }]);
  render(<App />);
  expect(screen.getByRole("status")).toHaveTextContent("Loading events");
  fireEvent(window, new EventConstructor("online"));
  expect(await screen.findByText("New result")).toBeVisible();
  await act(async () => { resolveOld([{ ...fixture, summary: "Old result" }]); });
  expect(screen.queryByText("Old result")).not.toBeInTheDocument();
});
const EventConstructor = window.Event;
test("unmount ignores an outstanding request", async () => {
  let resolve;
  getEvents.mockImplementationOnce(() => new Promise((done) => { resolve = done; }));
  const view = render(<App />);
  view.unmount();
  await act(async () => { resolve([fixture]); });
});
test("rendering failure has a recoverable fallback", async () => {
  const Broken = () => { throw new Error("deliberate rendering failure"); };
  const error = jest.spyOn(console, "error").mockImplementation(() => {});
  try {
    const retry = jest.fn();
    const view = render(<EventErrorBoundary resetKey={0} onRetry={retry}><Broken /></EventErrorBoundary>);
    expect(screen.getByRole("alert")).toHaveTextContent("Events could not be displayed");
    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledTimes(1);
    view.rerender(<EventErrorBoundary resetKey={1} onRetry={retry}><p>Recovered</p></EventErrorBoundary>);
    expect(screen.getByText("Recovered")).toBeVisible();
    expect(error).toHaveBeenCalled();
  } finally { error.mockRestore(); }
});

test("Strict Mode ignores the discarded mount request", async () => {
  let resolveOld;
  getEvents.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
  getEvents.mockResolvedValueOnce([{ ...fixture, summary: "Current mount" }]);
  render(<React.StrictMode><App /></React.StrictMode>);
  expect(await screen.findByText("Current mount")).toBeVisible();
  await act(async () => { resolveOld([{ ...fixture, summary: "Discarded mount" }]); });
  expect(screen.queryByText("Discarded mount")).not.toBeInTheDocument();
});
