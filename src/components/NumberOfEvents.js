const NumberOfEvents = ({ setCurrentNOE }) => {
  const handleInputChange = (e) => {
    const value = e.target.value;
    setCurrentNOE(value);
  };

  return (
    <div id="event-number">
      <input type="text" defaultValue="32" onChange={handleInputChange} />
    </div>
  );
};

export default NumberOfEvents;
