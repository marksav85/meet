const { readCachedEvents } = jest.requireActual("../api");
afterEach(() => localStorage.removeItem("lastEvents"));
test("absent offline cache is an empty list", () => {
  expect(readCachedEvents()).toEqual([]);
});
test("valid offline cache is returned", () => {
  localStorage.setItem("lastEvents", JSON.stringify([{ id: "one" }]));
  expect(readCachedEvents()).toEqual([{ id: "one" }]);
});
test.each(["broken JSON", "null", "{}"])("corrupted cache %p raises a controlled error", (cached) => {
  localStorage.setItem("lastEvents", cached);
  expect(() => readCachedEvents()).toThrow("Saved events could not be read");
});
