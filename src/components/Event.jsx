import { useState, useId } from "react";

import { EVENT_CATEGORIES, getEventCategory } from "../event-categories";
import Icon from "./Icon";

/**
 * Formats a Calendar start object: timed events use the viewer’s local time zone,
 * all-day events retain their calendar date, and invalid values return a placeholder.
 */
export const formatEventStart = (start) => {
  if (start?.dateTime) {
    const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
    if (typeof start.dateTime !== "string" || !timestampPattern.test(start.dateTime)) {
      return "Date unavailable";
    }
    // Reject impossible calendar dates that JavaScript would otherwise roll into another month.
    const day = new Date(`${start.dateTime.slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== start.dateTime.slice(0, 10)) return "Date unavailable";
    const date = new Date(start.dateTime);
    return Number.isNaN(date.getTime()) ? "Date unavailable" : date.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit", timeZoneName: "short" });
  }
  if (typeof start?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(start.date)) {
    const date = new Date(`${start.date}T00:00:00Z`);
    if (!Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === start.date) {
      return `${date.toLocaleDateString("en-US", { timeZone: "UTC" })} (all day)`;
    }
  }
  return "Date unavailable";
};

/**
 * Renders one Calendar event card with its category, start time and location.
 * Owns the expanded-details state; event data and filtering come from App via EventList.
 */
const Event = ({ event }) => {
  const [isHidden, setIsHidden] = useState(true);
  const detailsId = useId();
  // Reuse the shared description-marker parser for the badge and its theme color.
  const category = getEventCategory(event);
  const color = EVENT_CATEGORIES.find(({ name }) => name === category)?.color || "var(--text-muted)";
  // Display Calendar formatting as text; recognized category metadata appears separately.
  const description = (event.description || "")
    .replace(/<br\s*\/?\s*>|<\/(?:p|div|li)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/gi, "&")
    .replace(/^\s*Category:[^\r\n]*$/gim, category ? "" : "$&").trim();
  return (
    <li className="event" style={{ "--category-accent": color }}>
      {/* The details button toggles local visibility and exposes its state to assistive tools. */}
      <div className="event-header">
        <div>
          <span className="category-badge">{category || "Uncategorized"}</span>
          <h3 className="event_summary">{event.summary || "Untitled event"}</h3>
        </div>
        <button type="button" className="details-btn" aria-expanded={!isHidden} aria-controls={detailsId} onClick={() => setIsHidden((hidden) => !hidden)}>
          {isHidden ? "Show details" : "Hide details"}<Icon name="chevron" />
        </button>
      </div>
      {/* Show actual Calendar metadata, with placeholders for absent values. */}
      <div className="event-metadata">
        <div><Icon name="calendar" /><p className="event_start">{formatEventStart(event.start)}</p></div>
        <div><Icon name="location" /><p className="event_location">{event.location || "Location unavailable"}</p></div>
      </div>
      {/* Collapsed cards show a preview; expanded cards show the full text description. */}
      {isHidden && description && <p className="event-preview">{description}</p>}
      {!isHidden && <div className="event_details" id={detailsId}>
        {category && <span className="detail-category"><strong>Category:</strong> {category}</span>}
        <p>{description || "No description available"}</p>
      </div>}
    </li>
  );
};
export default Event;
