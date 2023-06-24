import { useState, useEffect, useRef } from "react";
import { getRandomString } from "utils";
import * as chromeStorage from "services/chromeStorage";
import "./form.css";
import Icon from "components/Icon";

export default function Form({ addClock, hide }) {
  const [currentClocks, setCurrentClocks] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const timeoutId = useRef(0);

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const clocks = await chromeStorage.get("clocks");

    if (clocks?.length) {
      setCurrentClocks(clocks);
    }
  }

  async function searchLocation(value) {
    const { default: cityTimezones } = await import("city-timezones");
    const { Temporal } = await import("@js-temporal/polyfill");
    const cities = cityTimezones.findFromCityStateProvince(value);
    const results = [];

    for (const city of cities) {
      const foundLocation = currentClocks.find(clock => clock.city === city.city && clock.timeZone === city.timezone);
      let alreadyAdded = false;

      if (foundLocation) {
        alreadyAdded = true;
      }

      try {
        const tz = Temporal.TimeZone.from(city.timezone);
        const timeZoneDate = tz.getPlainDateTimeFor(Temporal.Now.instant());
        const diff = new Date(timeZoneDate.toString()).getTime() - Date.now();

        results.push({
          alreadyAdded,
          id: getRandomString(4),
          timeZone: city.timezone,
          city: city.city,
          country: city.country,
          diff,
          diffString: getDiffString(diff)

        });
      } catch (e) {
        console.log(e);
      }
    }
    setSearchResults(results);
  }

  function handleChange(event) {
    setInputValue(event.currentTarget.value);
  }

  async function handleKeyUp(event) {
    const { value } = event.currentTarget;

    clearTimeout(timeoutId.current);

    timeoutId.current = setTimeout(() => {
      if (value.length > 2) {
        searchLocation(value);
      }
      else if (value.length > 0) {
        setSearchResults([]);
      }
      else {
        setSearchResults(null);
      }
    }, 200);
  }

  function getDiffString(diff) {
    const hours = Math.round(diff / 1000 / 60 / 60);
    const suffix = hours === 1 ? "" : "s";

    if (hours > 0) {
      return `${hours} hour${suffix} ahead`;
    }
    else if (hours < 0) {
      return `${Math.abs(hours)} hour${suffix} behind`;
    }
    return "Current timezone";
  }

  function clearInput() {
    setInputValue("");
    setSearchResults(null);
  }

  function handleClick(result) {
    if (result.alreadyAdded) {
      return;
    }
    addClock(result);
    hide();
  }

  return (
    <div className="container world-form">
      <h4 className="world-form-title">Add a new world clock</h4>
      <div className="world-form-top">
        <div className="world-form-input-container">
          <Icon id="search" className="world-form-input-icon"/>
          <input type="text" className="input world-form-input" value={inputValue} onChange={handleChange} onKeyUp={handleKeyUp} autoFocus placeholder="Paris"/>
          {inputValue.length ? (
            <button className="btn icon-btn world-form-input-clear-btn" onClick={clearInput} title="clear">
              <Icon id="cross"/>
            </button>
          ) : null}
        </div>
      </div>
      {searchResults ? searchResults.length ? (
        <ul className="world-form-results">
          {searchResults.map(result => (
            <li className={`world-form-result ${result.alreadyAdded ? " added" : ""}`} key={result.id}>
              <button className="btn world-form-result-btn" onClick={() => handleClick(result)} disabled={result.alreadyAdded}>
                <div>
                  <div className="world-clock-city">{result.city}, <span className="world-form-result-country">{result.country}</span></div>
                  <div className="world-clock-diff">{result.timeZone} {result.diffString}</div>
                </div>
                {result.alreadyAdded && <Icon id="check"/>}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="world-form-message">Location not found</p>
      ) : <p className="world-form-message">Search for a location</p>}
    </div>
  );
}