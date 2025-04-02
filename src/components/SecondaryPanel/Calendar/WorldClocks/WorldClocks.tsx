import { useState, useEffect, useRef } from "react";
import { dispatchCustomEvent } from "utils";
import { getOffsettedCurrentTime, getHoursOffset } from "services/timeDate";
import * as chromeStorage from "services/chromeStorage";
import "./world-clocks.css";

type Clock = {
  city: string,
  country: string,
  diff: number,
  id: string,
  timeZone: string,
  time: string,
  diffString: string
}

export default function WorldClocks({ parentVisible, locale }: { parentVisible: boolean, locale: any }) {
  const [clocks, setClocks] = useState<Clock[] | null>(null);
  const timeoutId = useRef(0);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!clocks?.length) {
      return;
    }
    function update() {
      if (clocks) {
        setClocks(clocks.map(clock => {
          clock.time = getOffsettedCurrentTime(clock.diff);
          return clock;
        }));
      }
    }

    if (parentVisible) {
      timeoutId.current = window.setTimeout(update, 1000);
    }
    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [parentVisible, clocks]);

  async function init() {
    const clocks = await chromeStorage.get("clocks");

    if (clocks?.length) {
      const { Temporal } = await import("@js-temporal/polyfill");

      for (const clock of clocks) {
        clock.diff = new Date(Temporal.Now.zonedDateTimeISO(clock.timeZone).toPlainDateTime().toString()).getTime() - Date.now();
      }
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
    }, { id: "world-clocks", listenToLocal: true });
  }

  function initClocks(clocks: Clock[]) {
    setClocks(clocks.toSorted((a, b) => a.diff - b.diff).map(clock => {
      clock.time = getOffsettedCurrentTime(clock.diff);
      clock.diffString = getHoursOffset(clock.diff, true);
      return clock;
    }));
  }

  function revealClocksPanel() {
    dispatchCustomEvent("top-panel-visible", { tab: "world" });
  }

  return (
    <div className="container-footer calendar-world-clocks">
      <h4 className="calendar-world-clocks-title">
        <button className="btn text-btn calendar-world-clocks-title-btn" onClick={revealClocksPanel}>{locale.calendar.world_clocks_title}</button>
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
