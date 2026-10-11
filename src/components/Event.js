import { useState } from "react";

export const formatEventStart = (start) => {
  if (start?.dateTime) {
    const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
    if (typeof start.dateTime !== "string" || !timestampPattern.test(start.dateTime)) {
      return "Date unavailable";
    }
    const day = new Date(`${start.dateTime.slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== start.dateTime.slice(0, 10)) return "Date unavailable";
    const date = new Date(start.dateTime);
    return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString("en-US");
  }
  if (typeof start?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(start.date)) {
    const date = new Date(`${start.date}T00:00:00Z`);
    if (!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === start.date) {
      return `${date.toLocaleDateString("en-US", { timeZone: "UTC" })} (all day)`;
    }
  }
  return "Date unavailable";
};

const Event = ({ event }) => {
  const [isHidden, setIsHidden] = useState(true);
  return (
    <li className="event">
      <h1 className="event_summary">{event.summary || "Untitled event"}</h1>
      <p className="event_start">{formatEventStart(event.start)}</p>
      <p className="event_location">{event.location || "Location unavailable"}</p>
      {!isHidden && <div className="event_details"><p>{event.description || "No description available"}</p></div>}
      <button className="details-btn" aria-expanded={!isHidden} onClick={() => setIsHidden((hidden) => !hidden)}>
        {isHidden ? "Show details" : "Hide details"}
      </button>
    </li>
  );
};
export default Event;
