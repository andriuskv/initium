/* global chrome */

import { getRandomString } from "utils";
import * as chromeStorage from "services/chromeStorage";
import * as timeDateService from "services/timeDate";
import { getSetting } from "services/settings";

const baseCalendarURL = "https://www.googleapis.com/calendar/v3";
let cachedCalendars = {};
let eventColors = null;

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
      text: reminder.text,
      description: reminder.description
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
  const params = `key=${process.env.CALENDAR_API_KEY}&access_token=${token}`;

  try {
    const [calendarListJson, colorsJson] = await Promise.all([
      fetch(`${baseCalendarURL}/users/me/calendarList?${params}`).then(res => res.json()),
      fetch(`${baseCalendarURL}/colors?${params}`).then(res => res.json())
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
    const calendars = parseCalendars(calendarListJson.items, colorsJson);
    const selectedCalendars = calendars.filter(calendar => calendar.selected);
    const selectedCalendarsPromises = selectedCalendars.map(calendar => (
      fetch(`${baseCalendarURL}/calendars/${encodeURIComponent(calendar.id)}/events?${params}`).then(res => res.json())
    ));
    const settledItems = await Promise.allSettled(selectedCalendarsPromises);
    let reminders = [];

    eventColors = Object.keys(colorsJson.event).map(id => {
      return { id, color: colorsJson.event[id].background };
    });

    for (let i = 0; i < selectedCalendars.length; i += 1) {
      const calendar = selectedCalendars[i];
      const { status, value } = settledItems[i];

      if (status === "fulfilled") {
        const calendarItems = parseItems(value.items, {
          calendarId: calendar.id,
          defaultColor: calendar.color,
          editable: calendar.canEdit,
          includeDesc: !calendar.id.endsWith("v.calendar.google.com")
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
  const params = `key=${process.env.CALENDAR_API_KEY}&access_token=${token}`;

  try {
    const [colorsJson, json] = await Promise.all([
      fetch(`${baseCalendarURL}/colors?${params}`).then(res => res.json()),
      fetch(`${baseCalendarURL}/calendars/${encodeURIComponent(calendar.id)}/events?${params}`).then(res => res.json())
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
      defaultColor: calendar.color,
      calendarId: calendar.id,
      editable: calendar.canEdit,
      includeDesc: !calendar.id.includes("#holiday@group")
    }, colorsJson);

    cachedCalendars[calendar.id] = calendarItems;
    return { reminders: calendarItems };
  } catch (e) {
    console.log(e);
    return { message: "Something went wrong. Try again later." };
  }
}

function parseCalendars(items, colors) {
  const user = JSON.parse(localStorage.getItem("google-user")) || {};
  const oldCalendars = JSON.parse(localStorage.getItem("google-calendars")) || [];
  const calendars = [];

  for (const item of items) {
    const calendar = oldCalendars.find(calendar => calendar.id === item.id);
    let selected = false;

    if (calendar) {
      selected = calendar.selected;
    }
    else {
      selected = item.primary;
    }
    calendars.push({
      id: item.id,
      title: item.summary,
      color: item.backgroundColor || colors.calendar[item.colorId].background,
      canEdit: item.accessRole === "owner",
      selected,
      ...(item.primary ? { primary: true, title: user.name } : {})
    });
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

function getEventColors(calendarId, calendars) {
  let calendar = null;

  if (calendarId) {
    calendar = calendars.find(calendar => calendar.id === calendarId);
  }
  else {
    calendar = calendars.find(calendar => calendar.primary);
  }
  const defaultColor = calendar.color;

  return [...eventColors, { color: defaultColor }];
}

function parseItems(items, { calendarId, defaultColor, includeDesc, editable }, colors) {
  const reminders = [];

  for (const item of items) {
    if (item.status === "cancelled") {
      continue;
    }
    const optionalParams = {};

    if (item.recurrence) {
      const repeat = parseRecurrence(item.recurrence);

      if (repeat) {
        optionalParams.repeat = repeat;
      }
    }

    if (includeDesc && item.description) {
      optionalParams.description = item.description;
    }

    const reminder = {
      creationDate: new Date(item.updated ?? item.created).getTime(),
      id: item.id,
      type: "google",
      calendarId,
      editable,
      color: item.colorId ? colors.event[item.colorId].background : defaultColor,
      text: getReminderText(item),
      range: getRange(item.start, item.end),
      ...getStartDate(item.start),
      ...optionalParams
    };

    reminders.push(reminder);
  }

  return reminders;
}

function getReminderText(item) {
  let text = "";

  if (item.summary) {
    text = item.summary;
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
        else if (key === "UNTIL") {
          const date = parseEndDateString(val);
          repeat.endDate = date;
        }
      }
      return Object.keys(repeat).length ? repeat : null;
    }
    return null;
  }
}

function parseEndDateString(string) {
  const regex = /(\d{4})(\d{2})(\d{2})/;
  const [_, year, month, day] = string.match(regex);

  return { year, month: month - 1, day: Number.parseInt(day, 10) };
}

function pad(value) {
  return value.toString().padStart(2, "0");
}

function getDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function getDateTimeString(date) {
  return `${getDateString(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function convertReminderToEvent(reminder) {
  const startDate = new Date(reminder.year, reminder.month, reminder.day);
  const endDate = new Date(reminder.year, reminder.month, reminder.day);
  const event = {
    start: {},
    end: {},
    summary: reminder.text
  };

  if (reminder.colorId) {
    event.colorId = reminder.colorId;
  }

  if (reminder.description) {
    event.description = reminder.description;
  }

  if (!reminder.range || reminder.range.text === "All day") {
    endDate.setDate(startDate.getDate() + 1);
    event.start.date = getDateString(startDate);
    event.end.date = getDateString(endDate);
  }
  else {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    startDate.setHours(reminder.range.from.hours, reminder.range.from.minutes);
    event.start.dateTime = getDateTimeString(startDate);
    event.start.timeZone = timeZone;

    if (reminder.range.to) {
      endDate.setHours(reminder.range.to.hours, reminder.range.to.minutes);
      event.end.dateTime = getDateTimeString(endDate);
    }
    else {
      event.end.dateTime = event.start.dateTime;
    }
    event.end.timeZone = timeZone;
  }

  // https://datatracker.ietf.org/doc/html/rfc5545
  if (reminder.repeat) {
    const { type, customTypeGapName, freq, count, firstWeekday, weekdays, endDate } = reminder.repeat;
    const weekdayIndexes = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
    let gap = reminder.repeat.gap;
    let recurenceString = "RRULE:";

    if (type === "custom") {
      if (customTypeGapName === "days") {
        recurenceString += `FREQ=DAILY;`;
      }
      else if (customTypeGapName === "weeks") {
        recurenceString += `FREQ=WEEKLY;`;
      }
      else if (customTypeGapName === "months") {
        if (freq === "yearly" || gap % 12 === 0) {
          gap /= 12;
          recurenceString += `FREQ=YEARLY;`;
        }
        else {
          recurenceString += `FREQ=MONTHLY;`;
        }
      }
    }
    else if (type === "day") {
      recurenceString += `FREQ=DAILY;`;
    }
    else if (type === "week") {
      const wdIndex = startDate.getDay() - 1;

      recurenceString += `FREQ=WEEKLY;BYDAY=${weekdayIndexes[wdIndex]};`;
    }
    else if (type === "weekday") {
      const wds = weekdays.static.map((w, index) => w ? index : w)
        .filter(w => typeof w === "number")
        .map(index => weekdayIndexes[index]).join(",");

      recurenceString += `FREQ=WEEKLY;BYDAY=${wds};`;
    }

    if (gap > 1) {
      recurenceString += `INTERVAL=${gap};`;
    }

    if (count) {
      recurenceString += `COUNT=${count};`;
    }

    if (firstWeekday === 1) {
      recurenceString += "WKST=SU;";
    }
    else {
      recurenceString += "WKST=MO;";
    }

    if (endDate) {
      recurenceString += `UNTIL=${endDate}${pad(endDate.month + 1)}${pad(endDate.day)};`;
    }

    if (recurenceString.at(-1) === ";") {
      recurenceString = recurenceString.slice(0, -1);
    }
    event.recurrence = [recurenceString];
  }

  return event;
}

async function createCalendarEvent(reminder, calendarId, retried = false) {
  const token = localStorage.getItem("oauth_token");

  if (!token) {
    return;
  }
  const event = convertReminderToEvent(reminder);
  const params = `key=${process.env.CALENDAR_API_KEY}&access_token=${token}`;
  const res = await fetch(`${baseCalendarURL}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
    method: "POST",
    body: JSON.stringify(event)
  });

  if (res.status === 401 && !retried) {
    await fetchToken();
    return createCalendarEvent(reminder, calendarId, true);
  }

  if (res.status === 200) {
    return res.json();
  }
}

async function updateCalendarEvent(reminder, calendarId, retried = false) {
  const token = localStorage.getItem("oauth_token");

  if (!token) {
    return;
  }
  const event = convertReminderToEvent(reminder);
  const params = `key=${process.env.CALENDAR_API_KEY}&access_token=${token}`;
  const res = await fetch(`${baseCalendarURL}/calendars/${encodeURIComponent(calendarId)}/events/${reminder.id}?${params}`, {
    method: "PUT",
    body: JSON.stringify(event)
  });

  if (res.status === 401 && !retried) {
    await fetchToken();
    return updateCalendarEvent(reminder, calendarId, true);
  }

  if (res.status === 200) {
    return res.json();
  }
}

async function deleteCalendarEvent(calendarId, eventId, retried = false) {
  const token = localStorage.getItem("oauth_token");

  if (!token) {
    return;
  }
  try {
    const params = `key=${process.env.CALENDAR_API_KEY}&access_token=${token}`;
    const res = await fetch(`${baseCalendarURL}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}?${params}`, {
      method: "DELETE"
    });

    if (res.status === 401 && !retried) {
      await fetchToken();
      return deleteCalendarEvent(calendarId, eventId, true);
    }
    return res.status === 204;
  } catch (e) {
    console.log(e);
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
  eventColors = null;
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
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  clearUser,
  getEventColors
};
