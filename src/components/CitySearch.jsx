// src/components/CitySearch.js
import { useState, useId, useRef } from "react";

import Icon from "./Icon";

const CitySearch = ({ allLocations, setCurrentCity, setInfoAlert }) => {
  const suggestionsId = useId();
  const container = useRef(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [query, setQuery] = useState("");
  const suggestions = allLocations.filter((location) => typeof location === "string" && (
    query === "See all cities" || location.toUpperCase().includes(query.toUpperCase())
  ));

  const handleInputChanged = (event) => {
    const value = event.target.value;
    const filteredLocations = allLocations
      ? allLocations.filter((location) => {
          return typeof location === "string" && location.toUpperCase().indexOf(value.toUpperCase()) > -1;
        })
      : [];

    setQuery(value);

    let infoText;
    if (filteredLocations.length === 0) {
      infoText =
        "We can not find the city you are looking for. Please try another city";
    } else {
      infoText = "";
    }
    setInfoAlert(infoText);
  };

  const handleItemClicked = (event) => {
    const value = event.target.textContent;
    setQuery(value);
    setShowSuggestions(false); // to hide the list
    setCurrentCity(value);
    setInfoAlert("");
  };

  return (
    <div id="city-search" ref={container} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setShowSuggestions(false); }} onKeyDown={(event) => { if (event.key === "Escape") setShowSuggestions(false); }}>
      <div className="city-input-wrap">
      <Icon name="location" />
      <input
        type="text"
        aria-label="Search for a city"
        aria-autocomplete="list"
        aria-controls={showSuggestions ? suggestionsId : undefined}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") { event.preventDefault(); container.current.querySelector(".suggestions button")?.focus(); }
        }}
        className="city"
        placeholder="Search for a city"
        value={query}
        onFocus={() => setShowSuggestions(true)}
        onChange={handleInputChanged}
      />
      <Icon name="chevron" />
      </div>
      <button className="all-cities-btn" type="button" onClick={() => { setQuery(""); setCurrentCity("See all cities"); setInfoAlert(""); setShowSuggestions(false); }}>All Cities <span>{allLocations.length}</span></button>
      {showSuggestions ? (
        <ul className="suggestions" id={suggestionsId} aria-label="City suggestions">
          {suggestions.map((suggestion) => {
            return (
              <li key={suggestion} onClick={handleItemClicked}>
                <button type="button">{suggestion}</button>
              </li>
            );
          })}
          <li key="See all cities" onClick={handleItemClicked}>
            <button type="button"><b>See all cities</b></button>
          </li>
        </ul>
      ) : null}
    </div>
  );
};

export default CitySearch;
