import { useEffect, useState } from "react";
import Icon from "./Icon";

const initialTheme = () => {
  // index.html already chose a theme before first paint; React must keep that choice.
  if (["light", "dark"].includes(document.documentElement.dataset.theme)) return document.documentElement.dataset.theme;
  try {
    const saved = localStorage.getItem("meet-theme");
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* A theme still works when browser storage is unavailable. */ }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const ThemeToggle = () => {
  const [theme, setTheme] = useState(initialTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0f131c" : "#f8fafc");
  }, [theme]);
  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    // Save only explicit choices, so first visits can follow the OS preference.
    try { localStorage.setItem("meet-theme", next); } catch { /* Keep the in-memory choice. */ }
  };
  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}>
      <span className={theme === "light" ? "theme-choice active" : "theme-choice"}><Icon name="sun" />{theme === "light" && <span>Light</span>}</span>
      <span className={theme === "dark" ? "theme-choice active" : "theme-choice"}><Icon name="moon" />{theme === "dark" && <span>Dark</span>}</span>
    </button>
  );
};
export default ThemeToggle;
