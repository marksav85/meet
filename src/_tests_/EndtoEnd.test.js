import puppeteer from "puppeteer";

describe("local mock-data browser behavior", () => {
  let browser;
  let context;
  let page;
  let errors;
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true, timeout: 20000 });
  });
  beforeEach(async () => {
    errors = [];
    context = await browser.createBrowserContext();
    page = await context.newPage();
    await page.setViewport({ width: 1330, height: 1000 });
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (["localhost", "127.0.0.1"].includes(url.hostname) || ["data:", "blob:"].includes(url.protocol)) request.continue();
      else request.abort(); // Includes Google and AWS; all tests remain offline.
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(process.env.MEET_BROWSER_URL || "http://localhost:3000/", { waitUntil: "networkidle0" });
    await page.waitForSelector(".event");
  });
  afterEach(async () => {
    if (context) await context.close();
    expect(errors).toEqual([]);
  });
  afterAll(async () => {
    if (browser) await browser.close();
  });
  const searchBerlin = async () => {
    await page.click(".city");
    await page.type(".city", "Berlin");
  };
  const selectCategory = async (name) => {
    await page.$eval(`#category-filter button[aria-label="${name}"]`, (button) => button.click());
  };
  test("shows events from all cities by default", async () => {
    expect(await page.$$eval(".event", (events) => events.length)).toBe(35);
    expect(await page.$("#event-number input")).toBeNull();
    expect(await page.$eval("#results-count", (element) => element.textContent)).toBe("35 upcoming events found");
    expect(await page.$eval(".event_summary", (element) => element.textContent.trim())).not.toBe("");
  });
  test("shows matching city suggestions", async () => {
    await searchBerlin();
    expect(await page.$$eval(".suggestions li", (items) => items.map((item) => item.textContent))).toEqual(["Berlin, Germany", "See all cities"]);
  });
  test("keyboard city selection and All Cities reset preserve filtering", async () => {
    await searchBerlin();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelectorAll(".event").length === 17);
    expect(await page.$$eval(".event_location", (items) => items.map((item) => item.textContent))).toEqual(Array(17).fill("Berlin, Germany"));
    await page.click(".all-cities-btn");
    await page.waitForFunction(() => document.querySelectorAll(".event").length === 35);
    expect(await page.$eval(".city", (input) => input.value)).toBe("");
  });
  test("category pills filter and restore the list", async () => {
    expect(await page.$$eval("#category-filter button", (buttons) => buttons.length)).toBe(7);
    await selectCategory("Cloud & DevOps");
    await page.waitForFunction(() => document.querySelectorAll(".event").length === 0);
    expect(await page.$eval(".App", (app) => app.textContent)).toContain("No events found.");
    expect(await page.$eval("#results-count", (element) => element.textContent)).toBe("0 upcoming events found");
    await selectCategory("Web Development");
    await page.waitForFunction(() => document.querySelectorAll(".event").length === 35);
    await searchBerlin();
    await page.click(".suggestions button");
    await page.waitForFunction(() => document.querySelectorAll(".event").length === 17);
    await selectCategory("All Categories");
    expect(await page.$$eval(".event", (events) => events.length)).toBe(17);
    expect(await page.$eval('#category-filter button[aria-label="All Categories"]', (button) => button.getAttribute("aria-pressed"))).toBe("true");
  });
  test("details start collapsed", async () => {
    expect(await page.$(".event .event_details")).toBeNull();
    expect(await page.$eval(".details-btn", (button) => button.textContent)).toBe("Show details");
  });
  test("details expand and collapse with keyboard support", async () => {
    await page.focus(".details-btn");
    await page.keyboard.press("Enter");
    await page.waitForSelector(".event .event_details", { visible: true });
    expect(await page.$eval(".event_details", (element) => element.textContent.trim())).not.toBe("");
    expect(await page.$eval(".details-btn", (button) => button.getAttribute("aria-expanded"))).toBe("true");
    await page.keyboard.press("Enter");
    await page.waitForSelector(".event .event_details", { hidden: true });
    expect(await page.$(".event .event_details")).toBeNull();
  });
  test("donut and horizontal city bars reflect filtered event data", async () => {
    expect(await page.$$eval(".recharts-wrapper > svg.recharts-surface", (items) => items.length)).toBe(2);
    expect(await page.$eval(".donut-center strong", (element) => element.textContent)).toBe("35");
    expect(await page.$eval(".category-legend", (element) => element.textContent)).toContain("35 events100%");
    expect(await page.$eval(".city-chart", (element) => element.getAttribute("aria-label"))).toBe("Events by city: London: 18, Berlin: 17");
    await searchBerlin();
    await page.click(".suggestions button");
    await page.waitForFunction(() => document.querySelectorAll(".event").length === 17);
    expect(await page.$eval(".donut-center strong", (element) => element.textContent)).toBe("17");
    expect(await page.$$eval(".city-bar-row", (rows) => rows.length)).toBe(1);
    expect(await page.$eval(".city-chart", (element) => element.textContent)).toContain("Berlin17 events");
    await page.hover(".city-bar-row rect");
    await page.waitForFunction(() => document.querySelector(".city-chart .recharts-tooltip-wrapper")?.textContent.includes("17"));
    expect(await page.$eval(".city-chart .recharts-tooltip-wrapper", (element) => element.textContent)).toContain("17");
  });
  test("system preference, keyboard toggle and saved choice survive reload", async () => {
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
    await page.reload({ waitUntil: "networkidle0" });
    await page.waitForSelector('.theme-toggle[aria-label="Switch to light mode"]');
    expect(await page.evaluate(() => localStorage.getItem("meet-theme"))).toBeNull();
    await page.focus(".theme-toggle");
    await page.keyboard.press("Space");
    await page.waitForFunction(() => document.documentElement.dataset.theme === "light");
    expect(await page.evaluate(() => localStorage.getItem("meet-theme"))).toBe("light");
    await page.reload({ waitUntil: "networkidle0" });
    await page.waitForSelector('.theme-toggle[aria-label="Switch to dark mode"]');
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("light");
    await page.click(".theme-toggle");
    await page.reload({ waitUntil: "networkidle0" });
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe("dark");
  });
  test.each(["light", "dark"])("%s theme remains responsive and usable at desktop, tablet and mobile widths", async (theme) => {
    if (theme === "dark") await page.click(".theme-toggle");
    for (const width of [1330, 820, 390, 320]) {
      await page.setViewport({ width, height: 1000 });
      await page.waitForFunction(() => document.documentElement.scrollWidth <= innerWidth);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await page.$eval(".App", (element) => getComputedStyle(element).color)).not.toBe(await page.evaluate(() => getComputedStyle(document.body).backgroundColor));
    }
    await page.click(".city");
    await page.type(".city", "Berlin");
    await page.click(".suggestions button");
    await page.waitForFunction(() => document.querySelectorAll(".event").length === 17);
    await page.click(".details-btn");
    await page.waitForSelector(".event_details", { visible: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await selectCategory("Cloud & DevOps");
    expect(await page.$eval("#results-count", (element) => element.textContent)).toBe("0 upcoming events found");
  });
});
