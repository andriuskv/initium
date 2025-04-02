import type { Clock } from "../world.types";
import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import { getRandomString, timeout } from "utils";
import { getHoursOffset } from "services/timeDate";
import * as chromeStorage from "services/chromeStorage";
import * as focusService from "services/focus";
import Icon from "components/Icon";
import "./form.css";

type Props = {
  locale: any,
  addClock: (clock: Clock) => void,
  hide: () => void
}

export default function Form({ locale, addClock, hide }: Props) {
  const [currentClocks, setCurrentClocks] = useState<Partial<Clock>[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState<Clock[] | null>(null);
  const timeoutId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    init();

    if (inputRef.current) {
      inputRef.current.focus();
    }
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

  async function searchLocation(value: string) {
    const { default: cityTimezones } = await import("city-timezones");
    const { Temporal } = await import("@js-temporal/polyfill");
    const cities = cityTimezones.findFromCityStateProvince(value);
    const results: Clock[] = [];

    for (const city of cities) {
      const foundLocation = currentClocks.find(clock => clock.city === city.city && clock.timeZone === city.timezone);
      let alreadyAdded = false;

      if (foundLocation) {
        alreadyAdded = true;
      }

      try {
        const diff = new Date(Temporal.Now.zonedDateTimeISO(city.timezone).toPlainDateTime().toString()).getTime() - Date.now();

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

  function handleChange(event: ChangeEvent) {
    setInputValue((event.currentTarget as HTMLInputElement).value);
  }

  async function handleKeyUp(event: KeyboardEvent) {
    const { value } = event.currentTarget as HTMLInputElement;

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

  function handleClick(result: Clock) {
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
          <input type="text" className="input world-form-input" value={inputValue} onChange={handleChange} onKeyUp={handleKeyUp} placeholder="Paris" ref={inputRef}/>
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
                  <div className="world-clock-diff">{result.timeZone} ᛫ {result.diffString}</div>
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
