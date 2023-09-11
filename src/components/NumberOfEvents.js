import React from "react";
import { useState } from "react";

const NumberOfEvents = ({ eventsNumber, setEventsNumber }) => {
  const updateEventsNumber = (e) => {
    setEventsNumber = e.target.value;
  };

  return (
    <div id="events_number">
      <label>Number of Events:</label>
      <input
        type="text"
        className="event-number-input"
        value={eventsNumber}
        onChange={updateEventsNumber}
      />
    </div>
  );
};

export default NumberOfEvents;
