import { loadFeature, defineFeature } from "jest-cucumber";
import { render, within, waitFor } from "@testing-library/react";
import App from "../App";
import { getEvents } from "../api";
import userEvent from "@testing-library/user-event";

const feature = loadFeature("./src/features/specifyNumberOfEvents.feature");

defineFeature(feature, (test) => {
  test("When user hasn’t specified a number, 32 events are shown by default", ({
    given,
    and,
    when,
    then,
  }) => {
    let AppComponent;
    given("the app is open", () => {
      AppComponent = render(<App />);
    });
    let AppDOM;
    and("a list of events is displayed", () => {
      AppDOM = AppComponent.container.firstChild;
      const EventListDOM = AppDOM.querySelector("#event-list");
      expect(EventListDOM).toBeInTheDocument();
    });

    when("user does not specify a number of events", () => {
      // no code needed for this step
    });

    then(/^(\d+) events are shown by default$/, (arg0) => {
      const EventNumberDOM = AppDOM.querySelector("#event-number");
      const EventNumberInput = within(EventNumberDOM).queryByRole("textbox");
      expect(EventNumberInput.value).toBe("32");
    });
  });

  test("User can change the number of events displayed.", ({
    given,
    when,
    then,
  }) => {
    let AppComponent;
    let AppDOM;
    given("user can see a list of events", () => {
      AppComponent = render(<App />);
      AppDOM = AppComponent.container.firstChild;
      const EventListDOM = AppDOM.querySelector("#event-list");
      expect(EventListDOM).toBeInTheDocument();
    });

    when(/^user enters the number (\d+)$/, async (arg0) => {
      const user = userEvent.setup();
      const EventNumberDOM = AppDOM.querySelector("#event-number");
      const EventNumberInput = within(EventNumberDOM).queryByRole("textbox");
      await user.type(EventNumberInput, "{backspace}{backspace}{backspace}3");
    });

    then(/^a maximum of (\d+) events are shown$/, async (arg0) => {
      const EventListDOM = AppDOM.querySelector("#event-list");
      const EventListItems = within(EventListDOM).queryAllByRole("listitem");
      expect(EventListItems.length).toBe(3);
    });
  });
});
