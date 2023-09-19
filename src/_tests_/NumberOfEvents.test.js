import { render, within } from "@testing-library/react";
import NumberOfEvents from "../components/NumberOfEvents";
import userEvent from "@testing-library/user-event";
import App from "../App";

describe("<NumberOfEvents /> component", () => {
  let NumberOfEventsComponent;
  beforeEach(() => {
    NumberOfEventsComponent = render(
      <NumberOfEvents setCurrentNOE={() => {}} setErrorAlert={() => {}} />
    );
  });

  test("renders text input", () => {
    const numberOfEventsTextBox =
      NumberOfEventsComponent.queryByRole("textbox");
    expect(numberOfEventsTextBox).toBeInTheDocument();
  });

  test("renders default number of events", () => {
    const numberOfEventsTextBox =
      NumberOfEventsComponent.queryByRole("textbox");
    expect(numberOfEventsTextBox.value).toBe("32");
  });

  test("renders number of events correctly when user types in number of events textbox", async () => {
    const user = userEvent.setup();
    const numberOfEventsTextBox =
      NumberOfEventsComponent.queryByRole("textbox");
    await user.type(numberOfEventsTextBox, "{backspace}{backspace}10");
    expect(numberOfEventsTextBox.value).toBe("10");
  });
});

describe("<NumberOfEvents /> integration", () => {
  test("renders correct number of events when user types in number of events textbox", async () => {
    const user = userEvent.setup();
    const AppComponent = render(<App />);
    const AppDOM = AppComponent.container.firstChild;

    const NumberOfEventsDOM = AppDOM.querySelector("#event-number");
    const numberOfEventsTextBox =
      within(NumberOfEventsDOM).queryByRole("textbox");
    await user.type(numberOfEventsTextBox, "{backspace}{backspace}10");
    const EventListDOM = AppDOM.querySelector("#event-list");
    const allRenderedEventItems =
      within(EventListDOM).queryAllByRole("listitem");
    expect(allRenderedEventItems.length).toBe(10);
  });
});
