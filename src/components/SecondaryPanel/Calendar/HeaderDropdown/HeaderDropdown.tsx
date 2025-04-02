import type { GoogleCalendar, GoogleUser } from "types/calendar";
import { useState } from "react";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./header-dropdown.css";

type Props = {
  user: GoogleUser | null,
  calendars: GoogleCalendar[],
  toggleCalendarReminders: (calendarId: string, selected: boolean) => void,
  showReminderList: () => void,
  handleUserSignOut: (shouldCleanup?: boolean) => void
}

export default function HeaderDropdown({ user, calendars, toggleCalendarReminders, showReminderList, handleUserSignOut }: Props) {
  const [calendarsVisible, setCalendarsVisible] = useState(() => localStorage.getItem("calendar-list-visible") === "true");

  function toggleCalendarList() {
    const visible = !calendarsVisible;

    setCalendarsVisible(visible);
    localStorage.setItem("calendar-list-visible", visible.toString());
  }

  return (
    <Dropdown container={{ className: "calendar-header-dropdown-container" }}
      toggle={{
        body: user ? (
          <>
            <Icon id="vertical-dots"/>
            <img src={user.photo} className="calendar-header-dropdown-toggle-image" alt=""/>
          </>
        ) : <Icon id="vertical-dots"/>,
        className: "calendar-header-dropdown-toggle-btn"
      }}
      body={{ className: "calendar-header-dropdown" }}>
      {user ? (
        <>
          <div className="dropdown-group">
            <div className="calendar-header-dropdown-user">
              <img src={user.photo} width="48px" height="48px" className="calendar-header-dropdown-user-image" loading="lazy" alt=""/>
              <div>
                <div className="calendar-header-dropdown-user-name">{user.name}</div>
                <div className="calendar-header-dropdown-user-email">{user.email}</div>
              </div>
            </div>
            <div className="calendar-header-dropdown-user-bottom">
              <a href="https://calendar.google.com" className="btn icon-btn calendar-header-dropdown-calendar-link" target="_blank" title="Open Google Calendar">
                <img src="assets/google-product-logos/calendar.png" className="calendar-header-dropdown-calendar-logo" width="24px" height="24px" loading="lazy" alt=""></img>
              </a>
              <button className="btn text-btn calendar-header-dropdown-user-logout-btn" onClick={() => handleUserSignOut(true)}>Sign Out</button>
            </div>
          </div>
          <div className="dropdown-group">
            <button className="btn text-btn calendar-list-toggle-btn" onClick={toggleCalendarList}>
              <span>Calendars</span>
              <Icon id="chevron-down" className={`calendar-list-state-icon${calendarsVisible ? " expanded" : ""}`}/>
            </button>
            {calendarsVisible ? (
              <ul className="calendar-list">
                {calendars.map(calendar => (
                  <li key={calendar.id}>
                    <label className="calendar-list-item">
                      <input type="checkbox" className="sr-only checkbox-input"
                        disabled={calendar.fetching}
                        checked={calendar.selected}
                        onChange={event => toggleCalendarReminders(calendar.id, event.target.checked)}/>
                      <div className="checkbox">
                        <div className="checkbox-tick"></div>
                      </div>
                      <span className="calendar-list-item-title">{calendar.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </>
      ) : null}
      <div className="dropdown-group">
        <button className="btn text-btn dropdown-btn" onClick={showReminderList}>Reminders</button>
      </div>
    </Dropdown>
  );
}
