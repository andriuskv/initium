import { getSetting } from "./settings";

function adjustTime({ hours, minutes = 0 }) {
  const { format } = getSetting("timeDate");
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
    minutes,
    hours,
    period
  };
}

function getTimeString(time, { padHours = false, excludeMinutes = false } = {}) {
  const { hours, minutes, period } = adjustTime(time);
  const h = padHours ? padTime(hours) : hours;

  if (excludeMinutes) {
    return `${h}${period && ` ${period}`}`;
  }
  return `${h}:${padTime(minutes)}${period && ` ${period}`}`;
}

function padTime(time, pad = true) {
  return pad ? `00${time}`.slice(-2) : time;
}

function formatTime(time) {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor(time / 60 % 60);
  const seconds = time % 60;

  return `${hours ? `${hours}:` : ""}${padTime(minutes, hours)}:${padTime(seconds)}`;
}

function formatDate(date, { locale = "en", includeTime = false, includeWeekday = false, excludeYear = false, excludeDay = false } = {}) {
  let options = { year: "numeric", month: "long", day: "numeric" };

  if (includeTime) {
    const { format } = getSetting("timeDate");
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

  if (locale === "system") {
    locale = navigator.language;
  }

  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (e) {
    console.log(e);
    return new Intl.DateTimeFormat("en", options).format(date);
  }
}

function getWeekdays(locale = "en", format = "long") {
  const { firstWeekday } = getSetting("timeDate");
  const formatter = new Intl.DateTimeFormat(locale, { weekday: format, timeZone: "UTC" });
  // Start from monday
  const weekdays = [3, 4, 5, 6, 7, 8, 9].map(day => {
    const dd = day < 10 ? `0${day}` : day;
    const date = new Date(`2023-07-${dd}T00:00:00+00:00`);
    return formatter.format(date);
  });

  if (firstWeekday === 1) {
    weekdays.unshift(weekdays.pop());
  }
  return weekdays;
}

function getWeekdayName(day, locale = "en", useShortName = false) {
  const weekdays = getWeekdays(locale, useShortName ? "short" : "long");
  return weekdays[day];
}

function getMonthNames(locale = "en", format = "long") {
  const formatter = new Intl.DateTimeFormat(locale, { month: format, timeZone: "UTC" });
  return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => {
    const mm = month < 10 ? `0${month}` : month;
    const date = new Date(`2023-${mm}-01T00:00:00+00:00`);
    return formatter.format(date);
  });
}

function getMonthName(month, locale = "en", useShortName = false) {
  const months = getMonthNames(locale, useShortName ? "short" : "long");
  return months[month];
}

function getDay(day, withSuffix = true) {
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

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function adjustWeekday(weekday) {
  const { firstWeekday } = getSetting("timeDate");

  if (firstWeekday === 1) {
    return weekday;
  }
  return weekday === 0 ? 6 : weekday - 1;
}

function getWeekday(year, month, day) {
  const weekday = new Date(`${year}-${month + 1}-${day}`).getDay();
  return adjustWeekday(weekday);
}

function getFirstDayIndex(year, month) {
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

function getTimeObj(milliseconds) {
  const date = milliseconds ? new Date(milliseconds) : new Date();

  return {
    hours: date.getHours(),
    minutes: date.getMinutes()
  };
}

function getClockTimeString(milliseconds, params) {
  const obj = getTimeObj(milliseconds);
  return getTimeString(obj, params);
}

function getDisplayTime(padHours = false) {
  const time = adjustTime(getTimeObj());
  time.hours = padHours ? padTime(time.hours) : time.hours;
  time.minutes = padTime(time.minutes);
  return time;
}

function getDate(string, date = getCurrentDate()) {
  const map = {
    year: date.year,
    month: getMonthName(date.month),
    day: getDay(date.day, date.dayWithSuffix),
    weekday: getWeekdayName(date.weekday),
    ...adjustTime(date)
  };
  const regex = new RegExp(Object.keys(map).join("|"), "g");

  if (typeof map.minutes === "number") {
    map.minutes = padTime(map.minutes);
  }
  return string.replace(regex, item => map[item]).trim();
}

function getOffsettedCurrentTime(milliseconds) {
  const offset = new Date(Date.now() + milliseconds).getTime();
  return getClockTimeString(offset, { padHours: true });
}

function getHoursOffset(milliseconds, useNumerical = false) {
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
  const suffix = Math.abs(hours) === 1 ? "" : "s";

  if (hours > 0) {
    return `${hours} hour${suffix} ahead`;
  }
  else if (hours < 0) {
    return `${Math.abs(hours)} hour${suffix} behind`;
  }
  return "Current timezone";
}

export {
  getTimeString,
  getDisplayTime,
  getDaysInMonth,
  getWeekday,
  getFirstDayIndex,
  getCurrentDate,
  getTomorrowDate,
  getWeekdays,
  getWeekdayName,
  getMonthName,
  getDay,
  getDate,
  padTime,
  formatTime,
  formatDate,
  getOffsettedCurrentTime,
  getHoursOffset
};
