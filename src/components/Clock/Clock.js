import { useState, useEffect, useRef, useMemo } from "react";
import { getDisplayTime, getDate } from "services/timeDate";
import "./clock.css";

export default function Clock({ settings }) {
  const [clock, setClock] = useState(() => ({ ...getDisplayTime() }));
  const timeoutId = useRef(0);
  const date = useMemo(() => getDate("weekday, month&nbsp;day"), []);

  useEffect(() => {
    if (settings.clockDisabled) {
      return;
    }
    updateTime();

    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [settings]);

  function updateTime() {
    setClock({ ...getDisplayTime() });
    timeoutId.current = setTimeout(updateTime, 1000);
  }

  return (
    <div className={`clock date-${settings.datePosition}`}
      style={{ "--scale": settings.clockScale, "--date-offset": settings.dateOffset, "--date-aligment": settings.dateAligment, "--font-family": settings.clockStyle }}>
      <span className={`clock-time${settings.boldedClock ? " bolded" : ""}`}>{clock.hours}:{clock.minutes}</span>
      {clock.period ? <span className="clock-time-period">{clock.period}</span> : null}
      {settings.dateHidden ? null : (
        <div className={`clock-date${settings.boldedDate ? " bolded" : ""}${settings.dontChangeDateStyle ? " ignore-style" : ""}`}
          style={{ "--date-scale": settings.dateScale }}
          dangerouslySetInnerHTML={{ __html: date }}></div>
      )}
    </div>
  );
}
