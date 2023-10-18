import { useState, useEffect, useRef } from "react";
import { getRandomString, timeout } from "utils";
import { getHoursOffset } from "services/timeDate";
import * as chromeStorage from "services/chromeStorage";
import * as focusService from "services/focus";
import "./form.css";
import Icon from "components/Icon";

export default function Form({ locale, addClock, hide }) {
  const [currentClocks, setCurrentClocks] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const timeoutId = useRef(0);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    focusService.updateFocusTrap("fullscreen-modal");
  }, [searchResults]);

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
          diffString: getHoursOffset(diff)

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

    timeoutId.current = timeout(() => {
      if (value.length > 2) {
        searchLocation(value);
      }
      else if (value.length > 0) {
        setSearchResults([]);
      }
      else {
        setSearchResults(null);
      }
    }, 200, timeoutId.current);
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
    <div className="world-form">
      <div className="container-header">
        <h3 className="container-header-title">{locale.world.form_title}</h3>
        <button className="btn icon-btn" onClick={hide} title={locale.global.close}>
          <Icon id="cross"/>
        </button>
      </div>
      <div className="world-form-top">
        <div className="world-form-input-container">
          <Icon id="search" className="world-form-input-icon"/>
          <input type="text" className="input world-form-input" value={inputValue} onChange={handleChange} onKeyUp={handleKeyUp} placeholder="Paris" autoFocus/>
          {inputValue.length ? (
            <button className="btn icon-btn world-form-input-clear-btn" onClick={clearInput} title={locale.global.clear}>
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
        <p className="world-form-message">{locale.world.location_not_found_message}</p>
      ) : <p className="world-form-message">{locale.world.search_prompt_message}</p>}
    </div>
  );
}
