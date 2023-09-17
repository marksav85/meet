import { loadFeature, defineFeature } from "jest-cucumber";
import { render } from "@testing-library/react";
import App from "../App";
import userEvent from "@testing-library/user-event";

const feature = loadFeature("./src/features/showHideAnEventsDetails.feature");

defineFeature(feature, (test) => {
  test("An event element is collapsed by default.", ({ given, when, then }) => {
    let AppComponent;
    given("user can see a list of events", async () => {
      AppComponent = render(<App />);
      const AppDOM = AppComponent.container.firstChild;
      const EventListDOM = AppDOM.querySelector("#event-list");
      expect(EventListDOM).toBeInTheDocument();
    });

    when("user does not click on the show details button", () => {
      // no code needed for this step
    });

    then("the event element will be collapsed by default", () => {
      const AppDOM = AppComponent.container.firstChild;
      const EventListDOM = AppDOM.querySelector("#event-list");
      const EventDetails = EventListDOM.querySelector(".event_details");
      expect(EventDetails).not.toBeInTheDocument();
    });
  });

  test("User can expand an event to see details.", ({ given, when, then }) => {
    let AppComponent;
    let AppDOM;
    let EventListDOM;

    given("user can see a list of events", () => {
      AppComponent = render(<App />);
      AppDOM = AppComponent.container.firstChild;
      EventListDOM = AppDOM.querySelector("#event-list");
      expect(EventListDOM).toBeInTheDocument();
    });

    when("user clicks on the show details button", async () => {
      const user = userEvent.setup();
      const showDetailsButton = EventListDOM.querySelector(".details-btn");
      await user.click(showDetailsButton);
    });

    then("the event element will be expanded", async () => {
      const user = userEvent.setup();
      const showDetailsButton = EventListDOM.querySelector(".details-btn");
      await user.click(showDetailsButton);
      const eventDetails = EventListDOM.querySelector(".event_details");
      expect(eventDetails).toBeInTheDocument();
    });
  });

  test("User can collapse an event to hide details.", ({
    given,
    and,
    when,
    then,
  }) => {
    let AppComponent;
    let AppDOM;
    let EventListDOM;
    given("user has already clicked on the details button", async () => {
      AppComponent = render(<App />);
      const user = userEvent.setup();
      AppDOM = AppComponent.container.firstChild;
      EventListDOM = AppDOM.querySelector("#event-list");
      const showDetailsButton = EventListDOM.querySelector(".details-btn");
      await user.click(showDetailsButton);
    });

    and("the event element is already expanded", async () => {
      const user = userEvent.setup();
      const showDetailsButton = EventListDOM.querySelector(".details-btn");
      await user.click(showDetailsButton);
      const eventDetails = EventListDOM.querySelector(".event_details");
      expect(eventDetails).toBeInTheDocument();
    });

    when("user clicks on the hide details button", async () => {
      const user = userEvent.setup();
      const showDetailsButton = EventListDOM.querySelector(".details-btn");
      await user.click(showDetailsButton);
    });

    then("the event element will collapse", async () => {
      const user = userEvent.setup();
      const showDetailsButton = EventListDOM.querySelector(".details-btn");
      await user.click(showDetailsButton);
      const eventDetails = EventListDOM.querySelector(".event_details");
      await user.click(showDetailsButton);
      expect(eventDetails).not.toBeInTheDocument();
    });
  });
});
