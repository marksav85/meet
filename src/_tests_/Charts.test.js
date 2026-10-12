import { render, screen } from "@testing-library/react";
import CityEventsChart from "../components/CityEventsChart";
import EventGenresChart from "../components/EventGenresChart";

// jsdom has no layout. Expose the series passed to Recharts, while exercising
// the real components and rerenders (the browser suite checks actual SVGs).
jest.mock("recharts", () => {
  const React = require("react");
  const Container = ({ children }) => <div>{children}</div>;
  const Empty = () => null;
  return {
    ResponsiveContainer: Container, BarChart: ({ children, data }) => <div><output aria-label="City series">{JSON.stringify(data)}</output>{children}</div>, PieChart: Container,
    Bar: Empty,
    Pie: ({ data }) => <output aria-label="Genre series">{JSON.stringify(data)}</output>,
    Cell: Empty, Legend: Empty, XAxis: Empty, YAxis: Empty, CartesianGrid: Empty, Tooltip: Empty,
  };
});
test("city counts update on same-length filtering, count changes, and empty events", () => {
  const allLocations = ["London, UK", "Berlin, Germany"];
  const view = render(<CityEventsChart allLocations={allLocations} events={[{ location: allLocations[0] }, { location: allLocations[1] }]} />);
  const data = () => JSON.parse(screen.getByLabelText("City series").textContent);
  expect(data()).toEqual([{ city: "London", count: 1 }, { city: "Berlin", count: 1 }]);
  view.rerender(<CityEventsChart allLocations={allLocations} events={[{ location: allLocations[1] }, { location: allLocations[1] }]} />);
  expect(data()).toEqual([{ city: "Berlin", count: 2 }]);
  view.rerender(<CityEventsChart allLocations={allLocations} events={[{ location: allLocations[1] }]} />);
  expect(data()[0].count).toBe(1);
  view.rerender(<CityEventsChart allLocations={allLocations} events={[]} />);
  expect(screen.getByText("No city data to display.")).toBeVisible();
  expect(screen.queryByLabelText("City series")).not.toBeInTheDocument();
});
test("city chart responds when locations change without event changes", () => {
  const events = [{ location: "Paris" }];
  const view = render(<CityEventsChart allLocations={[]} events={events} />);
  view.rerender(<CityEventsChart allLocations={["Paris"]} events={events} />);
  expect(JSON.parse(screen.getByLabelText("City series").textContent)).toEqual([{ city: "Paris", count: 1 }]);
});
test("genre values update on same-length replacements, count changes, and empty events", () => {
  const event = (name) => ({ description: `Category: ${name}` });
  const view = render(<EventGenresChart events={[event("Web Development"), event("AI & Emerging Tech")]} />);
  const series = () => JSON.parse(screen.getByLabelText("Genre series").textContent);
  const values = () => series().map((item) => item.value);
  expect(series().map((item) => item.name)).toEqual(["Web Development", "AI & Emerging Tech", "UX & Creative Tech", "Cloud & DevOps", "Gaming & Interactive", "Startups & Networking"]);
  expect(values()).toEqual([1, 1, 0, 0, 0, 0]);
  view.rerender(<EventGenresChart events={[event("Cloud & DevOps"), event("Cloud & DevOps")]} />);
  expect(values()).toEqual([0, 0, 0, 2, 0, 0]);
  view.rerender(<EventGenresChart events={[event("Gaming & Interactive")]} />);
  expect(values()).toEqual([0, 0, 0, 0, 1, 0]);
  view.rerender(<EventGenresChart events={[]} />);
  expect(values()).toEqual([0, 0, 0, 0, 0, 0]);
});
test("uncategorized events stay out of the pie and markers take precedence over titles", () => {
  render(<EventGenresChart events={[
    { summary: "React", description: "Category: AI & Emerging Tech" },
    { summary: "React", description: "Category: Unknown" },
    { summary: "JavaScript" },
    { description: "Category: Web Development\nCategory: Cloud & DevOps" },
  ]} />);
  expect(JSON.parse(screen.getByLabelText("Genre series").textContent).map((item) => item.value)).toEqual([0, 1, 0, 0, 0, 0]);
});
