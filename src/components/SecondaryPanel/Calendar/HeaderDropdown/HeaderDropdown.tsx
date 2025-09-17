import type { GoogleCalendar, GoogleUser } from "types/calendar";
import { useState } from "react";
import { dispatchCustomEvent } from "utils";
import * as calendarService from "services/calendar";
import Dropdown from "components/Dropdown";
import Icon from "components/Icon";
import "./header-dropdown.css";

type Props = {
  user: GoogleUser | null,
  calendars: GoogleCalendar[],
  locale: any,
  toggleCalendarReminders: (calendarId: string, selected: boolean) => void,
  showReminderList: () => void,
  showMessage: (message: string) => void,
  initGoogleUser: (user: GoogleUser) => void,
  handleUserSignOut: (shouldCleanup?: boolean) => void
}

export default function HeaderDropdown({ user, calendars, locale, toggleCalendarReminders, showReminderList, showMessage, initGoogleUser, handleUserSignOut }: Props) {
  const [calendarsVisible, setCalendarsVisible] = useState(() => localStorage.getItem("calendar-list-visible") === "true");
  const [userConnecting, setUserConnecting] = useState(false);

  function toggleCalendarList() {
    const visible = !calendarsVisible;

    setCalendarsVisible(visible);
    localStorage.setItem("calendar-list-visible", visible.toString());
  }

  async function handleGoogleCalendarConnect() {
    setUserConnecting(true);
    dispatchCustomEvent("google-user-sign-in", { connecting: true });

    try {
      const data = await calendarService.authGoogleUser();

      if ("message" in data) {
        showMessage(data.message);
      }
      else {
        initGoogleUser(data.user);
        dispatchCustomEvent("google-user-sign-in", { user: data.user });
      }
    } catch (e) {
      console.log(e);
      showMessage(locale.global.generic_error_message);
      dispatchCustomEvent("google-user-sign-in", { connecting: false });
    }
    finally {
      setUserConnecting(false);
    }
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
              <a href="https://calendar.google.com" className="btn icon-btn calendar-header-dropdown-calendar-link" target="_blank" title={locale.calendar.user_dropdown.open_caledar_title}>
                <img src="assets/google-product-logos/calendar.png" className="calendar-header-dropdown-calendar-logo" width="24px" height="24px" loading="lazy" alt=""></img>
              </a>
              <button className="btn text-btn calendar-header-dropdown-user-logout-btn" onClick={() => handleUserSignOut(true)}>{locale.calendar.user_dropdown.sign_out}</button>
            </div>
          </div>
          <div className="dropdown-group">
            <button className="btn text-btn calendar-list-toggle-btn" onClick={toggleCalendarList}>
              <span>{locale.calendar.user_dropdown.calendars_list_title}</span>
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
      ) : (
        <div className="dropdown-group calendar-connect-container">
          <div className="calendar-connect-container-item">
            <img src="assets/google-product-logos/calendar.png" className="" width="24px" height="24px" loading="lazy" alt=""></img>
            <span>{locale.settings.time_date.google_calendar}</span>
          </div>
          <button className="btn" onClick={handleGoogleCalendarConnect} disabled={userConnecting}>{userConnecting ? locale.settings.time_date.connecting : locale.settings.time_date.connect}</button>
        </div>
      )}
      <div className="dropdown-group">
        <button className="btn text-btn dropdown-btn" onClick={showReminderList}>{locale.calendar.reminders_title}</button>
      </div>
    </Dropdown>
  );
}
