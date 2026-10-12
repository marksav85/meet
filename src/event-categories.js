// Names are the canonical values used in Google Calendar descriptions.
export const EVENT_CATEGORIES = [
  { name: "Web Development", color: "var(--category-web)" },
  { name: "AI & Emerging Tech", color: "var(--category-ai)" },
  { name: "UX & Creative Tech", color: "var(--category-ux)" },
  { name: "Cloud & DevOps", color: "var(--category-cloud)" },
  { name: "Gaming & Interactive", color: "var(--category-gaming)" },
  { name: "Startups & Networking", color: "var(--category-startups)" },
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
