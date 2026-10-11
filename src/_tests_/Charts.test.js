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
    ResponsiveContainer: Container, ScatterChart: Container, PieChart: Container,
    Scatter: ({ data }) => <output aria-label="City series">{JSON.stringify(data)}</output>,
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
  expect(data()).toEqual([{ city: "London", count: 0 }, { city: "Berlin", count: 2 }]);
  view.rerender(<CityEventsChart allLocations={allLocations} events={[{ location: allLocations[1] }]} />);
  expect(data()[1].count).toBe(1);
  view.rerender(<CityEventsChart allLocations={allLocations} events={[]} />);
  expect(data().map((item) => item.count)).toEqual([0, 0]);
});
test("city chart responds when locations change without event changes", () => {
  const events = [{ location: "Paris" }];
  const view = render(<CityEventsChart allLocations={[]} events={events} />);
  view.rerender(<CityEventsChart allLocations={["Paris"]} events={events} />);
  expect(JSON.parse(screen.getByLabelText("City series").textContent)).toEqual([{ city: "Paris", count: 1 }]);
});
test("genre values update on same-length replacements, count changes, and empty events", () => {
  const view = render(<EventGenresChart events={[{ summary: "React" }, { summary: "JavaScript" }]} />);
  const values = () => JSON.parse(screen.getByLabelText("Genre series").textContent).map((item) => item.value);
  expect(values()).toEqual([1, 1, 0, 0, 0]);
  view.rerender(<EventGenresChart events={[{ summary: "Node" }, { summary: "Node" }]} />);
  expect(values()).toEqual([0, 0, 2, 0, 0]);
  view.rerender(<EventGenresChart events={[{ summary: "Angular" }]} />);
  expect(values()).toEqual([0, 0, 0, 0, 1]);
  view.rerender(<EventGenresChart events={[]} />);
  expect(values()).toEqual([0, 0, 0, 0, 0]);
});
