import { loadFeature, defineFeature } from "jest-cucumber";
import { render, screen, within } from "@testing-library/react";
import App from "../App";
import userEvent from "../test-utils";

const feature = loadFeature("./src/features/showHideAnEventsDetails.feature");
defineFeature(feature, (test) => {
  let event;
  let user;
  const openApp = async () => {
    user = userEvent.setup();
    render(<App />);
    event = (await screen.findAllByRole("listitem"))[0];
  };
  test("An event element is collapsed by default.", ({ given, when, then }) => {
    given("user can see a list of events", openApp);
    when("user does not click on the show details button", () => {});
    then("the event element will be collapsed by default", () => {
      expect(within(event).getByRole("button", { name: "Show details" })).toHaveAttribute("aria-expanded", "false");
    });
  });
  test("User can expand an event to see details.", ({ given, when, then }) => {
    given("user can see a list of events", openApp);
    when("user clicks on the show details button", async () => {
      await user.click(within(event).getByRole("button", { name: "Show details" }));
    });
    then("the event element will be expanded", () => {
      expect(within(event).getByRole("button", { name: "Hide details" })).toHaveAttribute("aria-expanded", "true");
      expect(event.querySelector(".event_details")).toBeVisible();
    });
  });
  test("User can collapse an event to hide details.", ({ given, and, when, then }) => {
    given("user has already clicked on the details button", async () => {
      await openApp();
      await user.click(within(event).getByRole("button", { name: "Show details" }));
    });
    and("the event element is already expanded", () => {
      expect(event.querySelector(".event_details")).toBeVisible();
    });
    when("user clicks on the hide details button", async () => {
      await user.click(within(event).getByRole("button", { name: "Hide details" }));
    });
    then("the event element will collapse", () => {
      expect(event.querySelector(".event_details")).not.toBeInTheDocument();
      expect(within(event).getByRole("button", { name: "Show details" })).toHaveAttribute("aria-expanded", "false");
    });
  });
});
