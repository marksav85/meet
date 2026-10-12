import Event from "./Event";

/**
 * Renders App’s already ordered, capped and filtered events as an accessible list.
 * Delegates each card to Event, using event IDs to preserve React component identity.
 */
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
