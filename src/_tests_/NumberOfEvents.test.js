import { render } from "@testing-library/react";
import NumberOfEvents from "../components/NumberOfEvents";
import userEvent from "@testing-library/user-event";

describe("<NumberOfEvents /> component", () => {
  let NumberOfEventsComponent;
  beforeEach(() => {
    NumberOfEventsComponent = render(<NumberOfEvents eventsNumber={32} />);
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
    NumberOfEventsComponent.rerender(<NumberOfEvents eventsNumber={10} />);
    const user = userEvent.setup();
    const numberOfEventsTextBox =
      NumberOfEventsComponent.queryByRole("textbox");
    await user.type(numberOfEventsTextBox, "{backspace}{backspace}10");
    expect(numberOfEventsTextBox.value).toBe("10");
  });
});
