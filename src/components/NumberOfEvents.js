const NumberOfEvents = ({ setCurrentNOE, setErrorAlert }) => {
  const handleInputChange = (e) => {
    const value = e.target.value;
    setCurrentNOE(value);

    if (isNaN(value)) {
      setErrorAlert("Please enter a number");
    } else if (value < 1) {
      setErrorAlert("Please enter a number greater than 0");
    } else if (value > 32) {
      setErrorAlert("Please enter a number less than 32");
    } else {
      setErrorAlert("");
    }
  };

  return (
    <div id="event-number">
      <input type="text" defaultValue="32" onChange={handleInputChange} />
    </div>
  );
};

export default NumberOfEvents;
