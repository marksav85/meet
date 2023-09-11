import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Event from "../components/event";
/* import mockData from "../mock-data"; */
import { getEvents } from "../api";

/* const allEvents = mockData[0]; */

describe("<Event /> component", () => {
  let EventComponent;
  let allEvents;

  beforeEach(async () => {
    allEvents = await getEvents();
    EventComponent = render(<Event event={allEvents[0]} />);
  });

  test("renders event title", () => {
    const eventTitle = EventComponent.queryByText(allEvents[0].summary);
    expect(eventTitle).toBeInTheDocument();
  });

  test("renders event start time", () => {
    const eventStart = EventComponent.queryByText(allEvents[0].created);
    expect(eventStart).toBeInTheDocument();
  });

  test("renders event location", () => {
    const eventLocation = EventComponent.queryByText(allEvents[0].location);
    expect(eventLocation).toBeInTheDocument();
  });

  test("renders show details button", () => {
    const showDetailsButton = EventComponent.queryByRole("button");
    expect(showDetailsButton).toBeInTheDocument();
  });

  test("by default, event details are hidden", () => {
    const eventDetails = EventComponent.queryByText(allEvents[0].description);
    expect(eventDetails).not.toBeInTheDocument();
  });

  test("click on details button shows event details", async () => {
    const user = userEvent.setup();
    const showDetailsButton = EventComponent.queryByRole("button");
    await user.click(showDetailsButton);
    const eventDetails =
      EventComponent.container.querySelector(".event_details");
    expect(eventDetails).toBeInTheDocument();
  });

  test("click on details button hides event details", async () => {
    const user = userEvent.setup();
    const showDetailsButton = EventComponent.queryByRole("button");
    await user.click(showDetailsButton);
    const eventDetails =
      EventComponent.container.querySelector(".event_details");
    expect(eventDetails).toBeInTheDocument();
    await user.click(showDetailsButton);
    expect(eventDetails).not.toBeInTheDocument();
  });
});
