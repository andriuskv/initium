import { useState, useEffect, useRef } from "react";
import { getDisplayTime, formatDate } from "services/timeDate";
import "./clock.css";

export default function Clock({ settings }) {
  const [clock, setClock] = useState(() => ({ ...getDisplayTime(settings.clockStyle === "vertical") }));
  const [date, setDate] = useState(() => ({ day: new Date().getDate() }));
  const timeoutId = useRef(0);

  useEffect(() => {
    if (settings.clockDisabled) {
      return;
    }
    update();

    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [settings, date]);

  useEffect(() => {
    updateDate();
  }, [settings.dateLocale]);

  function updateDate() {
    const currentDate = new Date();
    const date = formatDate(currentDate.getTime(), {
      locale: settings.dateLocale,
      includeWeekday: true,
      excludeYear: true
    });

    setDate({ day: currentDate.getDate(), string: date });
  }

  function update() {
    setClock({ ...getDisplayTime(settings.clockStyle === "vertical") });

    if (new Date().getDate() !== date.day) {
      updateDate();
    }
    timeoutId.current = setTimeout(update, 1000);
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
    <div className={`clock date-${settings.datePosition}`}
      style={{ "--scale": settings.clockScale, "--date-alignment": settings.dateAlignment }}>
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
