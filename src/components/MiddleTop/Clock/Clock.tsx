import type { TimeDateSettings } from "types/settings";
import { useState, useEffect, type CSSProperties, type MouseEvent } from "react";
import { toggleBehindElements } from "utils";
import { getDisplayTime, formatDate } from "services/timeDate";
import "./clock.css";
import useWorker from "../useWorker";

export default function Clock({ generalLocale = "en", settings }: { generalLocale?: string, settings: TimeDateSettings }) {
  const [clock, setClock] = useState(() => getDisplayTime(settings.clockStyle === "vertical"));
  const [date, setDate] = useState(() => getDate());
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
  }, [generalLocale, settings.dateLocale]);

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
    setClock(getDisplayTime(settings.clockStyle === "vertical"));

    if (new Date().getDate() !== date.day) {
      updateDate();
    }
  }

  function getDate() {
    const date = new Date();
    const formatted = formatDate(date.getTime(), {
      locale: settings.dateLocale,
      includeWeekday: true,
      excludeYear: true
    });

    return { day: date.getDate(), formatted };
  }

  function updateDate() {
    setDate(getDate());
  }

  function collapse(event: KeyboardEvent) {
    if (event.key === "Escape") {
      document.startViewTransition(() => {
        setExpanded(false);
      });
    }
  }

  function handleClick(event: MouseEvent) {
    if (event.detail === 2) {
      document.startViewTransition(() => {
        setExpanded(!expanded);
      });
    }
  }

  return (
    <div className={`clock${expanded ? " fullscreen-mask expanded" : ""} date-${settings.datePosition}`}
      style={{ "--scale": settings.clockScale, "--date-alignment": settings.dateAlignment } as CSSProperties}
      onClick={handleClick}>
      <div className="clock-time-container">
        {settings.clockStyle === "vertical" ? (
          <div className="clock-time">
            <div className="clock-time-hours">{clock.hours}</div>
            <div>{clock.minutes}</div>
          </div>
        ) : <span className="clock-time">{clock.hours}:{clock.minutes}</span>}
        {clock.period ? <span className="clock-time-period">{clock.period}</span> : null}
      </div>
      {settings.dateHidden ? null : (
        <div className="clock-date" style={{ "--date-scale": settings.dateScale } as CSSProperties}>{date.formatted}</div>
      )}
    </div>
  );
}
