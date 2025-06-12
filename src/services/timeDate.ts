import type { GeneralSettings, TimeDateSettings } from "types/settings";
import { parseLocaleString } from "utils";
import { getSetting } from "./settings";

function adjustTime({ hours, minutes = 0 }: { hours: number, minutes?: number }, format: 12 | 24 = 24) {
  let period = "";

  if (format === 12) {
    period = hours > 11 ? "PM" : "AM";

    if (!hours) {
      hours = 12;
    }
    else if (hours > 12) {
      hours -= 12;
    }
  }
  return {
    hours: hours.toString(),
    minutes: minutes.toString(),
    period
  };
}

function getDSTChangeDirection(start: number, end: number) {
  const startOffset = (typeof start === "number" ? new Date(start) : new Date()).getTimezoneOffset();
  const endOffset = (typeof end === "number" ? new Date(end) : new Date()).getTimezoneOffset();

  if (startOffset > endOffset) {
    return 1;
  } else if (startOffset < endOffset) {
    return -1;
  }
  return 0;
}

function getTimeString(time: { hours: number, minutes: number }, { padHours = false, excludeMinutes = false } = {}) {
  const { format } = getSetting("timeDate") as TimeDateSettings;
  const { hours, minutes, period } = adjustTime(time, format);
  const h = padHours ? padTime(hours) : hours;

  if (excludeMinutes) {
    return `${h}${period && ` ${period}`}`;
  }
  return `${h}:${padTime(minutes)}${period && ` ${period}`}`;
}

function padTime(time: number | string, pad = true) {
  return pad ? `00${time}`.slice(-2) : time.toString();
}

function formatDate(date: Date | number, { locale = "en", includeTime = false, includeWeekday = false, excludeYear = false, excludeDay = false } = {}) {
  let options: Intl.DateTimeFormatOptions = { year: "numeric", month: "long", day: "numeric" };

  if (includeTime) {
    const { format } = getSetting("timeDate") as TimeDateSettings;
    options = { ...options, hour: "2-digit", minute: "numeric", hourCycle: format === 12 ? "h12": "h23" };
  }

  if (includeWeekday) {
    options = { ...options, weekday: "long" };
  }

  if (excludeDay) {
    delete options.day;
  }

  if (excludeYear) {
    delete options.year;
  }
  locale = parseDateLocale(locale);

  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (e) {
    console.log(e);
    return new Intl.DateTimeFormat("en", options).format(date);
  }
}

function getDateLocale() {
  const { dateLocale } = getSetting("timeDate") as TimeDateSettings;
  return parseDateLocale(dateLocale);
}


function parseDateLocale(locale: string) {
  if (locale === "default") {
    const generalSettings = getSetting("general") as GeneralSettings;

    return generalSettings.locale;
  }
  else if (locale === "system") {
    return navigator.language;
  }
  return locale;
}

function getWeekdays(locale = "en", format: "short" | "long" = "long") {
  const dateLocale = parseDateLocale(locale);
  const { firstWeekday } = getSetting("timeDate") as TimeDateSettings;
  const formatter = new Intl.DateTimeFormat(dateLocale, { weekday: format, timeZone: "UTC" });
  // Start from monday
  const weekdays = [3, 4, 5, 6, 7, 8, 9].map(day => {
    const dd = day < 10 ? `0${day}` : day;
    const date = new Date(`2023-07-${dd}T00:00:00+00:00`);
    return formatter.format(date);
  });

  if (firstWeekday === 1) {
    weekdays.unshift(weekdays.pop()!);
  }
  return weekdays;
}

function getWeekdayName(day: number, locale = "en", useShortName = false) {
  const weekdays = getWeekdays(locale, useShortName ? "short" : "long");
  return weekdays[day];
}

function getMonthNames(locale = "en", format: "short" | "long" = "long") {
  const dateLocale = parseDateLocale(locale);
  const formatter = new Intl.DateTimeFormat(dateLocale, { month: format, timeZone: "UTC" });
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
    const mm = month < 10 ? `0${month}` : month;
    const date = new Date(`2023-${mm}-01T00:00:00+00:00`);
    return formatter.format(date);
  });
}

function getMonthName(month: number, locale = "en", useShortName = false) {
  const months = getMonthNames(locale, useShortName ? "short" : "long");
  return months[month];
}

function getDay(day: number, withSuffix = true) {
  if (!withSuffix) {
    return day;
  }
  else if (day % 10 === 1 && day !== 11) {
    return `${day}st`;
  }
  else if (day % 10 === 2 && day !== 12) {
    return `${day}nd`;
  }
  else if (day % 10 === 3 && day !== 13) {
    return `${day}rd`;
  }
  return `${day}th`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function adjustWeekday(weekday: number) {
  const { firstWeekday } = getSetting("timeDate") as TimeDateSettings;

  if (firstWeekday === 1) {
    return weekday;
  }
  return weekday === 0 ? 6 : weekday - 1;
}

function getWeekday(year: number, month: number, day: number) {
  const weekday = new Date(`${year}-${month + 1}-${day}`).getDay();
  return adjustWeekday(weekday);
}

function getFirstDayIndex(year: number, month: number) {
  return getWeekday(year, month, 1);
}

function getCurrentDate() {
  const date = new Date();
  const weekday = date.getDay();

  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    weekday: adjustWeekday(weekday)
  };
}

function getTomorrowDate() {
  const date = new Date();
  const tomorrow = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

  return {
    year: tomorrow.getFullYear(),
    month: tomorrow.getMonth(),
    day: tomorrow.getDate()
  };
}

type DateOjb = {
  year: number,
  month: number,
  day: number,
  weekday?: number,
  hours?: number,
  minutes?: number
};

function getDateString(date: Date | DateOjb, includeTime = false) {
  let data = date as DateOjb;
  let timeString = "";

  if (date instanceof Date) {
    data = {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hours: date.getHours(),
      minutes: date.getMinutes()
    };
  }

  if (includeTime) {
    timeString = `T${padTime(data.hours!)}:${padTime(data.minutes!)}:00`;
  }
  return `${data.year}-${padTime(data.month + 1)}-${padTime(data.day)}${timeString}`;
}

function getCurrentDateString() {
  return getDateString(getCurrentDate());
}

function getTimeObj(milliseconds?: number) {
  const date = milliseconds ? new Date(milliseconds) : new Date();

  return {
    hours: date.getHours(),
    minutes: date.getMinutes()
  };
}

function getClockTimeString(milliseconds: number, params: Partial<{ padHours: boolean, excludeMinutes: boolean }>) {
  const obj = getTimeObj(milliseconds);
  return getTimeString(obj, params);
}

function getDisplayTime(padHours = false) {
  const { format } = getSetting("timeDate") as TimeDateSettings;
  const time = adjustTime(getTimeObj(), format);
  time.hours = padHours ? padTime(time.hours) : time.hours;
  time.minutes = padTime(time.minutes);
  return time;
}

function getOffsettedCurrentTime(milliseconds: number) {
  const offset = new Date(Date.now() + milliseconds).getTime();
  return getClockTimeString(offset, { padHours: true });
}

function getHoursOffset(milliseconds: number, locale: any, useNumerical = false) {
  const hours = Math.round(milliseconds / 1000 / 60 / 60);

  if (useNumerical) {
    if (hours > 0) {
      return `+${hours}`;
    }
    else if (hours < 0) {
      return `${hours}`;
    }
    return "0";
  }
  const unit = Math.abs(hours) === 1 ? locale.world.hour : locale.world.hours;

  if (hours > 0) {
    return parseLocaleString(locale.world.ahead, hours, unit);
  }
  else if (hours < 0) {
    return parseLocaleString(locale.world.behind, Math.abs(hours), unit);
  }
  return locale.world.current_timezone;
}

function parseDateInputValue(value: string, includeTime = false) {
  type TimeDateObject = {
    year: number,
    month: number,
    day: number,
    hours?: number,
    minutes?: number
    period?: string
  }

  const values = value.split("-");
  const data: TimeDateObject = {
    year: parseInt(values[0], 10),
    month: parseInt(values[1], 10) - 1,
    day: parseInt(values[2], 10)
  };

  if (includeTime) {
    const { format } = getSetting("timeDate") as TimeDateSettings;
    const time = value.split("T")[1].split(":");
    const { hours, minutes, period } = adjustTime({ hours: parseInt(time[0], 10), minutes: parseInt(time[1], 10) }, format);

    data.hours = parseInt(hours, 10);
    data.minutes = parseInt(minutes, 10);
    data.period = period;
  }
  return data;
}

export {
  adjustTime,
  getTimeString,
  getDisplayTime,
  getDaysInMonth,
  getWeekday,
  getFirstDayIndex,
  getCurrentDate,
  getTomorrowDate,
  getDateString,
  getCurrentDateString,
  getWeekdays,
  getWeekdayName,
  getMonthName,
  getDay,
  getDSTChangeDirection,
  padTime,
  formatDate,
  getOffsettedCurrentTime,
  getHoursOffset,
  parseDateInputValue,
  parseDateLocale,
  getDateLocale
};
