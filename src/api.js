import mockData from "./mock-data";
import { createAuthClient } from "./auth";

export { AuthError, readCachedEvents } from "./auth";
export const extractLocations = (events) => [...new Set(events
  .map((event) => event.location)
  .filter((location) => typeof location === "string" && location.trim()))];

const client = createAuthClient({ mockData });
export const prepareAuthentication = client.prepare;
export const isMockMode = client.isMockMode;
export const startAuthentication = client.startAuthentication;
export const getAccessToken = client.getAccessToken;
export const getEvents = client.getEvents;

export const signOut = client.signOut;
export const subscribeAuthentication = client.subscribeAuthentication;
