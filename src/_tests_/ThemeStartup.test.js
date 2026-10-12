import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const html = readFileSync("index.html", "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];

test.each([
  [null, true, "dark"], [null, false, "light"],
  ["light", true, "light"], ["dark", false, "dark"], ["invalid", true, "dark"],
])("startup sets theme before the React entry loads: saved %s, system dark %s", (saved, dark, expected) => {
  const root = { dataset: {}, style: {} };
  const meta = { setAttribute: jest.fn() };
  runInNewContext(script, {
    localStorage: { getItem: () => saved },
    window: { matchMedia: () => ({ matches: dark }) },
    document: { documentElement: root, querySelector: () => meta },
  });
  expect(root.dataset.theme).toBe(expected);
  expect(root.style.colorScheme).toBe(expected);
  expect(meta.setAttribute).toHaveBeenCalledWith("content", expected === "dark" ? "#0f131c" : "#f8fafc");
  expect(html.indexOf(script)).toBeLessThan(html.indexOf('src="/src/index.jsx"'));
});

test("startup survives denied storage and an unavailable preference API", () => {
  const root = { dataset: {}, style: {} };
  runInNewContext(script, {
    localStorage: { getItem: () => { throw new Error("blocked"); } }, window: {},
    document: { documentElement: root, querySelector: () => ({ setAttribute: () => {} }) },
  });
  expect(root.dataset.theme).toBe("light");
});
