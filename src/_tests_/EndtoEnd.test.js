import puppeteer from "puppeteer";

// FEATURE 1

describe("filter events by a city", () => {
  let browser;
  let page;
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      slowMo: 250, // slow down by 250ms,
      timeout: 0, // removes any puppeteer/browser timeout limitations (this isn't the same as the timeout of jest)
    });
    page = await browser.newPage();
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".event");
  });

  afterAll(() => {
    browser.close();
  });

  test("show upcoming events from all cities by default", async () => {
    // if your event's details have a different selector, use it instead of .event .details
    const eventTitle = await page.$(".event .event_summary");
    expect(eventTitle).toBeDefined();
  });

  test("show a list of of suggestions when searching by city", async () => {
    await page.click("#city-search .city");

    await page.type(".city", "Berlin");

    const cityCount = await page.$$eval(".suggestions", (li) => li.length);
    expect(cityCount).toBe(1);
  });

  test("select a city from the suggested list", async () => {
    await page.click(".suggestions li");
    const eventList = await page.$eval(
      ".event_location",
      (city) => city.innerText
    );
    expect(eventList).toBe("Berlin, Germany");
  });
});

// FEATURE 2

describe("show/hide an event details", () => {
  let browser;
  let page;
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      slowMo: 250, // slow down by 250ms,
      timeout: 0, // removes any puppeteer/browser timeout limitations (this isn't the same as the timeout of jest)
    });
    page = await browser.newPage();
    await page.goto("http://localhost:3000/");
    await page.waitForSelector(".event");
  });

  afterAll(() => {
    browser.close();
  });

  test("An event element is collapsed by default", async () => {
    // if your event's details have a different selector, use it instead of .event .details
    const eventDetails = await page.$(".event .details");
    expect(eventDetails).toBeNull();
  });

  test("User can expand an event to see its details", async () => {
    await page.click(".event .details-btn");

    const eventDetails = await page.$(".event .details");
    expect(eventDetails).toBeDefined();
  });

  test("User can collapse an event to hide details", async () => {
    await page.click(".event .details-btn");
    const eventDetails = await page.$(".event .details");
    expect(eventDetails).toBeNull();
  });
});
