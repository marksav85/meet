import { EVENT_CATEGORIES, getEventCategory } from "../event-categories";

const CategoryFilter = ({ events, currentCategory, setCurrentCategory }) => (
  <div id="category-filter" role="group" aria-label="Event category" className="category-pills">
    {[{ name: "All Categories" }, ...EVENT_CATEGORIES].map(({ name, color }) => {
      const count = name === "All Categories" ? events.length : events.filter((event) => getEventCategory(event) === name).length;
      return (
        <button type="button" key={name} className="category-pill" style={{ "--category-accent": color || "var(--primary)" }} aria-label={name} aria-pressed={currentCategory === name} onClick={() => setCurrentCategory(name)}>
          {color && <span className="category-dot" />}
          <span>{name}</span><span className="pill-count" aria-hidden="true">{count}</span>
        </button>
      );
    })}
  </div>
);
export default CategoryFilter;
