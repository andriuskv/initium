import { useState, useEffect, useRef } from "react";
import { dispatchCustomEvent } from "utils";
import { getOffsettedCurrentTime, getHoursOffset } from "services/timeDate";
import * as chromeStorage from "services/chromeStorage";
import "./world-clocks.css";

export default function WorldClocks({ parentVisible }) {
  const [clocks, setClocks] = useState(null);
  const timeoutId = useRef(0);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!clocks?.length) {
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
    }, true);
  }

  function initClocks(clocks) {
    setClocks(clocks.toSorted((a, b) => {
      return a.diff - b.diff;
    }).map(clock => {
      clock.time = getOffsettedCurrentTime(clock.diff);
      clock.diffString = getHoursOffset(clock.diff, true);
      return clock;
    }));
  }

  function update() {
    for (const clock of clocks) {
      clock.time = getOffsettedCurrentTime(clock.diff);
    }
    setClocks([...clocks]);
  }

  function revealClocksPanel() {
    dispatchCustomEvent("top-panel-visible", { tab: "world" });
  }

  return (
    <div className="calendar-world-clocks">
      <h4 className="calendar-world-clocks-title">
        <button className="btn text-btn calendar-world-clocks-title-btn" onClick={revealClocksPanel}>World clocks</button>
      </h4>
      {clocks?.length ? (
        <ul className="calendar-world-clocks-list">
          {clocks.map(clock => (
            <li className="calendar-world-clocks-list-item" key={clock.id}>
              <span className="calendar-world-clocks-list-item-city">{clock.city}</span>
              <span className="calendar-world-clocks-list-item-time">{clock.time}</span>
              <span className="calendar-world-clocks-list-item-diff">{clock.diffString}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
