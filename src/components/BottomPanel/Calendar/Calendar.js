import { useState, useEffect } from "react";
import { getRandomString, findFocusableElement } from "utils";
import * as chromeStorage from "services/chromeStorage";
import * as timeDateService from "services/timeDate";
import Icon from "components/Icon";
import "./calendar.css";
import Sidebar from "./Sidebar";
import SelectedDay from "./SelectedDay";

export default function Calendar({ showIndicator }) {
  const [calendar, setCalendar] = useState(null);
  const [currentDay, setCurrentDay] = useState(null);
  const [currentYear, setCurrentYear] = useState();
  const [visibleMonth, setVisibleMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [viewingYear, setViewingYear] = useState(false);
  const [transition, setTransition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (currentDay) {
      showIndicator("calendar", currentDay.reminders.length > 0);
    }
  }, [currentDay]);

  async function init() {
    const reminders = await chromeStorage.get("reminders");

    initCalendar(reminders);

    chromeStorage.subscribeToChanges(({ reminders }) => {
      if (reminders?.newValue) {
        initCalendar(reminders.newValue);
      }
      else {
        setSelectedDay(null);
        setViewingYear(false);
        initCalendar();
      }
    });
  }

  function initCalendar(reminders) {
    const currentDate = timeDateService.getCurrentDate();
    const { year, month } = currentDate;
    const calendar = {
      [year] : generateYear(year)
    };
    calendar[year][month].isCurrentMonth = true;

    setCurrentYear(year);
    getVisibleMonth(calendar, currentDate);
    setCurrentDay(getCurrentDay(calendar, currentDate));

    if (reminders?.length) {
      setReminders(reminders);
      createReminders(reminders, calendar);
    }
    else {
      setCalendar(calendar);
    }
  }

  function generateYear(year) {
    const months = [];

    for (let i = 0; i < 12; i++) {
      const daysInMonth = timeDateService.getDaysInMonth(year, i);
      const month = {
        firstDayIndex: timeDateService.getFirstDayIndex(year, i),
        name: timeDateService.getMonthName(i),
        days: []
      };

      for (let j = 0; j < daysInMonth; j++) {
        month.days.push({
          id: getRandomString(),
          year,
          month: i,
          day: j + 1,
          reminders: []
        });
      }
      months.push(month);
    }
    return months;
  }

  function getVisibleMonth(calendar, { year, month }) {
    const { days, firstDayIndex, name } = calendar[year][month];
    let previousMonth = month - 1;
    let nextMonth = month + 1;

    if (previousMonth < 0) {
      year -= 1;
      previousMonth = 11;
    }
    else if (nextMonth > 11) {
      year += 1;
      nextMonth = 0;
    }

    if (!calendar[year]) {
      calendar[year] = generateYear(year);
      setCalendar({ ...calendar });
    }
    const { days: previousMonthDays, name: previousMonthName } = calendar[year][previousMonth];
    const { days: nextMonthDays, name: nextMonthName } = calendar[year][nextMonth];

    setVisibleMonth({
      previous: {
        name: previousMonthName,
        days: firstDayIndex > 0 ? previousMonthDays.slice(-firstDayIndex) : []
      },
      next: {
        name: nextMonthName,
        days: nextMonthDays.slice(0, 42 - days.length - firstDayIndex)
      },
      current: { name, month, days }
    });
  }

  function changeMonth(direction) {
    let year = currentYear;
    let month = visibleMonth.current.month + direction;

    if (month < 0) {
      month = 11;
      year -= 1;
    }
    else if (month > 11) {
      month = 0;
      year += 1;

      repeatFutureReminders(calendar);
      setCalendar({ ...calendar });
    }
    if (year !== currentYear) {
      setCurrentYear(year);
    }
    getVisibleMonth(calendar, { year, month });
  }

  function getCurrentDay(calendar, date) {
    const day = getCalendarDay(calendar, date);
    const weekday = timeDateService.getWeekday(day.year, day.month, day.day);

    day.isCurrentDay = true;
    day.monthName = timeDateService.getMonthName(day.month);
    day.weekdayName = timeDateService.getWeekdayName(weekday);

    return day;
  }

  function resetCurrentDay() {
    const currentDate = timeDateService.getCurrentDate();

    setCurrentDay({
      ...currentDay,
      ...getCalendarDay(calendar, currentDate)
    });
  }

  function getCalendarDay(calendar, { year, month, day }) {
    return calendar[year][month].days[day - 1];
  }

  function transitionElement(element) {
    return new Promise(resolve => {
      setTransition({
        x: element.offsetLeft + element.offsetWidth / 2,
        y: element.offsetTop + element.offsetHeight / 2,
        active: true
      });

      setTimeout(() => {
        setTransition({ x: 0, y: 0 });
        resolve();
      }, 300);
    });
  }

  async function showDay(element, day, direction = 0) {
    await transitionElement(element);

    setSelectedDay({
      year: day.year,
      month: day.month,
      day: day.day
    });

    if (direction) {
      changeMonth(direction);
    }
  }

  function viewYear() {
    setViewingYear(true);
  }

  function setVisibleYear(direction) {
    const year = currentYear + direction;

    if (!calendar[year]) {
      calendar[year] = generateYear(year);

      repeatFutureReminders(calendar);
      setCalendar({ ...calendar });
    }
    setCurrentYear(year);
  }

  async function showMonth(element, index) {
    await transitionElement(element);

    getVisibleMonth(calendar, {
      year: currentYear,
      month: index
    });
    setViewingYear(false);
  }

  function hide() {
    setSelectedDay(null);
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

      if (weekdays[weekday]) {
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

  function repeatReminder(calendar, reminder, shouldReplace) {
    reminder.nextRepeat ??= {
      repeats: reminder.repeat.count,
      gapIndex: 0,
      gaps: reminder.repeat.type === "weekday" ? getWeekdayRepeatGaps(reminder) : null,
      year: reminder.year,
      month: reminder.month,
      day:  reminder.day - 1
    };

    if (reminder.nextRepeat.done) {
      return;
    }
    const months = calendar[reminder.nextRepeat.year];
    let month = months[reminder.nextRepeat.month];
    let day = month.days[reminder.nextRepeat.day];

    while (true) {
      if (!day) {
        const date = getNextReminderDate(calendar, reminder.nextRepeat);

        if (date.year > reminder.nextRepeat.year) {
          reminder.nextRepeat = { ...reminder.nextRepeat, ...date };

          if (calendar[date.year]) {
            repeatReminder(calendar, reminder);
          }
          return;
        }
        reminder.nextRepeat.day = date.day;
        reminder.nextRepeat.month = date.month;
        month = months[reminder.nextRepeat.month];
        day = month.days[reminder.nextRepeat.day];
      }

      if (shouldReplace) {
        const index = day.reminders.findIndex(({ id }) => id === reminder.oldId);

        if (index < 0) {
          day.reminders.push(reminder);
        }
        else {
          day.reminders.splice(index, 1, reminder);
        }
      }
      else {
        day.reminders.push(reminder);
      }

      if (day.isCurrentDay) {
        setCurrentDay({ ...day });
      }

      if (reminder.nextRepeat.repeats > 0) {
        reminder.nextRepeat.repeats -= 1;

        if (!reminder.nextRepeat.repeats) {
          reminder.nextRepeat.done = true;
          return;
        }
      }

      if (reminder.repeat.type === "custom") {
        reminder.nextRepeat.day += reminder.repeat.gap;
      }
      else if (reminder.repeat.type === "weekday") {
        reminder.nextRepeat.day += reminder.nextRepeat.gaps[reminder.nextRepeat.gapIndex];
        reminder.nextRepeat.gapIndex += 1;

        if (reminder.nextRepeat.gapIndex === reminder.nextRepeat.gaps.length) {
          reminder.nextRepeat.gapIndex = 0;
        }
      }
      else if (reminder.repeat.type === "week") {
        reminder.nextRepeat.day += 7;
      }
      else if (reminder.repeat.type === "month") {
        const days = timeDateService.getDaysInMonth(reminder.nextRepeat.year, reminder.nextRepeat.month);
        reminder.nextRepeat.day += days;
      }
      day = month.days[reminder.nextRepeat.day];
    }
  }

  function repeatFutureReminders(calendar) {
    const repeatableReminders = reminders.reduce((reminders, reminder) => {
      if (calendar[reminder.nextRepeat.year] && !reminder.nextRepeat.done) {
        reminders.push(reminder);
      }
      return reminders;
    }, []);

    for (const reminder of repeatableReminders) {
      repeatReminder(calendar, reminder);
    }
    setCalendar({ ...calendar });
  }

  function updateCalendar() {
    setReminders([...reminders]);
    setCalendar({ ...calendar });
    resetCurrentDay(calendar);
  }

  function createReminders(reminders, calendar) {
    reminders.forEach(reminder => createReminder(reminder, calendar));
  }

  function createReminder(reminder, calendar, shouldReplace) {
    const { year } = reminder;

    if (!calendar[year]) {
      calendar[year] = generateYear(year);
    }
    reminder.id ??= getRandomString();

    if (reminder.range === -1) {
      delete reminder.range;
    }
    reminder.range ??= {};
    reminder.range.text = getReminderRangeString(reminder.range);

    if (reminder.repeat) {
      if (typeof reminder.repeat === "boolean") {
        reminder.repeat = {
          gap: reminder.repeatGap || reminder.gap,
          count: reminder.repeatCount || reminder.count
        };
      }
      reminder.repeat.type ??= "custom";
      reminder.repeat.tooltip = getReminderRepeatTooltip(reminder.repeat);
      repeatReminder(calendar, reminder, shouldReplace);
    }
    else {
      const day = getCalendarDay(calendar, reminder);

      if (shouldReplace) {
        day.reminders.splice(reminder.index, 1, reminder);
      }
      else {
        day.reminders.push(reminder);
      }

      if (day.isCurrentDay) {
        setCurrentDay({ ...day });
      }
    }
    setCalendar({ ...calendar });
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

  function getReminderRepeatTooltip({ type, gap, count, weekdays }) {
    if (type === "custom") {
      return `Repeating ${count > 1 ? `${count} times ` : ""}every ${gap === 1 ? "day" : `${gap} days`}`;
    }
    else if (type === "week") {
      return "Repeating every week";
    }
    else if (type === "month") {
      return "Repeating every month";
    }
    else if (type === "weekday") {
      const fullySelected = weekdays.every(weekday => weekday);
      let str = "";

      if (fullySelected) {
        str = "weekday";
      }
      else {
        const arr = weekdays.reduce((arr, weekday, index) => {
          if (weekday) {
            const name = timeDateService.getWeekdayName(index);

            arr.push(name);
          }
          return arr;
        }, []);

        if (arr.length === 1) {
          str = arr[0];
        }
        else {
          const ending = arr.slice(-2).join(" and ");

          if (arr.length > 2) {
            str = `${arr.slice(0, -2).join(", ")}, ${ending}`;
          }
          else {
            str = ending;
          }
        }
      }
      return `Repeating every ${str}`;
    }
  }

  function selectCurrentDay() {
    setSelectedDay({
      formVisible: true,
      year: currentDay.year,
      month: currentDay.month,
      day: currentDay.day
    });
  }

  function resetSelectedDay() {
    setSelectedDay({ ...selectedDay });
  }

  function findNextFocusableElement(element, shiftKey) {
    if (shiftKey) {
      return findFocusableElement(element.parentElement.firstElementChild, -1);
    }
    else {
      return findFocusableElement(element.parentElement.lastElementChild, 1);
    }
  }

  function focusGridElement(key, gridElement, columnCount) {
    const elements = [...gridElement.parentElement.children];
    const index = elements.indexOf(gridElement);
    let element = null;

    if (key === "ArrowRight") {
      element = elements[index + 1];
    }
    else if (key === "ArrowLeft") {
      element = elements[index - 1];
    }
    else if (key === "ArrowDown") {
      element = elements[index + columnCount];
    }
    else if (key === "ArrowUp") {
      element = elements[index - columnCount];
    }

    if (element) {
      element.focus();
    }
  }

  function handleDaysKeyDown(event) {
    const { key, target } = event;

    if (key === "Tab") {
      const element = findNextFocusableElement(target, event.shiftKey);

      if (element) {
        event.preventDefault();
        element.focus();
      }
    }
    else if (key.startsWith("Arrow")) {
      focusGridElement(key, target, 7);
    }
    else if (key === "Enter") {
      const index = target.getAttribute("data-index");
      const month = target.getAttribute("data-month");
      let direction = 0;

      if (month === "previous") {
        direction = -1;
      }
      else if (month === "next") {
        direction = 1;
      }
      showDay(target, visibleMonth[month].days[index], direction);
    }
  }

  function handleMonthsKeyDown(event) {
    const { key, target } = event;

    if (key === "Tab") {
      const element = findNextFocusableElement(target, event.shiftKey);

      if (element) {
        event.preventDefault();
        element.focus();
      }
    }
    else if (key.startsWith("Arrow")) {
      focusGridElement(key, target, 4);
    }
    else if (key === "Enter") {
      const index = target.getAttribute("data-index");

      showMonth(target, index);
    }
  }

  if (!calendar) {
    return null;
  }
  return (
    <div className="calendar-container">
      <Sidebar currentDay={currentDay} selectCurrentDay={selectCurrentDay}/>
      <div className="calendar-wrapper" style={{ "--x": `${transition.x}px`, "--y": `${transition.y}px` }}>
        {selectedDay ? (
          <SelectedDay calendar={calendar} selectedDay={selectedDay} reminders={reminders}
            updateCalendar={updateCalendar} createReminder={createReminder} resetSelectedDay={resetSelectedDay} hide={hide}/>
        ) : viewingYear ? (
          <div className={`calendar${transition.active ? " transition" : ""}`}>
            <div className="calendar-header">
              <button className="btn icon-btn" onClick={() => setVisibleYear(-1)} title="Previous year">
                <Icon id="chevron-left"/>
              </button>
              <span className="calendar-title">{currentYear}</span>
              <button className="btn icon-btn" onClick={() => setVisibleYear(1)} title="Next year">
                <Icon id="chevron-right"/>
              </button>
            </div>
            <ul className="calendar-months" onKeyDown={handleMonthsKeyDown}>
              {calendar[currentYear].map((month, index) => (
                <li className={`calendar-month${month.isCurrentMonth ? " current" : ""}`}
                  onClick={({ target }) => showMonth(target, index)} key={month.name}
                  tabIndex="0" data-index={index}>{month.name}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className={`calendar${transition.active ? " transition" : ""}`}>
            <div className="calendar-header">
              <button className="btn icon-btn" onClick={() => changeMonth(-1)} title="Previous month">
                <Icon id="chevron-left"/>
              </button>
              <button className="btn text-btn calendar-title" onClick={viewYear}>{visibleMonth.current.name} {currentYear}</button>
              <button className="btn icon-btn" onClick={() => changeMonth(1)} title="Next month">
                <Icon id="chevron-right"/>
              </button>
            </div>
            <ul className="calendar-week-days">
              <li className="calendar-cell">Mon</li>
              <li className="calendar-cell">Tue</li>
              <li className="calendar-cell">Wed</li>
              <li className="calendar-cell">Thu</li>
              <li className="calendar-cell">Fri</li>
              <li className="calendar-cell">Sat</li>
              <li className="calendar-cell">Sun</li>
            </ul>
            <ul className="calendar-days" onKeyDown={handleDaysKeyDown}>
              {visibleMonth.previous.days.map((day, index) => (
                <li className="calendar-cell calendar-day" onClick={({ target }) => showDay(target, day, -1)} key={day.id}
                  tabIndex="0" aria-label={`${visibleMonth.previous.name} ${day.day}`} data-month="previous" data-index={index}>
                  <div>{day.day}</div>
                </li>
              ))}
              {visibleMonth.current.days.map((day, index) => (
                <li className={`calendar-cell calendar-day current-month-day${day.isCurrentDay ? " current" : ""}`}
                  onClick={({ target }) => showDay(target, day)} key={day.id}
                  tabIndex="0" aria-label={`${visibleMonth.current.name} ${day.day}`} data-month="current" data-index={index}>
                  <div>{day.day}</div>
                  {day.reminders.length > 0 && (
                    <div className="day-reminders">
                      {day.reminders.map(reminder => (
                        <div className="day-reminder" style={{ "backgroundColor": reminder.color }} key={reminder.id}></div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
              {visibleMonth.next.days.map((day, index) => (
                <li className="calendar-cell calendar-day" onClick={({ target }) => showDay(target, day, 1)} key={day.id}
                  tabIndex="0" aria-label={`${visibleMonth.next.name} ${day.day}`} data-month="next" data-index={index}>
                  <div>{day.day}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
