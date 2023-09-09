import "./App.css";
import CitySearch from "./components/CitySearch";
import EventList from "./components/EventList";

const App = () => {
  return (
    <div className="App">
      <h1>Meet App</h1>
      <h4>Choose your nearest city</h4>
      <CitySearch />
      <EventList />
    </div>
  );
};

export default App;
