/* global chrome */

import { getRandomString } from "utils";
import * as chromeStorage from "services/chromeStorage";
import * as timeDateService from "services/timeDate";
import { getSetting } from "services/settings";

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

function getReminderRepeatTooltip({ type, gap, count, weekdays, customTypeGapName }) {
  const countString = `${count > 1 ? `${count} times ` : ""}`;

  if (type === "custom") {
    if (customTypeGapName === "months" && gap > 11) {
      const yearCount = Math.floor(gap / 12);
      const monthCount = gap % 12;
      return `Repeating ${countString}every ${yearCount} year${yearCount > 1 ? "s" : ""}${monthCount > 0 ? ` ${monthCount} month${monthCount > 1 ? "s" : ""}` : ""}`;
    }
    return `Repeating ${countString}every ${gap === 1 ? customTypeGapName.slice(0, -1) : `${gap} ${customTypeGapName}`}`;
  }
  else if (type === "week") {
    return `Repeating ${countString}every week`;
  }
  else if (type === "month") {
    return `Repeating ${countString}every month`;
  }
  else if (type === "weekday") {
    const fullySelected = weekdays.dynamic.every(weekday => weekday);

    if (fullySelected) {
      return `Repeating ${countString}every weekday`;
    }
    return getWeekdayRepeatTooltip(weekdays.dynamic, countString);
  }
}

function getWeekdayRepeatTooltip(weekdayStates, countString) {
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
  return `Repeating ${countString}every ${str}`;
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
        const token = await fetchToken();
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

async function fetchReminders(retried = false) {
  const token = localStorage.getItem("oauth_token");

  if (!token) {
    return [];
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
        return fetchReminders(true);
      }
      else if (calendarListJson.error.code === 403 && calendarListJson.error.status === "PERMISSION_DENIED") {
        return { message: "Permission to access calendar was not granted." };
      }
      return { message: "Something went wrong. Try again later." };
    }

    for (const item of calendarListJson.items) {
      if (item.primary) {
        const json = await fetch(`${baseURL}/calendars/${item.id}/events?${params}`).then(res => res.json());
        return { reminders: parseItems(json.items, item.colorId, colorsJson) };
      }
    }
  } catch (e) {
    console.log(e);
    return { message: "Something went wrong. Try again later." };
  }
  return [];
}

function parseItems(items, defaultColorId, colors) {
  const defaultColor = colors.calendar[defaultColorId].background;
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

  if (item.description) {
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

function fetchToken() {
  return new Promise(resolve => {
    chrome.identity.getAuthToken({ "interactive": true }, token => {
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

async function clearUser() {
  const token = localStorage.getItem("oauth_token");

  if (token) {
    try {
      await Promise.all([
        chrome.identity.removeCachedAuthToken({ token }),
        fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`).then(res => res.json())
      ]);
    } catch (e) {
      console.log (e);
    }
  }
  chrome.identity.clearAllCachedAuthTokens();
  localStorage.removeItem("oauth_token");
  localStorage.removeItem("google-user");
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
  fetchReminders,
  clearUser
};
