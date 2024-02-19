import { useState, useEffect, useRef, useMemo, Suspense, lazy } from "react";
import { dispatchCustomEvent, timeout, getRandomString, getRandomHslColor, findFocusableElements, findRelativeFocusableElement } from "utils";
import * as chromeStorage from "services/chromeStorage";
import * as timeDateService from "services/timeDate";
import * as calendarService from "services/calendar";
import { useSettings } from "contexts/settings";
import Icon from "components/Icon";
import "./calendar.css";
import HeaderDropdown from "./HeaderDropdown";

const SelectedDay = lazy(() => import("./SelectedDay"));
const ReminderList = lazy(() => import("./ReminderList"));
const WorldClocks = lazy(() => import("./WorldClocks"));
const Form = lazy(() => import("./Form"));

export default function Calendar({ visible, locale, showIndicator }) {
  const { settings: { appearance: { animationSpeed }, timeDate: settings } } = useSettings();
  const [calendar, setCalendar] = useState(null);
  const [currentDay, setCurrentDay] = useState(null);
  const [currentYear, setCurrentYear] = useState();
  const [visibleMonth, setVisibleMonth] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [googleReminders, setGoogleReminders] = useState([]);
  const [googleCalendars, setGoogleCalendars] = useState([]);
  const [googleUser, setGoogleUser] = useState(() => JSON.parse(localStorage.getItem("google-user")) || null);
  const [view, setView] = useState({ name: "default" });
  const [transition, setTransition] = useState({ x: 0, y: 0 });
  const [message, setMessage] = useState("");
  const weekdays = useMemo(() => timeDateService.getWeekdays(settings.dateLocale, "short"), [settings.dateLocale, settings.firstWeekday]);
  const currentFirstWeekday = useRef(settings.firstWeekday);
  const currReminderPreviewRef = useRef(null);
  const currReminderPreviewHeight = useRef(0);
  const messageTimeoutId = useRef(0);
  const saveTimeoutId = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (currentFirstWeekday.current !== settings.firstWeekday) {
      currentFirstWeekday.current = settings.firstWeekday;
      reinitCalendar();
    }
  }, [settings.firstWeekday]);

  useEffect(() => {
    if (!calendar) {
      return;
    }
    reinitCalendar();
  }, [settings.dateLocale]);

  useEffect(() => {
    if (currentDay) {
      showIndicator("calendar", currentDay.reminders.length > 0);
    }
  }, [currentDay]);

  useEffect(() => {
    if (calendar) {
      if (first.current) {
        first.current = false;
        initGoogleCalendar();
      }
      window.addEventListener("google-user-change", handleGoogleUserChange);
      chromeStorage.subscribeToChanges(({ reminders }) => {
        if (!reminders) {
          return;
        }

        if (reminders.newValue) {
          const gr = resetRepeatableReminders(googleReminders);
          initCalendar(reminders.newValue, gr);
        }
        else {
          initCalendar();
        }
        showCalendar();
      }, { id: "calendar" });
    }
    return () => {
      window.removeEventListener("google-user-change", handleGoogleUserChange);
    };
  }, [calendar]);

  async function init() {
    const reminders = await chromeStorage.get("reminders");

    initCalendar(reminders);
  }

  function initCalendar(reminders = [], googleReminders = []) {
    const currentDate = timeDateService.getCurrentDate();
    const { year, month } = currentDate;
    const calendar = {
      [year] : calendarService.generateYear(year)
    };
    calendar[year][month].isCurrentMonth = true;

    setCurrentYear(year);
    setCurrentDay(getCurrentDay(calendar, currentDate));
    getVisibleMonth(calendar, currentDate);
    createReminders(reminders.concat(googleReminders), calendar);
    setCalendar(calendar);
    setReminders(reminders);
  }

  function reinitCalendar() {
    const r = resetRepeatableReminders(reminders);
    const gr = resetRepeatableReminders(googleReminders);

    initCalendar(r, gr);
  }

  function showMessage(message) {
    setMessage(message);

    messageTimeoutId.current = timeout(() => {
      setMessage("");
    }, 4000, messageTimeoutId.current);
  }

  async function initGoogleCalendar() {
    const data = await calendarService.initGoogleCalendar();

    if (data.message) {
      showMessage(data.message);
      return;
    }

    if (data.reminders.length) {
      setGoogleReminders(data.reminders);
      createReminders(data.reminders, calendar);
      setCalendar({ ...calendar });
    }
    setGoogleCalendars(data.calendars);
  }

  async function toggleCalendarReminders(id, selected) {
    const calendar = googleCalendars.find(calendar => calendar.id === id);

    if (calendar.fetching) {
      return;
    }
    let gr = resetRepeatableReminders(googleReminders);

    calendar.fetching = true;
    calendar.selected = selected;

    setGoogleCalendars([...googleCalendars]);

    try {
      if (selected) {
        const data = await calendarService.fetchCalendarItems(calendar);

        if (data.message) {
          showMessage(data.message);
          return;
        }
        gr = gr.concat(data.reminders);
      }
      else {
        gr = gr.filter(reminder => reminder.calendarId !== calendar.id);
      }
      const r = resetRepeatableReminders(reminders);

      setGoogleReminders(gr);
      initCalendar(r, gr);
      showCalendar();
    } catch (e) {
      console.log(e);
    } finally {
      delete calendar.fetching;
      setGoogleCalendars([...googleCalendars]);
      localStorage.setItem("google-calendars", JSON.stringify(googleCalendars));
    }
  }

  function resetRepeatableReminders(reminders) {
    return reminders.map(reminder => {
      delete reminder.nextRepeat;
      return reminder;
    });
  }

  async function handleGoogleUserChange({ detail: user }) {
    if (user) {
      await initGoogleCalendar();
      setGoogleUser(user);
    }
    else {
      handleUserSignOut();
    }
  }

  async function handleUserSignOut(shouldCleanup) {
    if (googleReminders.length) {
      const r = resetRepeatableReminders(reminders);

      setGoogleReminders([]);
      initCalendar(r, []);
      showCalendar();

      if (shouldCleanup) {
        calendarService.clearUser();
      }
    }
    setGoogleCalendars([]);
    setGoogleUser(null);
  }

  function getVisibleMonth(calendar, { year, month }) {
    const { days, firstDayIndex, name, dateString } = calendar[year][month];
    let previousMonth = month - 1;
    let nextMonth = month + 1;
    let isNewYear = false;

    if (previousMonth < 0) {
      year -= 1;
      previousMonth = 11;
    }
    else if (nextMonth > 11) {
      year += 1;
      nextMonth = 0;
    }

    if (!calendar[year]) {
      isNewYear = true;
      calendar[year] = calendarService.generateYear(year);
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
      current: { name, month, days, dateString }
    });

    if (isNewYear) {
      setCalendar({ ...calendar });
    }
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
    day.weekdayName = timeDateService.getWeekdayName(weekday, settings.dateLocale);

    return day;
  }

  function resetCurrentDay() {
    if (!currentDay) {
      return;
    }
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
      }, 300 * animationSpeed);
    });
  }

  async function showDay(element, day, direction = 0) {
    keepHeight();
    await transitionElement(element);

    showDayView(day);

    if (direction) {
      changeMonth(direction);
    }
  }

  function viewYear() {
    setView({ name: "year" });
  }

  function setVisibleYear(direction) {
    const year = currentYear + direction;

    if (!calendar[year]) {
      calendar[year] = calendarService.generateYear(year);

      if (direction === 1) {
        repeatFutureReminders(calendar);
      }
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
    showDefaultView();
  }

  function addReminder(day, reminder, shouldReplace) {
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
  }

  function repeatReminder(reminder, calendar, shouldReplace) {
    reminder.nextRepeat ??= {
      repeats: reminder.repeat.count,
      gapIndex: 0,
      gaps: reminder.repeat.type === "weekday" ? calendarService.getWeekdayRepeatGaps(reminder) : null,
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
        const date = calendarService.getNextReminderDate(calendar, reminder.nextRepeat);

        if (date.year > reminder.nextRepeat.year) {
          reminder.nextRepeat = { ...reminder.nextRepeat, ...date };

          if (calendar[date.year]) {
            repeatReminder(reminder, calendar);
          }
          return;
        }
        reminder.nextRepeat.day = date.day;
        reminder.nextRepeat.month = date.month;
        month = months[reminder.nextRepeat.month];
        day = month.days[reminder.nextRepeat.day];
      }

      if (reminder.repeat.endDate) {
        const endDate = new Date(reminder.repeat.endDate.year, reminder.repeat.endDate.month, reminder.repeat.endDate.day).getTime();
        const reminderDate = new Date(reminder.nextRepeat.year, reminder.nextRepeat.month, reminder.nextRepeat.day + 1).getTime();

        if (reminderDate >= endDate) {
          reminder.nextRepeat.done = true;

          if (reminderDate === endDate) {
            addReminder(day, reminder, shouldReplace);
          }
          return;
        }
      }
      addReminder(day, reminder, shouldReplace);

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
        if (reminder.repeat.customTypeGapName === "days") {
          reminder.nextRepeat.day += reminder.repeat.gap;
        }
        else if (reminder.repeat.customTypeGapName === "weeks") {
          reminder.nextRepeat.day += reminder.repeat.gap * 7;
        }
        else if (reminder.repeat.customTypeGapName === "months") {
          reminder.nextRepeat.day += calendarService.getDayCountFromMonthCount(reminder.repeat.gap, reminder.day, reminder.nextRepeat);
        }
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
        const nextDays = calendarService.getDaysInMonth(reminder.nextRepeat.year, reminder.nextRepeat.month + 1);

        reminder.nextRepeat.leftoverDays ??= 0;

        if (reminder.day > nextDays) {
          reminder.nextRepeat.leftoverDays = reminder.day - nextDays;
          reminder.nextRepeat.day += nextDays;
        }
        else {
          const days = timeDateService.getDaysInMonth(reminder.nextRepeat.year, reminder.nextRepeat.month);
          reminder.nextRepeat.day += days + reminder.nextRepeat.leftoverDays;
          reminder.nextRepeat.leftoverDays = 0;
        }
      }
      day = month.days[reminder.nextRepeat.day];
    }
  }

  function repeatFutureReminders(calendar) {
    const repeatableReminders = getRepeatableReminders(reminders.concat(googleReminders), calendar);

    for (const reminder of repeatableReminders) {
      repeatReminder(reminder, calendar);
    }
  }

  function getRepeatableReminders(reminders, calendar) {
    return reminders.reduce((reminders, reminder) => {
      if (reminder.nextRepeat && calendar[reminder.nextRepeat.year] && !reminder.nextRepeat.done) {
        reminders.push(reminder);
      }
      return reminders;
    }, []);
  }

  function removeReminder(id, day) {
    const index = reminders.findIndex(reminder => reminder.id === id);

    reminders.splice(index, 1);
    removeRepeatedReminder(id);
    updateCalendar();
    showDayView(day);
    calendarService.saveReminders(reminders);
  }

  function updateCalendar() {
    setReminders([...reminders]);
    setCalendar({ ...calendar });
    resetCurrentDay(calendar);
  }

  function removeRepeatedReminder(id) {
    for (const year of Object.keys(calendar)) {
      for (const month of calendar[year]) {
        for (const day of month.days) {
          if (day.reminders.length) {
            day.reminders = day.reminders.filter(reminder => reminder.id !== id);
          }
        }
      }
    }
  }

  function changeReminderColor(id) {
    const color = getRandomHslColor();
    const reminder = reminders.find(reminder => reminder.id === id);

    reminder.color = color;

    updateCalendar();

    saveTimeoutId.current = timeout(() => {
      calendarService.saveReminders(reminders);
    }, 1000, saveTimeoutId.current);
  }

  function createReminders(reminders, calendar) {
    reminders.forEach(reminder => createReminder(reminder, calendar));
    repeatFutureReminders(calendar);
    sortCalendarReminders(calendar);
  }

  function createReminder(reminder, calendar, shouldReplace) {
    const { year } = reminder;

    if (!calendar[year]) {
      calendar[year] = calendarService.generateYear(year);
    }
    reminder.id ??= getRandomString();
    reminder.range ??= {};
    reminder.range.text = calendarService.getReminderRangeString(reminder.range);

    if (reminder.repeat) {
      if (reminder.repeat.type === "weekday") {
        if (Array.isArray(reminder.repeat.weekdays)) {
          reminder.repeat.weekdays = { static: reminder.repeat.weekdays };
        }
        reminder.repeat.weekdays.dynamic = [...reminder.repeat.weekdays.static];

        if (reminder.repeat.firstWeekday !== currentFirstWeekday.current) {
          if (reminder.repeat.firstWeekday === 0) {
            reminder.repeat.weekdays.dynamic.unshift(reminder.repeat.weekdays.dynamic.pop());
          }
          else {
            reminder.repeat.weekdays.dynamic.push(reminder.repeat.weekdays.dynamic.shift());
          }
        }
      }
      reminder.repeat.tooltip = calendarService.getReminderRepeatTooltip(reminder.repeat);
      repeatReminder(reminder, calendar, shouldReplace);
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
  }

  function sortCalendarReminders(calendar) {
    for (const year of Object.keys(calendar)) {
      for (const month of calendar[year]) {
        for (const day of month.days) {
          day.reminders = day.reminders.toSorted((a, b) => a.creationDate - b.creationDate);
        }
      }
    }
  }

  function sortDayReminders(date) {
    const { year, month, day } = date;
    calendar[year][month].days[day - 1].reminders.sort((a, b) => a.creationDate - b.creationDate);

    setCalendar({ ...calendar });
  }

  function showCurrentDateView() {
    const currentDate = timeDateService.getCurrentDate();

    setCurrentYear(currentDate.year);
    getVisibleMonth(calendar, currentDate);
    showCalendar();
  }

  function showReminderList() {
    keepHeight();
    setView({ name: "reminders" });
  }

  function keepHeight() {
    if (view.name === "day" || view.name === "reminders") {
      return;
    }

    if (currReminderPreviewRef.current) {
      const { height } = currReminderPreviewRef.current.getBoundingClientRect();

      currReminderPreviewHeight.current = height;
      currReminderPreviewRef.current.style.display = "none";
    }
  }

  function showCalendar() {
    currReminderPreviewHeight.current = 0;

    if (currReminderPreviewRef.current) {
      currReminderPreviewRef.current.style.display = "";
    }
    showDefaultView();
  }

  function showDayView(day) {
    setView({ name: "day", data: { ...calendar[day.year][day.month].days[day.day - 1] } });
  }

  function showForm(form = {}) {
    dispatchCustomEvent("fullscreen-modal", {
      id: "reminder",
      shouldToggle: true,
      component: Form,
      params: { form, locale, updateReminder }
    });
  }

  function updateReminder(reminder, form) {
    createReminder(reminder, calendar, form.updating);
    sortDayReminders(form);

    if (form.updating) {
      const index = reminders.findIndex(({ id }) => reminder.oldId === id);

      reminders.splice(index, 1, reminder);

      if (form.repeat.wasEnabled) {
        removeRepeatedReminder(form.id);
      }
    }
    else {
      reminders.push(reminder);
    }

    if (view === "day") {
      setView({ ...view });
    }
    calendarService.saveReminders(reminders);
  }

  function showDefaultView() {
    setView({ name: "default" });
  }

  function findNextFocusableElement(element, shiftKey) {
    if (shiftKey) {
      return findRelativeFocusableElement(element.parentElement.firstElementChild, -1);
    }
    else {
      return findRelativeFocusableElement(element.parentElement.lastElementChild, 1);
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
      else {
        const elements = findFocusableElements();

        if (elements.length) {
          event.preventDefault();
          elements[0].focus();
        }
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
      else {
        const elements = findFocusableElements();

        if (elements.length) {
          event.preventDefault();
          elements[0].focus();
        }
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

  function dismissMessage() {
    clearTimeout(messageTimeoutId.current);
    setMessage("");
  }

  function renderView() {
    if (view.name === "day") {
      return (
        <Suspense fallback={null}>
          <SelectedDay calendar={calendar} day={view.data} reminders={reminders} locale={locale}
            showForm={showForm} removeReminder={removeReminder} changeReminderColor={changeReminderColor}
            hide={showCalendar}/>
        </Suspense>
      );
    }
    else if (view.name === "year") {
      return (
        <div className={`calendar${transition.active ? " transition" : ""}`}>
          <div className="calendar-header">
            <button className="btn icon-btn" onClick={() => setVisibleYear(-1)} title={locale.calendar.prevoius_year_title}>
              <Icon id="chevron-left"/>
            </button>
            <span className="calendar-title">{currentYear}</span>
            <button className="btn icon-btn" onClick={() => setVisibleYear(1)} title={locale.calendar.next_year_title}>
              <Icon id="chevron-right"/>
            </button>
          </div>
          <ul className="calendar-months" onKeyDown={handleMonthsKeyDown}>
            {calendar[currentYear].map((month, index) => (
              <li className={`calendar-month${month.isCurrentMonth ? " current" : ""}`}
                onClick={({ target }) => showMonth(target, index)} key={month.name}
                tabIndex="0" data-index={index}>
                <div className="calendar-month-inner">{month.name}</div>
              </li>
            ))}
          </ul>
        </div>
      );
    }
    else if (view.name === "reminders") {
      return (
        <Suspense fallback={null}>
          <ReminderList reminders={reminders.concat(googleReminders)} locale={locale}
            showForm={showForm} removeReminder={removeReminder} changeReminderColor={changeReminderColor}
            hide={showCalendar}/>
        </Suspense>
      );
    }
    return (
      <div className={`calendar${transition.active ? " transition" : ""}`}>
        <div className="calendar-header">
          <button className="btn icon-btn" onClick={() => changeMonth(-1)} title={locale.calendar.prevoius_month_title}>
            <Icon id="chevron-left"/>
          </button>
          <button className="btn text-btn calendar-title" onClick={viewYear}>{visibleMonth.current.dateString}</button>
          <button className="btn icon-btn" onClick={() => changeMonth(1)} title={locale.calendar.next_month_title}>
            <Icon id="chevron-right"/>
          </button>
        </div>
        <ul className="calendar-week-days">
          {weekdays.map(weekday => <li className="calendar-cell" key={weekday}>{weekday}</li>)}
        </ul>
        <ul className="calendar-days" onKeyDown={handleDaysKeyDown}>
          {visibleMonth.previous.days.map((day, index) => (
            <li className="calendar-cell calendar-day" onClick={({ target }) => showDay(target, day, -1)} key={day.id}
              tabIndex="0" aria-label={day.dateString} data-month="previous" data-index={index}>
              <div>{day.day}</div>
            </li>
          ))}
          {visibleMonth.current.days.map((day, index) => (
            <li className={`calendar-cell calendar-day current-month-day${day.isCurrentDay ? " current" : ""}`}
              onClick={({ target }) => showDay(target, day)} key={day.id}
              tabIndex="0" aria-label={day.dateString} data-month="current" data-index={index}>
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
              tabIndex="0" aria-label={day.dateString} data-month="next" data-index={index}>
              <div>{day.day}</div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!calendar) {
    return null;
  }
  return (
    <>
      <HeaderDropdown user={googleUser} calendars={googleCalendars} toggleCalendarReminders={toggleCalendarReminders}
        showReminderList={showReminderList} handleUserSignOut={handleUserSignOut}/>
      {message ? (
        <div className="container container-opaque calendar-message-container">
          <p className="calendar-message">{message}</p>
          <button className="btn icon-btn" onClick={dismissMessage} title="Dismiss">
            <Icon id="cross"/>
          </button>
        </div>
      ) : null}
      <div className="container-body calendar-current-date">
        <button className="btn text-btn calendar-current-date-btn" onClick={showCurrentDateView}>
          <div className="calendar-current-date-weekday">{currentDay.weekdayName}</div>
          <div>{currentDay.dateString}</div>
        </button>
      </div>
      <div className="container-body calendar-wrapper" style={{ "--x": `${transition.x}px`, "--y": `${transition.y}px`, "--additional-height": `${currReminderPreviewHeight.current}px` }}>{renderView()}</div>
      {!settings.reminderPreviewHidden && currentDay.reminders.length && view.name !== "reminders" ? (
        <div className={`container-body calendar-current-day-preview${view.name === "day" ? " hidden" : ""}`} ref={currReminderPreviewRef}>
          <h4 className="calendar-current-day-preview-title">Today</h4>
          <ul className="calendar-current-day-reminders">
            {currentDay.reminders.map(reminder => (
              <li className="calendar-current-day-reminder" key={reminder.id}>
                <div className="calendar-current-day-reminder-color" style={{ backgroundColor: reminder.color }}></div>
                <p>{reminder.text}</p>
                {reminder.range.from ? <p className="calendar-current-day-reminder-range-text">{reminder.range.text}</p> : null}
                {reminder.type === "google" ? <Icon id="cloud" className="google-reminder-icon" title="Google Calendar event"/> : ""}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {settings.worldClocksHidden ? null : (
        <Suspense fallback={null}>
          <WorldClocks parentVisible={visible} locale={locale}/>
        </Suspense>
      )}
    </>
  );
}
