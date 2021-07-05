import { useState, useEffect, useRef, useMemo } from "react";
import { getDisplayTime, getDate } from "services/timeDate";
import "./clock.css";

export default function Clock({ settings }) {
  const [clock, setClock] = useState(() => ({ ...getDisplayTime() }));
  const timeoutId = useRef(0);
  const date = useMemo(() => getDate("weekday, month day"), []);

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
    <div className="clock" style={{ "--scale": settings.clockScale }}>
      <div className="clock-time-container">
        <span className="clock-time">{clock.hours}:{clock.minutes}</span>
        {clock.period ? <span className="clock-time-period">{clock.period}</span> : null}
      </div>
      {settings.dateHidden ? null : <div className="clock-date">{date}</div>}
    </div>
  );
}
