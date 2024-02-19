/* global chrome */

import { getRandomString } from "utils";
import * as chromeStorage from "services/chromeStorage";
import * as timeDateService from "services/timeDate";
import { getSetting } from "services/settings";

let cachedCalendars = {};

function generateYear(year) {
  const { dateLocale } = getSetting("timeDate");
  const months = [];

  for (let i = 0; i < 12; i++) {
    const date = new Date(`${year}-${i + 1}-01`);
    const daysInMonth = timeDateService.getDaysInMonth(year, i);
    const month = {
      firstDayIndex: timeDateService.getFirstDayIndex(year, i),
      name: timeDateService.getMonthName(i, dateLocale),
      dateString: timeDateService.formatDate(date, {
        locale: dateLocale,
        excludeDay: true
      }),
      days: []
    };

    for (let j = 0; j < daysInMonth; j++) {
      const date = new Date(`${year}-${i + 1}-${j + 1}`);

      month.days.push({
        id: getRandomString(),
        year,
        month: i,
        day: j + 1,
        dateString: timeDateService.formatDate(date, {
          locale: dateLocale
        }),
        reminders: []
      });
    }
    months.push(month);
  }
  return months;
}

function getDayCountFromMonthCount(monthCount, repeatAtDay, nextRepeat) {
  let dayCount = 0;

  nextRepeat.leftoverDays ??= 0;

  for (let i = 1; i <= monthCount; i += 1) {
    const year = nextRepeat.year;
    const month = nextRepeat.month + i;
    const nextMonthDays = getDaysInMonth(year, month);

    if (repeatAtDay > nextMonthDays) {
      nextRepeat.leftoverDays = repeatAtDay - nextMonthDays;
      dayCount += nextMonthDays;
    }
    else {
      const days = timeDateService.getDaysInMonth(year, month - 1);
      dayCount += days + nextRepeat.leftoverDays;
      nextRepeat.leftoverDays = 0;
    }
  }
  return dayCount;
}

function getWeekdayRepeatGaps(reminder) {
  const { weekdays } = reminder.repeat;
  const gaps = [];
  let weekday = timeDateService.getWeekday(reminder.year, reminder.month, reminder.day);
  let gap = 1;
  let i = 0;

  while (i < 7) {
    if (weekday === 6) {
      weekday = 0;
    }
    else {
      weekday += 1;
    }

    if (weekdays.dynamic[weekday]) {
      gaps.push(gap);
      gap = 1;
    }
    else {
      gap += 1;
    }
    i += 1;
  }
  return gaps;
}

function getNextReminderDate(calendar, { year, month: monthIndex, day: dayIndex }) {
  let months = calendar[year];
  let month = months[monthIndex];

  while (dayIndex > month.days.length - 1) {
    monthIndex += 1;
    dayIndex -= month.days.length;

    if (monthIndex > 11) {
      year += 1;
      monthIndex = 0;
      months = calendar[year];

      if (!months) {
        break;
      }
    }
    month = months[monthIndex];
  }
  return {
    day: dayIndex,
    month: monthIndex,
    year
  };
}

function getDaysInMonth(year, month) {
  if (month > 11) {
    month = 0;
    year += 1;
  }
  return timeDateService.getDaysInMonth(year, month);
}

function getReminderRangeString({ from, to }) {
  if (!from) {
    return "All day";
  }

  if (to) {
    const fromString = timeDateService.getTimeString(from);
    const toString = timeDateService.getTimeString(to);

    return `${fromString} - ${toString}`;
  }
  return timeDateService.getTimeString(from);
}

function getReminderRepeatTooltip({ type, gap, count, weekdays, customTypeGapName, endDate }) {
  const countString = `${count > 1 ? `${count} times ` : ""}`;
  let endDateString = "";

  if (endDate) {
    const { dateLocale } = getSetting("timeDate");
    const date = new Date(endDate.year, endDate.month, endDate.day);
    const formatedDate = timeDateService.formatDate(date, { locale: dateLocale });
    endDateString = ` until ${formatedDate}`;
  }

  if (type === "custom") {
    if (customTypeGapName === "months" && gap > 11) {
      const yearCount = Math.floor(gap / 12);
      const monthCount = gap % 12;
      return `Repeating ${countString}every ${yearCount} year${yearCount > 1 ? "s" : ""}${monthCount > 0 ? ` ${monthCount} month${monthCount > 1 ? "s" : ""}` : ""}${endDateString}`;
    }
    return `Repeating ${countString}every ${gap === 1 ? customTypeGapName.slice(0, -1) : `${gap} ${customTypeGapName}`}${endDateString}`;
  }
  else if (type === "week") {
    return `Repeating ${countString}every week${endDateString}`;
  }
  else if (type === "month") {
    return `Repeating ${countString}every month${endDateString}`;
  }
  else if (type === "weekday") {
    const fullySelected = weekdays.dynamic.every(weekday => weekday);

    if (fullySelected) {
      return `Repeating ${countString}every weekday${endDateString}`;
    }
    return getWeekdayRepeatTooltip(weekdays.dynamic, countString, endDateString);
  }
}

function getWeekdayRepeatTooltip(weekdayStates, countString, endDateString) {
  const { dateLocale } = getSetting("timeDate");
  const weekdays = timeDateService.getWeekdays(dateLocale);
  const formatter = new Intl.ListFormat(dateLocale, {
    style: "long",
    type: "conjunction"
  });
  const arr = weekdayStates.reduce((arr, weekday, index) => {
    if (weekday) {
      arr.push(weekdays[index]);
    }
    return arr;
  }, []);
  const str = formatter.format(arr);
  return `Repeating ${countString}every ${str}${endDateString}`;
}

async function saveReminders(reminders) {
  chromeStorage.set({ reminders: structuredClone(reminders).map(reminder => {
    if (!reminder.range.from) {
      delete reminder.range;
    }

    if (reminder.repeat) {
      delete reminder.repeat.tooltip;

      if (reminder.repeat.type === "weekday") {
        delete reminder.repeat.weekdays.dynamic;
      }
    }

    return {
      creationDate: reminder.creationDate,
      day: reminder.day,
      month: reminder.month,
      year: reminder.year,
      range: reminder.range,
      repeat: reminder.repeat,
      color: reminder.color,
      text: reminder.text
    };
  })});
}

async function authGoogleUser() {
  return new Promise(resolve => {
    chrome.permissions.request({
      permissions: ["identity"]
    }, async (granted) => {
      if (!granted) {
        resolve({ message: "Permission not granted." });
        return;
      }

      try {
        const token = await fetchToken(true);
        const json = await fetchUser(token);

        const user = {
          email: json.emailAddresses[0].value,
          name: json.names[0].displayName,
          photo: json.photos[0].url
        };
        resolve({ user });
        localStorage.setItem("google-user", JSON.stringify(user));

      } catch (e) {
        console.log(e);
        resolve({ message: "Access not granted." });
        clearUser();
      }
    });
  });
}

async function initGoogleCalendar(retried = false) {
  const token = localStorage.getItem("oauth_token");

  if (!token) {
    return { calendars: [], reminders: [] };
  }
  const baseURL = "https://www.googleapis.com/calendar/v3";
  const params = `key=${process.env.CALENDAR_API_KEY}&access_token=${token}`;

  try {
    const [calendarListJson, colorsJson] = await Promise.all([
      fetch(`${baseURL}/users/me/calendarList?${params}`).then(res => res.json()),
      fetch(`${baseURL}/colors?${params}`).then(res => res.json())
    ]);

    if (calendarListJson.error) {
      if (calendarListJson.error.code === 401) {
        if (retried) {
          return { message: "Something went wrong. Try again later." };
        }
        // Most likely the auth token has expired, fetch new one and try again.
        await fetchToken();
        return initGoogleCalendar(true);
      }
      else if (calendarListJson.error.code === 403 && calendarListJson.error.status === "PERMISSION_DENIED") {
        return { message: "Permission to access calendar was not granted." };
      }
      return { message: "Something went wrong. Try again later." };
    }
    const calendars = parseCalendars(calendarListJson.items);
    const selectedCalendars = calendars.filter(calendar => calendar.selected);
    const selectedCalendarsPromises = selectedCalendars.map(calendar => (
      fetch(`${baseURL}/calendars/${encodeURIComponent(calendar.id)}/events?${params}`).then(res => res.json())
    ));
    const settledItems = await Promise.allSettled(selectedCalendarsPromises);
    let reminders = [];

    for (let i = 0; i < selectedCalendars.length; i += 1) {
      const calendar = selectedCalendars[i];
      const { status, value } = settledItems[i];

      if (status === "fulfilled") {
        const calendarItems = parseItems(value.items, {
          colorId: calendar.colorId,
          calendarId: calendar.id,
          includeDesc: !calendar.id.includes("#holiday@group")
        }, colorsJson);

        reminders = reminders.concat(calendarItems);
        cachedCalendars[calendar.id] = calendarItems;
      }
    }
    localStorage.setItem("google-calendars", JSON.stringify(calendars));
    return { calendars, reminders };
  } catch (e) {
    console.log(e);
    return { message: "Something went wrong. Try again later." };
  }
}

async function fetchCalendarItems(calendar, retried = false) {
  if (cachedCalendars[calendar.id]) {
    return { reminders: cachedCalendars[calendar.id] };
  }
  const token = localStorage.getItem("oauth_token");

  if (!token) {
    return [];
  }
  const baseURL = "https://www.googleapis.com/calendar/v3";
  const params = `key=${process.env.CALENDAR_API_KEY}&access_token=${token}`;

  try {
    const [colorsJson, json] = await Promise.all([
      fetch(`${baseURL}/colors?${params}`).then(res => res.json()),
      fetch(`${baseURL}/calendars/${encodeURIComponent(calendar.id)}/events?${params}`).then(res => res.json())
    ]);

    if (colorsJson.error) {
      if (colorsJson.error.code === 401) {
        if (retried) {
          return { message: "Something went wrong. Try again later." };
        }
        // Most likely the auth token has expired, fetch new one and try again.
        await fetchToken();
        return fetchCalendarItems(calendar, true);
      }
      return { message: "Something went wrong. Try again later." };
    }
    const calendarItems = parseItems(json.items, {
      colorId: calendar.colorId,
      calendarId: calendar.id,
      includeDesc: !calendar.id.includes("#holiday@group")
    }, colorsJson);

    cachedCalendars[calendar.id] = calendarItems;
    return { reminders: calendarItems };
  } catch (e) {
    console.log(e);
    return { message: "Something went wrong. Try again later." };
  }
}

function parseCalendars(items) {
  const user = JSON.parse(localStorage.getItem("google-user")) || {};
  const oldCalendars = JSON.parse(localStorage.getItem("google-calendars")) || [];
  const calendars = [];

  if (oldCalendars.length) {
    for (const item of items) {
      const calendar = oldCalendars.find(calendar => calendar.id === item.id);
      let selected = false;

      if (calendar) {
        selected = calendar.selected;
      }
      calendars.push({
        id: item.id,
        title: item.summary,
        colorId: item.colorId,
        selected,
        ...(item.primary ? { primary: true, title: user.name } : {})
      });
    }
  }
  else {
    // Select only primary calendar to be fetched by default
    for (const item of items) {
      calendars.push({
        id: item.id,
        title: item.summary,
        colorId: item.colorId,
        selected: !!item.primary,
        ...(item.primary ? { primary: true, title: user.name } : {})
      });
    }
  }

  // Make sure primary calendar is first
  for (let i = 0; i < calendars.length; i += 1) {
    if (calendars[i].primary) {
      ([calendars[0], calendars[i]] = [calendars[i], calendars[0]]);
      break;
    }
  }

  return calendars;
}

function parseItems(items, { calendarId, colorId, includeDesc }, colors) {
  const defaultColor = colors.calendar[colorId].background;
  const reminders = [];

  for (const item of items) {
    const optionalParams = {};

    if (item.recurrence) {
      const repeat = parseRecurrence(item.recurrence);

      if (repeat) {
        optionalParams.repeat = repeat;
      }
    }

    const reminder = {
      creationDate: new Date(item.updated ?? item.created).getTime(),
      id: item.id,
      type: "google",
      calendarId,
      color: item.colorId ? colors.event[item.colorId].background : defaultColor,
      text: getReminderText(item, includeDesc),
      range: getRange(item.start, item.end),
      ...getStartDate(item.start),
      ...optionalParams
    };

    reminders.push(reminder);
  }

  return reminders;
}

function getReminderText(item, includeDesc) {
  let text = "";

  if (item.summary) {
    text = item.summary;
  }

  if (includeDesc && item.description) {
    text = `${text}${text ? "\n" : ""}${item.description}`;
  }

  if (!text) {
    text = "(No title)";
  }
  return text;
}

function getStartDate(start) {
  const dateString = start.date ?? start.dateTime;
  const date = new Date(dateString);

  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate()
  };
}

function getRange(start, end) {
  if (start.date && end.date) {
    if (new Date(end.date) - new Date(start.date) === 86400000) {
      return { text: "All day" };
    }
  }
  else if (start.dateTime && end.dateTime) {
    const startDate = new Date(start.dateTime);
    const endDate = new Date(end.dateTime);
    const from = {
      hours: startDate.getHours(),
      minutes: startDate.getMinutes()
    };
    const to = {
      hours: endDate.getHours(),
      minutes: endDate.getMinutes()
    };

    return {
      from,
      to,
      text: getReminderRangeString({ from, to })
    };
  }
}

function parseRecurrence(recurrence) {
  const weekdayIndexes = {
    "MO": 0,
    "TU": 1,
    "WE": 2,
    "TH": 3,
    "FR": 4,
    "SA": 5,
    "SU": 6
  };
  const repeat = {};

  if (recurrence) {
    const rruleString = recurrence.find(item => item.startsWith("RRULE"));

    if (rruleString) {
      const parts = rruleString.split(":")[1].split(";");

      for (const part of parts) {
        const [key, val] = part.split("=");

        if (key === "FREQ") {
          if (val === "DAILY") {
            repeat.type = "custom";
            repeat.customTypeGapName = "days";
            repeat.gap = 1;
          }
          else if (val === "WEEKLY") {
            repeat.type = "custom";
            repeat.customTypeGapName = "weeks";
            repeat.gap = 1;
          }
          else if (val === "MONTHLY") {
            repeat.type = "custom";
            repeat.customTypeGapName = "months";
            repeat.gap = 1;
          }
          else if (val === "YEARLY") {
            repeat.type = "custom";
            repeat.customTypeGapName = "months";
            repeat.freq = "yearly";
            repeat.gap = 12;
          }
        }
        else if (key === "INTERVAL") {
          const gap = Number.parseInt(val, 10);

          if (repeat.freq === "yearly") {
            repeat.gap *= gap;
          }
          else {
            repeat.gap = gap;
          }
        }
        else if (key === "COUNT") {
          repeat.count = Number.parseInt(val, 10);
        }
        else if (key === "WKST") {
          if (val === "MO") {
            repeat.firstWeekday = 0;
          }
          else if (val === "SU") {
            repeat.firstWeekday = 1;
          }
        }
        else if (key === "BYDAY") {
          const days = val.split(",");

          if (days.length > 1) {
            const weekdays = { static: [false, false, false, false, false, false, false] };
            repeat.type = "weekday";

            delete repeat.gap;
            delete repeat.customTypeGapName;

            for (const weekday of days) {
              weekdays.static[weekdayIndexes[weekday]] = true;
            }
            weekdays.dynamic = [...weekdays.static];
            repeat.weekdays = weekdays;
          }
        }
      }
      return Object.keys(repeat).length ? repeat : null;
    }
    return null;
  }
}

function fetchToken(interactive = false) {
  return new Promise(resolve => {
    chrome.identity.getAuthToken({ interactive }, token => {
      resolve(token);

      if (token) {
        localStorage.setItem("oauth_token", token);
      }
    });
  });
}

function fetchUser(token) {
  return fetch(`https://people.googleapis.com/v1/people/me?personFields=emailAddresses,names,photos&key=${process.env.CALENDAR_API_KEY}&access_token=${token}`).then(res => res.json());
}

async function clearUser(retried) {
  const token = localStorage.getItem("oauth_token");

  if (token) {
    try {
      const [json] = await Promise.all([
        fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`).then(res => res.json()),
        chrome.identity.removeCachedAuthToken({ token })
      ]);

      if (json?.error === "invalid_token" && !retried) {
        // If token is not revoked the next auth flow will not be interactive.
        await fetchToken();
        return clearUser(true);
      }
    } catch (e) {
      console.log(e);
    }
  }
  cachedCalendars = {};
  chrome.identity.clearAllCachedAuthTokens();
  localStorage.removeItem("oauth_token");
  localStorage.removeItem("google-user");
  localStorage.removeItem("google-calendars");
}

export {
  generateYear,
  getDayCountFromMonthCount,
  getWeekdayRepeatGaps,
  getNextReminderDate,
  getDaysInMonth,
  getReminderRangeString,
  getReminderRepeatTooltip,
  saveReminders,
  authGoogleUser,
  initGoogleCalendar,
  fetchCalendarItems,
  clearUser
};
