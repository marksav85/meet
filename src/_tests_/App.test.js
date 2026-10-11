// src/__tests__/App.test.js

import { render, within, screen } from "@testing-library/react";
import userEvent from "../test-utils";
import { getEvents } from "../api";
import App from "../App";

describe("<App /> component", () => {
  let AppDOM;
  beforeEach(async () => {
    AppDOM = render(<App />).container.firstChild;
    await screen.findAllByRole("button", { name: "Show details" });
  });

  test("renders list of events", () => {
    expect(AppDOM.querySelector("#event-list")).toBeInTheDocument();
  });

  test("render CitySearch", () => {
    expect(AppDOM.querySelector("#city-search")).toBeInTheDocument();
  });

  test("render NumberOfEvents", () => {
    expect(AppDOM.querySelector("#event-number")).toBeInTheDocument();
  });
});

// **INTEGRATION TESTS**

describe("<App /> integration", () => {
  test("renders a list of events matching the city selected by the user", async () => {
    const user = userEvent.setup();
    const AppComponent = render(<App />);
    const AppDOM = AppComponent.container.firstChild;

    const CitySearchDOM = AppDOM.querySelector("#city-search");
    const CitySearchInput = within(CitySearchDOM).queryByRole("textbox");

    await user.type(CitySearchInput, "Berlin");
    const berlinSuggestionItem =
      within(CitySearchDOM).queryByText("Berlin, Germany");
    await user.click(berlinSuggestionItem);

    const EventListDOM = AppDOM.querySelector("#event-list");
    const allRenderedEventItems =
      within(EventListDOM).queryAllByRole("listitem");

    const allEvents = await getEvents();
    const berlinEvents = allEvents.filter(
      (event) => event.location === "Berlin, Germany"
    );

    expect(allRenderedEventItems.length).toBe(berlinEvents.length);

    allRenderedEventItems.forEach((event) => {
      expect(event.textContent).toContain("Berlin, Germany");
    });
  });
});
