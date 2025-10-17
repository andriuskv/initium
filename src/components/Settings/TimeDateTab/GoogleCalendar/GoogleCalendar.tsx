import { useState, useEffect } from "react";
import type { GoogleUser } from "types/calendar";
import { dispatchCustomEvent, getLocalStorageItem } from "utils";
import * as calendarService from "services/calendar";
import GoogleUserDropdown from "./GoogleUserDropdown";
import "./GoogleCalendar.css";

type Props = {
  locale: any,
}

type CalendarUser = {
  user?: GoogleUser | null,
  message?: string,
  status?: "connecting" | ""
}

export default function GoogleCalendar({ locale }: Props) {
  const [calendarUser, setCalendarUser] = useState<CalendarUser>(() => {
    if (localStorage.getItem("gtoken")) {
      return { user: getLocalStorageItem<GoogleUser>("google-user") || null } as CalendarUser;
    }
    else {
      calendarService.clearUser();
    }
    return { user: null } as unknown as CalendarUser;
  });

  useEffect(() => {
    function handleGoogleUserSignIn({ detail: { user, connecting } }: CustomEventInit) {
      if (user) {
        setCalendarUser({ ...calendarUser, user, status: "" });
      }
      else if (connecting) {
        setCalendarUser({ ...calendarUser, status: "connecting" });
      }
      else {
        setCalendarUser({ ...calendarUser, status: "" });
      }
    }

    window.addEventListener("google-user-sign-in", handleGoogleUserSignIn);

    return () => {
      window.removeEventListener("google-user-sign-in", handleGoogleUserSignIn);
    };
  }, [calendarUser]);

  async function handleGoogleCalendarConnect() {
    setCalendarUser({ message: "", status: "connecting" });

    try {
      const data = await calendarService.authGoogleUser();

      if ("message" in data) {
        setCalendarUser({ message: data.message });
      }
      else {
        setCalendarUser({ user: data.user });
        dispatchCustomEvent("google-user-change", data.user);
      }
    } catch (e) {
      console.log(e);
      setCalendarUser({ message: locale.global.generic_error_message });
    }
  }

  async function handleGoogleCalendarDisconnect() {
    calendarService.clearUser();
    setCalendarUser({ user: null });
    dispatchCustomEvent("google-user-change");
  }

  return (
    <div className="setting last-setting-tab-item google-calendar-integration-setting">
      <div className="google-calendar-integration-setting-main">
        <img src="assets/google-product-logos/calendar.png" className="" width="24px" height="24px" loading="lazy" alt=""></img>
        <span>{locale.settings.time_date.google_calendar}</span>
        {calendarUser.user ? <GoogleUserDropdown user={calendarUser.user} locale={locale} handleSignOut={handleGoogleCalendarDisconnect}/> : (
          <button className="btn" onClick={handleGoogleCalendarConnect} disabled={calendarUser.status === "connecting"}>{calendarUser.status === "connecting" ? locale.settings.time_date.connecting : locale.settings.time_date.connect}</button>
        )}
      </div>
      {calendarUser.message ? <p className="google-calendar-integration-setting-message">{calendarUser.message}</p> : null}
    </div>
  );
}
