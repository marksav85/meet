// Shared SVG shapes keep interface icons local without a font or icon-library dependency.
const paths = {
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
  moon: <path d="M20.5 13.5A9 9 0 0 1 10.5 3.5a9 9 0 1 0 10 10Z" />,
  location: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 11h18" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
  pie: <><circle cx="12" cy="12" r="9" /><path d="M12 3v9h9m-9 0v9" /></>,
  bars: <path d="M5 21V11m7 10V3m7 18v-6" />,
};

/**
 * Renders a named decorative SVG for event metadata, analytics and theme controls.
 * Accepts an optional className; surrounding controls provide accessible labels.
 */
const Icon = ({ name, className = "" }) => (
  <svg className={`icon ${className}`} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    {paths[name]}
  </svg>
);
export default Icon;
