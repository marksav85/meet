// Names are the canonical values used in Google Calendar descriptions.
export const EVENT_CATEGORIES = [
  { name: "Web Development", color: "#DD0000" },
  { name: "AI & Emerging Tech", color: "#00DD00" },
  { name: "UX & Creative Tech", color: "#0000DD" },
  { name: "Cloud & DevOps", color: "#DDDD00" },
  { name: "Gaming & Interactive", color: "#DD00DD" },
  { name: "Startups & Networking", color: "#00AAAA" },
];

export const getEventCategory = (event) => {
  if (typeof event?.description !== "string") return null;
  // Calendar may wrap description lines in HTML. Treat it only as text; never
  // render it as HTML or execute it. Decode the entities used in category names.
  const text = event.description
    .replace(/<br\s*\/?\s*>|<\/(?:p|div|li)>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/gi, "&")
    .replace(/&nbsp;/gi, " ");
  const markers = [...text.matchAll(/^\s*Category:[ \t]*([^\r\n]*)$/gim)];
  // One event belongs to at most one category. Ambiguous metadata is ignored.
  if (markers.length !== 1) return null;
  const name = markers[0][1].trim().toLowerCase();
  return EVENT_CATEGORIES.find((category) => category.name.toLowerCase() === name)?.name || null;
};
