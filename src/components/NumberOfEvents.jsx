import { useState } from "react";

const NumberOfEvents = ({ setCurrentNOE, setErrorAlert }) => {
  const [input, setInput] = useState("32");
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
      setErrorAlert("Please enter a whole number from 1 to 32");
    } else if (Number(value) < 1 || Number(value) > 32) {
      setErrorAlert("Please enter a whole number from 1 to 32");
    } else {
      setErrorAlert("");
      setCurrentNOE(Number(value));
    }
  };
  return (
    <div id="event-number">
      <input aria-label="Number of events" type="text" inputMode="numeric" value={input} onChange={handleInputChange} />
    </div>
  );
};
export default NumberOfEvents;
