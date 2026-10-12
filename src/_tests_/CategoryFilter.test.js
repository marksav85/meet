import { render, screen, within, fireEvent } from "@testing-library/react";
import App from "../App";
import { getEvents } from "../api";
import { EVENT_CATEGORIES } from "../event-categories";
import userEvent from "../test-utils";

jest.mock("../components/CityEventsChart", () => ({ events }) => <output aria-label="City chart events">{JSON.stringify(events.map(({ id }) => id))}</output>);
jest.mock("../components/EventGenresChart", () => ({ events }) => <output aria-label="Category chart events">{JSON.stringify(events.map(({ id }) => id))}</output>);

const makeEvent = (id, location, category) => ({
  id: String(id), summary: `Meeting ${id}`, location,
  description: category ? `Category: ${category}` : "No category marker",
  start: { dateTime: new Date(Date.UTC(2030, 0, 1, id)).toISOString() },
});

test("the earliest 50 events are capped before city/category filtering and shared by cards and charts", async () => {
  const web = EVENT_CATEGORIES[0].name;
  const cloud = EVENT_CATEGORIES[3].name;
  const feed = Array.from({ length: 60 }, (_, i) => makeEvent(i, i < 25 ? "Paris" : "Berlin", i < 40 ? web : cloud));
  // Mix all-day and timed starts, and supply reverse order to exercise sorting.
  feed[0].start = { date: "2030-01-01" };
  getEvents.mockResolvedValueOnce([...feed].reverse());
  render(<App />);
  await screen.findAllByRole("button", { name: "Show details" });
  const list = screen.getByRole("list", { name: "Events" });
  const selector = screen.getByRole("group", { name: "Event category" });
  expect(within(selector).getAllByRole("button").map((button) => button.getAttribute("aria-label")))
    .toEqual(["All Categories", ...EVENT_CATEGORIES.map(({ name }) => name)]);
  const assertResults = (ids) => {
    expect(within(list).queryAllByRole("listitem").map((item) => within(item).getByRole("heading").textContent))
      .toEqual(ids.map((id) => `Meeting ${id}`));
    expect(screen.getByText(`${ids.length} upcoming ${ids.length === 1 ? "event" : "events"} found`)).toBeVisible();
    for (const label of ["City chart events", "Category chart events"]) {
      expect(JSON.parse(screen.getByLabelText(label).textContent)).toEqual(ids.map(String));
    }
  };
  assertResults(Array.from({ length: 50 }, (_, i) => i));
  expect(screen.queryByRole("textbox", { name: "Number of events" })).not.toBeInTheDocument();
  fireEvent.click(within(selector).getByRole("button", { name: cloud }));
  assertResults(Array.from({ length: 10 }, (_, i) => i + 40));
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText("Search for a city"), "Berlin");
  await user.click(screen.getByRole("button", { name: "Berlin" }));
  assertResults(Array.from({ length: 10 }, (_, i) => i + 40));
  fireEvent.click(within(selector).getByRole("button", { name: web }));
  assertResults(Array.from({ length: 15 }, (_, i) => i + 25));
  fireEvent.click(within(selector).getByRole("button", { name: EVENT_CATEGORIES[1].name }));
  assertResults([]);
  expect(screen.getByText("No events found.")).toBeVisible();
  fireEvent.click(within(selector).getByRole("button", { name: "All Categories" }));
  assertResults(Array.from({ length: 25 }, (_, i) => i + 25));
  await user.click(screen.getByPlaceholderText("Search for a city"));
  await user.click(screen.getByText("See all cities", { selector: ".suggestions b" }));
  assertResults(Array.from({ length: 50 }, (_, i) => i));
});

test("All Categories retains uncategorized events and reports singular and zero counts", async () => {
  getEvents.mockResolvedValueOnce([makeEvent(1, "Berlin")]);
  render(<App />);
  expect(await screen.findByText("1 upcoming event found")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: EVENT_CATEGORIES[0].name }));
  expect(screen.getByText("0 upcoming events found")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "All Categories" }));
  expect(screen.getByText("Meeting 1")).toBeVisible();
});

test("events without a usable start sort after dated events and retain their fallback cards", async () => {
  getEvents.mockResolvedValueOnce([{ ...makeEvent(2, "Berlin"), start: {} }, makeEvent(1, "Berlin")]);
  render(<App />);
  await screen.findByText("2 upcoming events found");
  expect(within(screen.getByRole("list", { name: "Events" })).getAllByRole("heading").map((item) => item.textContent)).toEqual(["Meeting 1", "Meeting 2"]);
  expect(screen.getByText("Date unavailable")).toBeVisible();
});
