import { useState, useEffect } from "react";
import { getDisplayTime, formatDate } from "services/timeDate";
import "./clock.css";
import useWorker from "../useWorker";

export default function Clock({ settings }) {
  const [clock, setClock] = useState(() => ({ ...getDisplayTime(settings.clockStyle === "vertical") }));
  const [date, setDate] = useState(() => ({ day: new Date().getDate() }));
  const [initWorker, destroyWorker] = useWorker(handleMessage);

  useEffect(() => {
    if (settings.clockDisabled) {
      return;
    }
    initWorker({ type: "clock" });

    return () => {
      destroyWorker();
    };
  }, [settings, date]);

  useEffect(() => {
    updateDate();
  }, [settings.dateLocale]);

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
