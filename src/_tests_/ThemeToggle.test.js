import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "../test-utils";
import ThemeToggle from "../components/ThemeToggle";

const originalMatchMedia = window.matchMedia;
beforeEach(() => {
  localStorage.removeItem("meet-theme");
  delete document.documentElement.dataset.theme;
  window.matchMedia = jest.fn().mockReturnValue({ matches: false });
});
afterEach(() => {
  cleanup();
  localStorage.removeItem("meet-theme");
  delete document.documentElement.dataset.theme;
  window.matchMedia = originalMatchMedia;
});

test.each([[true, "dark", "light"], [false, "light", "dark"]])("uses system preference on first visit (%s)", (matches, theme, next) => {
  window.matchMedia.mockReturnValue({ matches });
  render(<ThemeToggle />);
  expect(document.documentElement.dataset.theme).toBe(theme);
  expect(screen.getByRole("button", { name: `Switch to ${next} mode` })).toBeVisible();
  expect(localStorage.getItem("meet-theme")).toBeNull();
});

test("keyboard switching saves and restores explicit choice over system preference", async () => {
  window.matchMedia.mockReturnValue({ matches: true });
  const view = render(<ThemeToggle />);
  const user = userEvent.setup();
  await user.tab();
  expect(screen.getByRole("button", { name: "Switch to light mode" })).toHaveFocus();
  await user.keyboard(" ");
  expect(document.documentElement.dataset.theme).toBe("light");
  expect(document.documentElement.style.colorScheme).toBe("light");
  expect(localStorage.getItem("meet-theme")).toBe("light");
  view.unmount();
  delete document.documentElement.dataset.theme;
  render(<ThemeToggle />);
  expect(document.documentElement.dataset.theme).toBe("light");
});

test("ignores invalid saved values", () => {
  localStorage.setItem("meet-theme", "invalid");
  window.matchMedia.mockReturnValue({ matches: true });
  render(<ThemeToggle />);
  expect(document.documentElement.dataset.theme).toBe("dark");
});

test("storage failures do not prevent theme switching", async () => {
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  render(<ThemeToggle />);
  await userEvent.setup().click(screen.getByRole("button", { name: "Switch to dark mode" }));
  expect(document.documentElement.dataset.theme).toBe("dark");
});
