import { useState, useEffect, useRef } from "react";
import { dispatchCustomEvent } from "utils";
import { getClockTimeString } from "services/timeDate";
import * as chromeStorage from "services/chromeStorage";
import Icon from "components/Icon";
import "./world.css";
import Form from "./Form";

export default function World({ visible, parentVisible }) {
  const [clocks, setClocks] = useState([]);
  const timeoutId = useRef(0);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!clocks.length) {
      return;
    }

    if (parentVisible) {
      timeoutId.current = setTimeout(update, 1000);
    }
    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [parentVisible, clocks]);

  async function init() {
    const clocks = await chromeStorage.get("clocks");

    if (clocks?.length) {
      initClocks(clocks);
    }

    chromeStorage.subscribeToChanges(({ clocks }) => {
      if (!clocks) {
        return;
      }

      if (clocks.newValue) {
        initClocks(clocks.newValue);
      }
      else {
        setClocks([]);
      }
    });
  }

  function initClocks(clocks) {
    setClocks(clocks.map(clock => {
      clock.time = getClockTime(clock.diff);
      return clock;
    }));
  }

  function update() {
    for (const clock of clocks) {
      clock.time = getClockTime(clock.diff);
    }
    setClocks([...clocks]);
  }

  function getClockTime(milliseconds) {
    const offset = new Date(Date.now() + milliseconds).getTime();
    return getClockTimeString(offset, { padHours: true });
  }

  function addClock(clock) {
    clock.time = getClockTime(clock.diff);
    const newClocks = [clock, ...clocks];

    setClocks(newClocks);
    saveClocks(newClocks);
  }

  function removeClock(clock) {
    const filteredClocks = clocks.filter(({ id }) => clock.id !== id);

    setClocks(filteredClocks);
    saveClocks(filteredClocks);
  }

  function showForm() {
    dispatchCustomEvent("fullscreen-modal-visible", {
      component: Form,
      params: { addClock }
    });
  }

  function saveClocks(clocks) {
    chromeStorage.set({
      clocks: clocks.map(clock => ({
        id: clock.id,
        city: clock.city,
        country: clock.country,
        diff: clock.diff,
        diffString: clock.diffString,
        timeZone: clock.timeZone
      }))
    });
  }

  return (
    <div className={`top-panel-item world${visible ? " visible" : ""}`}>
      {clocks.length ? (
        <ul className="world-clocks">
          {clocks.map(clock => (
            <li className="world-clock" key={clock.id}>
              <div>
                <div className="world-clock-city">{clock.city}</div>
                <div className="world-clock-diff">{clock.diffString}</div>
              </div>
              <div className="world-clock-time">
                <span className="world-clock-time-text">{clock.time}</span>
                <button className="btn icon-btn world-clock-remove-btn" onClick={() => removeClock(clock)} title="Remove">
                  <Icon id="trash"/>
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="world-clocks-message">No clocks added</p>}
      <button className="btn icon-text-btn world-create-btn" onClick={showForm}>
        <Icon id="plus" className="world-create-btn-icon"/>
        <span className="world-create-btn-title">Create</span>
      </button>
    </div>
  );
}