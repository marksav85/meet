// src/components/EventList.js
import Event from "./Event";

const EventList = ({ events }) => {
  return (
    <ul id="event-list" aria-label="Events">
      {events
        ? events.map((event) => <Event key={event.id} event={event} />)
        : null}
    </ul>
  );
};

export default EventList;
