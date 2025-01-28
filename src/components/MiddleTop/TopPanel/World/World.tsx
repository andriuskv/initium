import type { Clock } from "./world.types";
import { useState, useEffect, useRef, lazy } from "react";
import { dispatchCustomEvent } from "utils";
import { getOffsettedCurrentTime, getHoursOffset } from "services/timeDate";
import * as chromeStorage from "services/chromeStorage";
import Icon from "components/Icon";
import CreateButton from "components/CreateButton";
import "./world.css";

const Form = lazy(() => import("./Form"));

type Props = {
  visible: boolean,
  locale: any,
  animDirection: "anim-left" | "anim-right",
  parentVisible: boolean
}

export default function World({ visible, locale, animDirection, parentVisible }: Props) {
  const [clocks, setClocks] = useState<Clock[]>([]);
  const timeoutId = useRef(0);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (!clocks.length) {
      return;
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
        const tz = Temporal.TimeZone.from(clock.timeZone);
        const timeZoneDate = tz.getPlainDateTimeFor(Temporal.Now.instant());

        clock.diff = new Date(timeZoneDate.toString()).getTime() - Date.now();
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
    });
  }

  function initClocks(clocks: Clock[]) {
    setClocks(clocks.map(clock => {
      clock.time = getOffsettedCurrentTime(clock.diff);
      clock.diffString = getHoursOffset(clock.diff);
      return clock;
    }));
  }

  function update() {
    setClocks(clocks.map(clock => {
      clock.time = getOffsettedCurrentTime(clock.diff);
      return clock;
    }));
  }

  function addClock(clock: Clock) {
    clock.time = getOffsettedCurrentTime(clock.diff);
    const newClocks = [clock, ...clocks];

    setClocks(newClocks);
    saveClocks(newClocks);
  }

  function removeClock(clock: Clock) {
    const filteredClocks = clocks.filter(({ id }) => clock.id !== id);

    setClocks(filteredClocks);
    saveClocks(filteredClocks);
  }

  function showForm() {
    dispatchCustomEvent("fullscreen-modal", {
      id: "world",
      shouldToggle: true,
      component: Form,
      params: { locale, addClock }
    });
  }

  function saveClocks(clocks: Clock[]) {
    chromeStorage.set({
      clocks: clocks.map(clock => ({
        id: clock.id,
        city: clock.city,
        country: clock.country,
        timeZone: clock.timeZone
      }))
    });
  }

  return (
    <div className={`container-body top-panel-item world${visible ? " visible" : ""}${animDirection ? ` ${animDirection}` : ""}`}>
      {clocks.length ? (
        <div className="world-clocks-container">
          <ul className="top-panel-item-content world-clocks">
            {clocks.map(clock => (
              <li className="world-clock" key={clock.id}>
                <div>
                  <div className="world-clock-city">{clock.city}</div>
                  <div className="world-clock-secondary">{clock.country}</div>
                  <div className="world-clock-secondary">{clock.diffString}</div>
                </div>
                <div className="world-clock-time">
                  <span className="world-clock-time-text">{clock.time}</span>
                  <button className="btn icon-btn world-clock-remove-btn" onClick={() => removeClock(clock)} title={locale.global.remove}>
                    <Icon id="trash"/>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : <p className="world-clocks-message">{locale.world.no_clocks_message}</p>}
      <CreateButton onClick={showForm} attrs={{ "data-modal-initiator": true }}></CreateButton>
    </div>
  );
}
