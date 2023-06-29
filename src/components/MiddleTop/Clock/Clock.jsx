import { useState, useEffect, useRef } from "react";
import { getDisplayTime } from "services/timeDate";
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
    let locale = settings.dateLocale;

    if (locale === "system") {
      locale = navigator.language;
    }
    const options = { weekday: "long", month: "long", day: "numeric" };

    try {
      const date = new Intl.DateTimeFormat(locale, options).format();

      setDate({ day: new Date().getDate(), string: date });
    } catch (e) {
      console.log(e);
      const date = new Intl.DateTimeFormat("en-US", options).format();

      setDate({ day: new Date().getDate(), string: date });
    }
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
        <div className={`clock-time${settings.boldedClock ? " bolded" : ""}`}>
          <div className="clock-time-hours">{clock.hours}</div>
          <div>{clock.minutes}</div>
        </div>
      );
    }
    return <span className={`clock-time${settings.boldedClock ? " bolded" : ""}`}>{clock.hours}:{clock.minutes}</span>;
  }

  return (
    <div className={`clock date-${settings.datePosition}`}
      style={{ "--scale": settings.clockScale, "--date-offset": settings.dateOffset, "--date-alignment": settings.dateAlignment, "--font-family": settings.clockFont }}>
      <div className="clock-time-container">
        {renderClock()}
        {clock.period ? <span className="clock-time-period">{clock.period}</span> : null}
      </div>
      {settings.dateHidden ? null : (
        <div className={`clock-date${settings.boldedDate ? " bolded" : ""}${settings.dontChangeDateStyle ? " ignore-style" : ""}`}
          style={{ "--date-scale": settings.dateScale }}>{date.string}</div>
      )}
    </div>
  );
}
