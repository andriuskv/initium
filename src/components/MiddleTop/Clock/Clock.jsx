import { useState, useEffect } from "react";
import { toggleBehindElements } from "utils";
import { getDisplayTime, formatDate } from "services/timeDate";
import "./clock.css";
import useWorker from "../useWorker";

export default function Clock({ settings }) {
  const [clock, setClock] = useState(() => ({ ...getDisplayTime(settings.clockStyle === "vertical") }));
  const [date, setDate] = useState(() => ({ day: new Date().getDate() }));
  const [expanded, setExpanded] = useState(false);
  const { initWorker, destroyWorkers } = useWorker(handleMessage);

  useEffect(() => {
    if (settings.clockDisabled) {
      return;
    }
    initWorker({ id: "clock", type: "clock" });

    return () => {
      destroyWorkers();
    };
  }, [settings, date]);

  useEffect(() => {
    updateDate();
  }, [settings.dateLocale]);

  useEffect(() => {
    if (expanded) {
      window.addEventListener("keydown", collapse);
    }
    else {
      window.removeEventListener("keydown", collapse);
    }
    toggleBehindElements(!expanded, "clock");

    return () => {
      window.removeEventListener("keydown", collapse);
    };
  }, [expanded]);

  function handleMessage() {
    setClock({ ...getDisplayTime(settings.clockStyle === "vertical") });

    if (new Date().getDate() !== date.day) {
      updateDate();
    }
  }

  function updateDate() {
    const currentDate = new Date();
    const date = formatDate(currentDate.getTime(), {
      locale: settings.dateLocale,
      includeWeekday: true,
      excludeYear: true
    });

    setDate({ day: currentDate.getDate(), string: date });
  }

  function collapse(event) {
    if (event.key === "Escape") {
      document.startViewTransition(() => {
        setExpanded(false);
      });
    }
  }

  function handleClick(event) {
    if (event.detail === 2 && settings.clockFullscreenEnabled) {
      document.startViewTransition(() => {
        setExpanded(!expanded);
      });
    }
  }

  function renderClock() {
    if (settings.clockStyle === "vertical") {
      return (
        <div className="clock-time">
          <div className="clock-time-hours">{clock.hours}</div>
          <div>{clock.minutes}</div>
        </div>
      );
    }
    return <span className="clock-time">{clock.hours}:{clock.minutes}</span>;
  }

  return (
    <div className={`clock${expanded ? " fullscreen-mask expanded" : ""} date-${settings.datePosition}`}
      style={{ "--scale": settings.clockScale, "--date-alignment": settings.dateAlignment }}
      onClick={handleClick}>
      <div className="clock-time-container">
        {renderClock()}
        {clock.period ? <span className="clock-time-period">{clock.period}</span> : null}
      </div>
      {settings.dateHidden ? null : (
        <div className="clock-date" style={{ "--date-scale": settings.dateScale }}>{date.string}</div>
      )}
    </div>
  );
}
