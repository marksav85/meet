import "./App.css";
import { useEffect, useMemo, useState } from "react";
import EventErrorBoundary from "./components/EventErrorBoundary";
import CitySearch from "./components/CitySearch";
import EventList from "./components/EventList";
import NumberOfEvents from "./components/NumberOfEvents";
import CityEventsChart from "./components/CityEventsChart";
import EventGenresChart from "./components/EventGenresChart";
import { extractLocations, getEvents, AuthError, startAuthentication } from "./api";
import { InfoAlert, ErrorAlert, WarningAlert } from "./components/Alert";

const App = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [canAuthorize, setCanAuthorize] = useState(false);
  const [reload, setReload] = useState(0);
  const [currentNOE, setCurrentNOE] = useState(32);
  const [currentCity, setCurrentCity] = useState("See all cities");
  const [infoAlert, setInfoAlert] = useState("");
  const [errorAlert, setErrorAlert] = useState("");
  const [warningAlert, setWarningAlert] = useState("");

  useEffect(() => {
    const updateConnection = () => {
      setWarningAlert(navigator.onLine ? "" : "You are offline. Data may not be up-to-date");
      setReload((value) => value + 1);
    };
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    return () => {
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError("");
    setCanAuthorize(false);
    setWarningAlert(navigator.onLine ? "" : "You are offline. Data may not be up-to-date");
    const load = async () => {
      try {
        const result = await getEvents();
        if (!Array.isArray(result) || result.some((event) => !event || typeof event !== "object" || Array.isArray(event))) {
          throw new Error("Invalid event response");
        }
        const normalized = result.map((event, index) => ({
          ...event,
          id: typeof event.id === "string" ? event.id : `event-${index}`,
          summary: typeof event.summary === "string" ? event.summary : "",
          location: typeof event.location === "string" ? event.location : "",
          description: typeof event.description === "string" ? event.description : "",
        }));
        if (active) setAllEvents(normalized);
      } catch (error) {
        if (active) {
          setAllEvents([]);
          setLoadError(error instanceof AuthError ? error.message : "Events could not be loaded. Please check your connection and try again.");
          setCanAuthorize(error instanceof AuthError && error.canAuthorize);
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [reload]);

  const allLocations = useMemo(() => extractLocations(allEvents), [allEvents]);
  const filteredEvents = currentCity === "See all cities"
    ? allEvents
    : allEvents.filter((event) => event.location === currentCity);
  const events = filteredEvents.slice(0, currentNOE);
  const authorize = async () => {
    setCanAuthorize(false);
    try { await startAuthentication({ explicit: true }); }
    catch (error) {
      setLoadError(error instanceof AuthError ? error.message : "Authorization could not be started. Please try again.");
      setCanAuthorize(error instanceof AuthError && error.canAuthorize);
    }
  };
  const retry = () => setReload((value) => value + 1);

  return (
    <div className="App">
      <div className="alerts-container">
        {infoAlert.length ? <InfoAlert text={infoAlert} /> : null}
        {errorAlert.length ? <ErrorAlert text={errorAlert} /> : null}
        {warningAlert ? <WarningAlert text={warningAlert} /> : null}
      </div>
      <CitySearch
        allLocations={allLocations}
        setCurrentCity={setCurrentCity}
        setInfoAlert={setInfoAlert}
      />
      <NumberOfEvents
        setCurrentNOE={setCurrentNOE}
        setErrorAlert={setErrorAlert}
      />
      {loading && <p role="status">Loading events…</p>}
      {loadError && (
        <div role="alert">
          {loadError} {canAuthorize ? <button onClick={authorize}>Authorize with Google</button> : <button onClick={retry}>Try again</button>}
        </div>
      )}
      {!loading && !loadError && events.length === 0 && <p role="status">No events found.</p>}
      <EventErrorBoundary resetKey={allEvents} onRetry={retry}>
        <div className="charts-container">
          <EventGenresChart events={events} />
          <CityEventsChart allLocations={allLocations} events={events} />
        </div>
        <EventList events={events} />
      </EventErrorBoundary>
    </div>
  );
};

export default App;
