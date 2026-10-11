import puppeteer from "puppeteer";

describe("local mock-data browser behavior", () => {
  let browser;
  let page;
  let errors;
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true, timeout: 20000 });
  });
  beforeEach(async () => {
    errors = [];
    page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on("request", (request) => {
      const url = new URL(request.url());
      if (["localhost", "127.0.0.1"].includes(url.hostname) || ["data:", "blob:"].includes(url.protocol)) request.continue();
      else request.abort(); // Includes Atatus, fonts, Google, and AWS.
    });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle0" });
    await page.waitForSelector(".event");
  });
  afterEach(async () => {
    if (page) await page.close();
    expect(errors).toEqual([]);
  });
  afterAll(async () => {
    if (browser) await browser.close();
  });
  const searchBerlin = async () => {
    await page.click(".city");
    await page.type(".city", "Berlin");
  };
  test("shows events from all cities by default", async () => {
    expect(await page.$$eval(".event", (events) => events.length)).toBe(32);
    expect(await page.$eval(".event_summary", (element) => element.textContent.trim())).not.toBe("");
  });
  test("shows matching city suggestions", async () => {
    await searchBerlin();
    expect(await page.$$eval(".suggestions li", (items) => items.map((item) => item.textContent))).toEqual(["Berlin, Germany", "See all cities"]);
  });
  test("selecting Berlin filters the entire event list", async () => {
    await searchBerlin();
    await page.click(".suggestions li");
    await page.waitForFunction(() => document.querySelectorAll(".event").length === 17);
    expect(await page.$$eval(".event_location", (items) => items.map((item) => item.textContent))).toEqual(Array(17).fill("Berlin, Germany"));
  });
  test("details start collapsed", async () => {
    expect(await page.$(".event .event_details")).toBeNull();
    expect(await page.$eval(".details-btn", (button) => button.textContent)).toBe("Show details");
  });
  test("details can be expanded", async () => {
    await page.click(".details-btn");
    await page.waitForSelector(".event .event_details", { visible: true });
    expect(await page.$eval(".event_details", (element) => element.textContent.trim())).not.toBe("");
    expect(await page.$eval(".details-btn", (button) => button.textContent)).toBe("Hide details");
  });
  test("expanded details can be collapsed", async () => {
    await page.click(".details-btn");
    await page.waitForSelector(".event .event_details", { visible: true });
    await page.click(".details-btn");
    await page.waitForSelector(".event .event_details", { hidden: true });
    expect(await page.$(".event .event_details")).toBeNull();
  });
  test("invalid count preserves the last valid list", async () => {
    const input = await page.$("#event-number input");
    await input.click({ clickCount: 3 });
    await input.type("10");
    await page.waitForFunction(() => document.querySelectorAll(".event").length === 10);
    await input.click({ clickCount: 3 });
    await input.type("0");
    expect(await page.$$eval(".event", (events) => events.length)).toBe(10);
    expect(await page.$eval(".alerts-container", (element) => element.textContent)).toContain("whole number from 1 to 32");
  });
  test("charts render real SVGs and update when the count changes", async () => {
    expect(await page.$$eval(".recharts-wrapper > svg.recharts-surface", (items) => items.length)).toBe(2);
    const before = await page.$eval(".recharts-scatter", (element) => element.innerHTML);
    const input = await page.$("#event-number input");
    await input.click({ clickCount: 3 });
    await input.type("10");
    await page.waitForFunction(() => document.querySelectorAll(".event").length === 10);
    await page.waitForFunction((previous) => document.querySelector(".recharts-scatter").innerHTML !== previous, {}, before);
  });
  test("city chart follows a same-length city filter", async () => {
    const input = await page.$("#event-number input");
    await input.click({ clickCount: 3 });
    await input.type("10");
    await page.waitForFunction(() => document.querySelectorAll(".event").length === 10);
    await searchBerlin();
    await page.click(".suggestions li");
    await page.waitForFunction(() => [...document.querySelectorAll(".event_location")].every((item) => item.textContent === "Berlin, Germany"));
    // Allow the existing Recharts transition to settle before inspecting its tooltip.
    await new Promise((resolve) => setTimeout(resolve, 1700));
    await page.hover(".recharts-scatter-symbol");
    expect(await page.$eval(".recharts-tooltip-wrapper", (element) => element.textContent)).toContain("Number of Events : 0");
    const points = await page.$$(".recharts-scatter-symbol");
    await points[1].hover();
    expect(await page.$eval(".recharts-tooltip-wrapper", (element) => element.textContent)).toContain("Number of Events : 10");
  });

});
