// src/components/Event.js
import { useState } from "react";

const Event = ({ event }) => {
  const [isHidden, setIsHidden] = useState(true);

  const handleShow = () => {
    setIsHidden(!isHidden);
  };

  return (
    <li>
      <h1 className="event_summary">{event.summary}</h1>
      <p className="event_start">{event.created}</p>
      <p className="event_location">{event.location}</p>

      {!isHidden && (
        <>
          <div className="event_details">
            <p>{event.description}</p>
          </div>
        </>
      )}
      <button onClick={() => handleShow()}>
        {isHidden ? "Show" : "Hide"}
        details
      </button>
    </li>
  );
};

export default Event;
