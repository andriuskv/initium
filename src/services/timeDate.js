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

function getWeekdays() {
  const { firstWeekday } = getSetting("timeDate");
  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ];

  if (firstWeekday === 1) {
    weekdays.unshift("Sunday");
  }
  else {
    weekdays.push("Sunday");
  }
  return weekdays;
}

function getWeekdayName(day, useShortName = false) {
  const weekdays = getWeekdays();
  return useShortName ? weekdays[day].slice(0, 3) : weekdays[day];
}

function getMonthName(month, useShortName = false) {
  const months = {
    0: "January",
    1: "February",
    2: "March",
    3: "April",
    4: "May",
    5: "June",
    6: "July",
    7: "August",
    8: "September",
    9: "October",
    10: "November",
    11: "December"
  };

  return useShortName ? months[month].slice(0, 3) : months[month];
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

function getDisplayTime() {
  const time = adjustTime(getTimeObj());
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

export {
  getTimeString,
  getClockTimeString,
  getDisplayTime,
  getDaysInMonth,
  getWeekday,
  getFirstDayIndex,
  getCurrentDate,
  getWeekdays,
  getWeekdayName,
  getMonthName,
  getDay,
  getDate,
  padTime,
  formatTime
};
