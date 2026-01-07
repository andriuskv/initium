import type { TimeDateSettings } from "types/settings";
import { useState, useEffect, type CSSProperties, type MouseEvent } from "react";
import { toggleBehindElements } from "utils";
import { getDisplayTime, formatDate } from "services/timeDate";
import "./clock.css";

function getDate(dateLocale: string) {
  const date = new Date();
  const formatted = formatDate(date.getTime(), {
    locale: dateLocale,
    includeWeekday: true,
    excludeYear: true
  });

  return { day: date.getDate(), formatted };
}

export default function Clock({ generalLocale = "en", settings }: { generalLocale?: string, settings: TimeDateSettings }) {
  const clockVertical = settings.clockStyle === "vertical";
  const [clock, setClock] = useState(() => getDisplayTime(clockVertical));
  const [date, setDate] = useState(() => getDate(settings.dateLocale));
  const [expanded, setExpanded] = useState(false);

  function updateClock() {
    setClock(getDisplayTime(clockVertical));
  }

  function updateDate() {
    setDate(getDate(settings.dateLocale));
  }

  useEffect(() => {
    if (settings.clockDisabled) {
      return;
    }

    function handleTimeDateChange(event: CustomEventInit) {
      updateClock();

      if (event.detail.unit === "days") {
        updateDate();
      }
    }

    window.addEventListener("timedate-change", handleTimeDateChange);

    return () => {
      window.removeEventListener("timedate-change", handleTimeDateChange);
    };
  }, [settings]);

  useEffect(() => {
    updateDate();
  }, [generalLocale, settings.dateLocale]);

  useEffect(() => {
    function collapse(event: KeyboardEvent) {
      if (event.key === "Escape") {
        document.startViewTransition(() => {
          setExpanded(false);
        });
      }
    }

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
        {clockVertical ? (
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
