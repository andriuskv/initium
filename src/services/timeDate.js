import { getSetting } from "./settings";

function getTime({ hours, minutes = 0 }) {
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

function getTimeString(time, excludeMinutes = false) {
  const { hours, minutes, period } = getTime(time);

  if (excludeMinutes) {
    return `${hours}${period && ` ${period}`}`;
  }
  return `${hours}:${padTime(minutes)}${period && ` ${period}`}`;
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

function getWeekday(day) {
  const weekdays = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday"
  };

  return weekdays[day];
}

function getMonth(month, useShortName = false) {
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

function getCurrentDate() {
  const date = new Date();

  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    weekday: date.getDay()
  };
}

function getCurrentTime() {
  const date = new Date();

  return {
    hours: date.getHours(),
    minutes: date.getMinutes()
  };
}

function getDisplayTime() {
  const time = getTime(getCurrentTime());
  time.minutes = padTime(time.minutes);
  return time;
}

function getDate(string, date = getCurrentDate()) {
  const map = {
    year: date.year,
    month: getMonth(date.month),
    day: getDay(date.day, date.dayWithSuffix),
    weekday: getWeekday(date.weekday),
    ...getTime(date)
  };
  const regex = new RegExp(Object.keys(map).join("|"), "g");

  if (typeof map.minutes === "number") {
    map.minutes = padTime(map.minutes);
  }
  return string.replace(regex, item => map[item]).trim();
}

export {
  getTime,
  getTimeString,
  getDisplayTime,
  getCurrentDate,
  getWeekday,
  getMonth,
  getDay,
  getDate,
  padTime,
  formatTime
};
