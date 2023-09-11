import "./App.css";
import CitySearch from "./components/CitySearch";
import EventList from "./components/EventList";
import NumberOfEvents from "./components/numberofEvents";

const App = () => {
  return (
    <div className="App">
      <h1>Meet App</h1>
      <h4>Choose your nearest city</h4>
      <CitySearch />
      <EventList />
      <NumberOfEvents />
    </div>
  );
};

export default App;
