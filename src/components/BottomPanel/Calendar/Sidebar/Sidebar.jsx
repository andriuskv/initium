import { useState } from "react";
import Icon from "components/Icon";
import "./sidebar.css";

export default function Sidebar({ currentDay, selectCurrentDay }) {
  const [visible, setVisible] = useState(true);

  function toggle() {
    setVisible(!visible);
  }

  return (
    <div className={`calendar-sidebar${visible ? " visible" : ""}`}>
      <div className="calendar-sidebar-item calendar-sidebar-date">
        <div className="calendar-sidebar-date-day">{currentDay.day}</div>
        <div>
          <div className="calendar-sidebar-date-weekday">{currentDay.weekdayName}</div>
          <div>{currentDay.monthName} {currentDay.year}</div>
        </div>
      </div>
      {currentDay.reminders.length > 0 && (
        <ul className="calendar-sidebar-item current-day-reminders">
          {currentDay.reminders.map(reminder => (
            <li className="current-day-reminder" style={{ "borderLeftColor": reminder.color }} key={reminder.id}>
              <div>{reminder.text}</div>
              <div className="calendar-reminder-range">{reminder.range.text}</div>
            </li>
          ))}
        </ul>
      )}
      <div className="calendar-sidebar-bottom">
        <button className="btn icon-btn" onClick={toggle}
          title={visible ? "Collapse": "Expand"}>
          <Icon id={`arrow-expand-${visible ? "right": "left"}`}/>
        </button>
        <button className="btn icon-btn" onClick={selectCurrentDay} title="Create reminder">
          <Icon id="plus"/>
        </button>
      </div>
    </div>
  );
}
