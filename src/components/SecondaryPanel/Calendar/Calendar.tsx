import type { DDate, CalendarType, Day, GoogleCalendar, GoogleReminder, Reminder, GoogleUser } from "types/calendar";
import { useState, useEffect, useRef, useMemo, Suspense, lazy, type CSSProperties, type KeyboardEvent } from "react";
import { dispatchCustomEvent, timeout, getRandomString, getRandomHslColor, findFocusableElements, findRelativeFocusableElement, replaceLink, getLocalStorageItem } from "utils";
import * as chromeStorage from "services/chromeStorage";
import * as timeDateService from "services/timeDate";
import * as calendarService from "services/calendar";
import { useSettings } from "contexts/settings";
import { useNotification } from "contexts/notification";
import { useMessage } from "hooks";
import Icon from "components/Icon";
import Toast from "components/Toast";
import Spinner from "components/Spinner";
import "./calendar.css";
import HeaderDropdown from "./HeaderDropdown";
import ReminderPreview from "./ReminderPreview";

const SelectedDay = lazy(() => import("./SelectedDay"));
const ReminderList = lazy(() => import("./ReminderList"));
const WorldClocks = lazy(() => import("./WorldClocks"));
const Form = lazy(() => import("./Form"));

type Props = {
  visible: boolean,
  locale: any,
  reveal: () => void,
  showIndicator: (id: string, show: boolean) => void
}

type VisibleMonth = {
  previous: {
    name: string,
    days: Day[]
  },
  next: {
    name: string,
    days: Day[]
  },
  current: {
    name: string,
    month: number,
    days: Day[],
    dateString: string
  }
}

export default function Calendar({ visible, locale, reveal, showIndicator }: Props) {
  const { settings: { appearance: { animationSpeed }, timeDate: settings } } = useSettings();
  const { showNotification } = useNotification();
  const [calendar, setCalendar] = useState<CalendarType | null>(null);
  const [currentDay, setCurrentDay] = useState<Day | null>(null);
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [visibleMonth, setVisibleMonth] = useState<VisibleMonth | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [googleReminders, setGoogleReminders] = useState<GoogleReminder[]>([]);
  const [googleCalendars, setGoogleCalendars] = useState<GoogleCalendar[]>([]);
  const [googleUser, setGoogleUser] = useState(() => getLocalStorageItem<GoogleUser>("google-user") || null);
  const [view, setView] = useState<{ name: "default" | "day" | "year" | "reminders", data?: unknown }>({ name: "default" });
  const [transition, setTransition] = useState({ x: 0, y: 0, active: false });
  const [slideAnimation, setSlideAnimation] = useState("");
  const { message, showMessage, dismissMessage }= useMessage("");
  const weekdays = useMemo(() => timeDateService.getWeekdays(settings.dateLocale, "short"), [settings.dateLocale, settings.firstWeekday]);
  const currentFirstWeekday = useRef(settings.firstWeekday);
  const reminderPreviewRef = useRef<HTMLDivElement>(null);
  const reminderPreviewHeight = useRef(0);
  const saveTimeoutId = useRef(0);
  const dateCheckTimeoutId = useRef(0);
  const slideAnimationTimeoutId = useRef(0);
  const notificationCheckIntervalId = useRef(0);
  const first = useRef(true);
  const revealed = useRef(false);
  const tomorrowDay = useMemo(() => {
    if (!calendar) {
      return null;
    }
    const date = timeDateService.getTomorrowDate();
    return getCalendarDay(calendar, date);
  }, [calendar]);

  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    revealed.current = visible;
  }, [visible]);

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

        if (localStorage.getItem("google-user") && localStorage.getItem("gtoken")) {
          initGoogleCalendar();
        }
        else {
          setGoogleUser(null);
          calendarService.clearUser();
        }
      }
      checkDate(calendar, currentDay!);
      window.addEventListener("google-user-change", handleGoogleUserChange);
      chromeStorage.subscribeToChanges(({ reminders }) => {
        if (!reminders) {
          return;
        }

        if (reminders.newValue) {
          const gr = resetRepeatableReminders(googleReminders);
          initCalendar(reminders.newValue, gr as GoogleReminder[]);
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

  useEffect(() => {
    if (!calendar) {
      return;
    }
    checkForNotications();
    clearInterval(notificationCheckIntervalId.current);
    notificationCheckIntervalId.current = window.setInterval(() => {
      checkForNotications();
    }, 60000);

    return () => {
      clearInterval(notificationCheckIntervalId.current);
    };
  }, [reminders.length]);

  async function init() {
    const reminders = await chromeStorage.get("reminders");

    initCalendar(reminders);
  }

  function initCalendar(reminders: Reminder[] = [], googleReminders: GoogleReminder[] = []) {
    const currentDate = timeDateService.getCurrentDate();
    const { year, month } = currentDate;
    const calendar: CalendarType = {
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
    const gr = resetRepeatableReminders(googleReminders) as GoogleReminder[];

    initCalendar(r, gr);
  }

  function checkForNotications() {
    if (!calendar) {
      return;
    }
    const { year, month, day } = timeDateService.getCurrentDate();
    const currentCalendarDay = getCalendarDay(calendar, { year, month, day });
    const currentTime = Date.now();
    let notified: { id: number, resets: number }[] = getLocalStorageItem("notified") || [];
    notified = notified.filter(item => currentTime < item.resets);

    for (const reminder of currentCalendarDay.reminders) {
      if (reminder.notify && !notified.some(item => item.id === reminder.creationDate)) {
        if (reminder.notify.type === "time" && reminder.range.from && reminder.notify.time) {
          const { hours, minutes } = reminder.range.from;
          const reminderTime = new Date(year, month, day, hours, minutes).getTime();

          if (reminderTime > currentTime && currentTime + reminder.notify.time.full * 60 * 1000 > reminderTime) {
            notified.push({
              id: reminder.creationDate,
              resets: reminderTime
            });
            showReminderNotification(reminder, currentCalendarDay);
          }
        }
        else if (reminder.notify.type === "default") {
          notified.push({
            id: reminder.creationDate,
            resets: new Date(year, month, day + 1).getTime()
          });
          showReminderNotification(reminder, currentCalendarDay);
        }
      }
    }
    localStorage.setItem("notified", JSON.stringify(notified));
  }

  function showReminderNotification(reminder: Reminder, day: Day) {
    showNotification({
      id: getRandomString(),
      title: "Calendar",
      iconId: "calendar",
      content: `${reminder.notify?.type === "default" ? "Today" : reminder.range.text}\n${reminder.text}`,
      action: () => {
        if (!revealed.current) {
          revealed.current = true;
          reveal();
        }
        showDayView(day);
      },
      actionTitle: "Show"
    });
  }

  function checkDate(calendar: CalendarType, currentDay: Day) {
    dateCheckTimeoutId.current = timeout(() => {
      const date = timeDateService.getCurrentDate();

      if (currentDay.day !== date.day || currentDay.month !== date.month || currentDay.year !== date.year) {
        const day = getCalendarDay(calendar, currentDay);

        delete day.isCurrentDay;
        setCurrentDay(getCurrentDay(calendar, date));
        setCalendar({ ...calendar });
      }
      checkDate(calendar, currentDay);
    }, 30000, dateCheckTimeoutId.current);
  }

  async function initGoogleCalendar() {
    const data = await calendarService.initGoogleCalendar();

    if ("message" in data) {
      showMessage(data.message);
      return;
    }

    if (data.reminders.length && calendar) {
      setGoogleReminders(data.reminders);
      createReminders(data.reminders, calendar);
      setCalendar({ ...calendar });
    }
    setGoogleCalendars(data.calendars);
  }

  async function toggleCalendarReminders(calendarId: string, selected: boolean) {
    const index = googleCalendars.findIndex(calendar => calendar.id === calendarId);
    const calendar = googleCalendars[index];

    if (calendar.fetching) {
      return;
    }
    let gr = resetRepeatableReminders(googleReminders) as GoogleReminder[];

    setGoogleCalendars(googleCalendars.with(index, {
      ...calendar,
      fetching: true,
      selected
    }));

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
      const newCalendar = googleCalendars.with(index, {
        ...calendar,
        fetching: undefined,
        selected
      });
      setGoogleCalendars(newCalendar);
      localStorage.setItem("google-calendars", JSON.stringify(newCalendar));
    }
  }

  function resetRepeatableReminders(reminders: Reminder[] | GoogleReminder[]) {
    return reminders.map(reminder => {
      delete reminder.nextRepeat;
      return reminder;
    });
  }

  function handleGoogleUserChange({ detail: user }: CustomEventInit) {
    if (user) {
      initGoogleCalendar();
      setGoogleUser(user);
    }
    else {
      handleUserSignOut();
    }
  }

  async function handleUserSignOut(shouldCleanup = false) {
    if (googleReminders.length) {
      const r: Reminder[] = resetRepeatableReminders(reminders);

      setGoogleReminders([]);
      initCalendar(r, []);
      showCalendar();
    }

    if (shouldCleanup) {
      calendarService.clearUser();
    }
    setGoogleCalendars([]);
    setGoogleUser(null);
  }

  function getVisibleMonth(calendar: CalendarType, { year, month }: { year: number, month: number }) {
    const { days, firstDayIndex, name, dateString } = calendar[year][month];
    let previousMonth = month - 1;
    let nextMonth = month + 1;
    const newCalendar = { ...calendar };
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
      newCalendar[year] = calendarService.generateYear(year);
    }
    const { days: previousMonthDays, name: previousMonthName } = newCalendar[year][previousMonth];
    const { days: nextMonthDays, name: nextMonthName } = newCalendar[year][nextMonth];

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
      setCalendar(newCalendar);
    }
  }

  function changeMonth(direction: number, animate?: boolean) {
    if (!calendar || !visibleMonth) {
      return;
    }
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

    if (animate) {
      setSlideAnimation(direction === 1 ? "slide-right" : "slide-left");

      slideAnimationTimeoutId.current = timeout(() => {
        setSlideAnimation("");
      }, 200 * animationSpeed);
    }
  }

  function getCurrentDay(calendar: CalendarType, date: DDate) {
    const day = getCalendarDay(calendar, date);
    const weekday = timeDateService.getWeekday(day.year, day.month, day.day);

    day.isCurrentDay = true;
    day.weekdayName = timeDateService.getWeekdayName(weekday, settings.dateLocale);

    return day;
  }

  function resetCurrentDay() {
    if (!calendar || !currentDay) {
      return;
    }
    const currentDate = timeDateService.getCurrentDate();

    setCurrentDay({
      ...currentDay,
      ...getCalendarDay(calendar, currentDate)
    });
  }

  function getCalendarDay(calendar: CalendarType, { year, month, day }: DDate): Day {
    return calendar[year][month].days[day - 1];
  }

  function transitionElement(element: HTMLElement): Promise<void> {
    return new Promise(resolve => {
      setTransition({
        x: element.offsetLeft + element.offsetWidth / 2,
        y: element.offsetTop + element.offsetHeight / 2,
        active: true
      });

      setTimeout(() => {
        setTransition({ x: 0, y: 0, active: false });
        resolve();
      }, 300 * animationSpeed);
    });
  }

  function showReminderDay(reminder: Reminder | GoogleReminder) {
    const { year, month, day } = reminder;

    if (calendar) {
      showDayView(getCalendarDay(calendar, { year, month, day }));
    }
  }

  async function showDay(element: EventTarget, day: Day, direction = 0) {
    keepHeight();
    await transitionElement(element as HTMLElement);

    showDayView(day);

    if (direction) {
      changeMonth(direction);
    }
  }

  function viewYear() {
    setView({ name: "year" });
  }

  function setVisibleYear(direction: number) {
    const year = currentYear + direction;



    if (calendar && !calendar[year]) {
      calendar[year] = calendarService.generateYear(year);

      if (direction === 1) {
        repeatFutureReminders(calendar);
      }
      setCalendar({ ...calendar });
    }
    setCurrentYear(year);
  }

  async function showMonth(element: HTMLElement, index: number) {
    if (!calendar) {
      return;
    }
    await transitionElement(element);

    getVisibleMonth(calendar, {
      year: currentYear,
      month: index
    });
    showDefaultView();
  }

  function repeatReminder(reminder: Reminder | GoogleReminder, calendar: CalendarType) {
    if (!reminder.repeat) {
      return;
    }
    reminder.nextRepeat ??= {
      repeats: reminder.repeat.count,
      gapIndex: 0,
      gaps: reminder.repeat.type === "weekday" ? calendarService.getWeekdayRepeatGaps(reminder) : undefined,
      year: reminder.year,
      month: reminder.month,
      day:  reminder.day - 1
    };

    if (!reminder.nextRepeat || reminder.nextRepeat.done) {
      return;
    }
    const months = calendar[reminder.nextRepeat.year];
    let month = months[reminder.nextRepeat.month];
    let day = month.days[reminder.nextRepeat.day];

    while (!reminder.nextRepeat.done) {
      if (!day) {
        const date = calendarService.getNextReminderDate(calendar, reminder.nextRepeat);

        if (date.year > reminder.nextRepeat.year) {
          reminder.nextRepeat = { ...reminder.nextRepeat, ...date };

          if (calendar[date.year]) {
            repeatReminder(reminder, calendar);
          }
          return;
        }
        const currentDate = timeDateService.getCurrentDate();
        const nextYear = date.year + 1;

        // Fill missing years between the start of the reminder repetition and the current year
        if (nextYear < currentDate.year && !calendar[nextYear]) {
          calendar[nextYear] = calendarService.generateYear(nextYear);
          repeatReminder(reminder, calendar);
          return;
        }
        reminder.nextRepeat.day = date.day;
        reminder.nextRepeat.month = date.month;
        month = months[reminder.nextRepeat.month];
        day = month.days[reminder.nextRepeat.day];
      }

      if (reminder.repeat.endDate) {
        const endDate = new Date(reminder.repeat.endDate.year, reminder.repeat.endDate.month, reminder.repeat.endDate.day).getTime();
        const reminderDate = new Date(reminder.year, reminder.month, reminder.day).getTime();

        if (endDate < reminderDate) {
          reminder.nextRepeat.done = true;
          day.reminders.push(reminder);
          return;
        }
        const nextReminderDate = new Date(reminder.nextRepeat.year, reminder.nextRepeat.month, reminder.nextRepeat.day + 1).getTime();

        if (nextReminderDate >= endDate) {
          reminder.nextRepeat.done = true;

          if (nextReminderDate === endDate) {
            day.reminders.push(reminder);
          }
          return;
        }
      }
      day.reminders.push(reminder);

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
      else if (reminder.repeat.type === "day") {
        reminder.nextRepeat.day += 1;
      }
      else if (reminder.repeat.type === "weekday" && reminder.nextRepeat.gaps) {
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

  function repeatFutureReminders(calendar: CalendarType) {
    const r = getRepeatableReminders(reminders, calendar);
    const gr = getRepeatableReminders(googleReminders, calendar);

    for (const reminder of r) {
      repeatReminder(reminder, calendar);
    }

    for (const reminder of gr) {
      repeatReminder(reminder, calendar);
    }
  }

  function getRepeatableReminders(reminders: (Reminder | GoogleReminder)[], calendar: CalendarType): (Reminder | GoogleReminder)[] {
    return reminders.reduce((reminders, reminder) => {
      if (reminder.nextRepeat && calendar[reminder.nextRepeat.year] && !reminder.nextRepeat.done) {
        reminders.push(reminder);
      }
      return reminders;
    }, [] as (Reminder | GoogleReminder)[]);
  }

  async function removeReminder(reminder: Reminder | GoogleReminder, day: Day | null = null) {
    if (reminder.type === "google") {
      reminder.removing = true;
      setGoogleReminders([...googleReminders]);
      const success = await calendarService.deleteCalendarEvent((reminder as GoogleReminder).calendarId, reminder.id);

      if (!success) {
        delete reminder.removing;
        setGoogleReminders([...googleReminders]);
        showMessage("Unable to delete an event. Try again later.");
        return;
      }
      const index = googleReminders.findIndex(({ id }) => reminder.id === id);

      googleReminders.splice(index, 1);
    }
    else {
      const index = reminders.findIndex(({ id }) => reminder.id === id);

      reminders.splice(index, 1);
      saveReminders(reminders);
    }
    removeCalendarReminder(reminder.id);
    updateCalendar();

    if (view.name === "day" && day) {
      showDayView(day);
    }
  }

  function updateCalendar() {
    setReminders([...reminders]);
    setGoogleReminders([...googleReminders]);
    setCalendar({ ...calendar });
    resetCurrentDay();
  }

  function removeCalendarReminder(id: string) {
    if (!calendar) {
      return;
    }

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

  function changeReminderColor(id: string) {
    const reminder = reminders.find(reminder => reminder.id === id);

    if (!reminder) {
      return;
    }
    reminder.color = getRandomHslColor();

    updateCalendar();

    saveTimeoutId.current = timeout(() => {
      saveReminders(reminders);
    }, 1000, saveTimeoutId.current);
  }

  function createReminders(reminders: (Reminder | GoogleReminder)[], calendar: CalendarType) {
    reminders.forEach(reminder => createReminder(reminder, calendar));
    repeatFutureReminders(calendar);
    sortCalendarReminders(calendar);
  }

  function createReminder(reminder: Reminder | GoogleReminder, calendar: CalendarType) {
    const { year } = reminder;

    if (!calendar[year]) {
      calendar[year] = calendarService.generateYear(year);
    }
    reminder.id ??= getRandomString();
    reminder.range ??= {};
    reminder.range.text = calendarService.getReminderRangeString(reminder.range);

    if (reminder.description) {
      reminder.descriptionRaw = reminder.description;
      delete reminder.description;
    }

    if (reminder.descriptionRaw) {
      reminder.description = replaceLink(reminder.descriptionRaw, "reminder-list-item-description-link");
    }

    if (reminder.repeat) {
      if (reminder.repeat.type === "weekday" && reminder.repeat.weekdays) {
        reminder.repeat.weekdays.dynamic = [...reminder.repeat.weekdays.static];

        if (reminder.repeat.firstWeekday !== currentFirstWeekday.current) {
          if (reminder.repeat.firstWeekday === 0) {
            reminder.repeat.weekdays.dynamic.unshift(reminder.repeat.weekdays.dynamic.pop()!);
          }
          else {
            reminder.repeat.weekdays.dynamic.push(reminder.repeat.weekdays.dynamic.shift()!);
          }
        }
      }
      reminder.repeat.tooltip = calendarService.getReminderRepeatTooltip(reminder.repeat);
      repeatReminder(reminder, calendar);
    }
    else {
      const day = getCalendarDay(calendar, reminder);

      day.reminders.push(reminder);

      if (day.isCurrentDay) {
        setCurrentDay({ ...day });
      }
    }
  }

  function sortCalendarReminders(calendar: CalendarType) {
    for (const year of Object.keys(calendar)) {
      for (const month of calendar[year]) {
        for (const day of month.days) {
          day.reminders = day.reminders.toSorted((a, b) => a.creationDate - b.creationDate);
        }
      }
    }
  }

  function sortDayReminders(date: DDate) {
    if (!calendar) {
      return;
    }
    const { year, month, day } = date;
    calendar[year][month].days[day - 1].reminders.sort((a, b) => a.creationDate - b.creationDate);

    setCalendar({ ...calendar });
  }

  function showCurrentDateView() {
    if (!calendar) {
      return;
    }
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

    if (reminderPreviewRef.current) {
      const { height } = reminderPreviewRef.current.getBoundingClientRect();

      reminderPreviewHeight.current = height;
      reminderPreviewRef.current.style.display = "none";
    }
  }

  function showCalendar() {
    reminderPreviewHeight.current = 0;

    if (reminderPreviewRef.current) {
      reminderPreviewRef.current.style.display = "";
    }
    showDefaultView();
  }

  function showDayView(day: Day) {
    if (!calendar) {
      return;
    }
    setView({ name: "day", data: { ...calendar[day.year][day.month].days[day.day - 1] } });
  }

  function showForm(form = {}) {
    dispatchCustomEvent("fullscreen-modal", {
      id: "reminder",
      shouldToggle: true,
      component: Form,
      params: { form, locale, user: googleUser, googleCalendars, updateReminder }
    });
  }

  function updateReminder(reminder: Reminder | GoogleReminder, form: { id: string, updating?: boolean } & DDate) {
    const reminderArray = reminder.type === "google" ? googleReminders : reminders;

    if (form.updating) {
      const index = reminderArray.findIndex(({ id }) => form.id === id);

      reminderArray.splice(index, 1, reminder);
      removeCalendarReminder(form.id);
    }
    else {
      reminderArray.push(reminder);
    }
    const primaryCalendar = googleCalendars.find(calendar => calendar.primary);

    if (reminder.type === "google" && primaryCalendar && !primaryCalendar.selected) {
      showMessage("Reminder was created on Google calendar only.");
      return;
    }
    if (calendar) {
      createReminder(reminder, calendar);
    }
    sortDayReminders(form);

    if (view.name === "day") {
      showDayView(view.data as Day);
    }

    if (reminder.type !== "google") {
      saveReminders(reminders);
    }
  }

  async function saveReminders(reminders: Reminder[]) {
    const data = await calendarService.saveReminders(reminders);

    if (data?.usedRatio === 1 && data.message) {
      showMessage(data.message);
    }
    else {
      dismissMessage();
    }
  }

  function editReminder(reminderId: string, type: string, day?: Day) {
    let reminder = null;

    if (type === "google") {
      reminder = googleReminders.find(reminder => reminder.id === reminderId);
    }
    else {
      reminder = reminders.find(reminder => reminder.id === reminderId);
    }
    showForm({
      ...reminder,
      selectedDay: day,
      updating: true
    });
  }

  function showDefaultView() {
    setView({ name: "default" });
  }

  function findNextFocusableElement(element: HTMLElement, shiftKey: boolean) {
    const parent = element.parentElement as HTMLElement;

    if (shiftKey) {
      return findRelativeFocusableElement(parent.firstElementChild as HTMLElement, -1);
    }
    else {
      return findRelativeFocusableElement(parent.lastElementChild as HTMLElement, 1);
    }
  }

  function focusGridElement(key: string, gridElement: HTMLElement, columnCount: number) {
    if (!gridElement.parentElement) {
      return;
    }
    const elements = [...gridElement.parentElement.children] as HTMLElement[];
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

  function handleDaysKeyDown(event: KeyboardEvent) {
    const { key, target } = event;
    const element = target as HTMLElement;

    if (key === "Tab") {
      const focusableElement = findNextFocusableElement(element, event.shiftKey);

      if (focusableElement) {
        event.preventDefault();
        focusableElement.focus();
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
      focusGridElement(key, element, 7);
    }
    else if (key === "Enter") {
      const index = parseInt(element.getAttribute("data-index")!, 10);
      const month = element.getAttribute("data-month") as keyof VisibleMonth;
      let direction = 0;

      if (month === "previous") {
        direction = -1;
      }
      else if (month === "next") {
        direction = 1;
      }

      if (visibleMonth) {
        showDay(target, visibleMonth[month].days[index], direction);
      }
    }
  }

  function handleMonthsKeyDown(event: KeyboardEvent) {
    const { key, target } = event;
    const element = target as HTMLElement;

    if (key === "Tab") {
      const focusableElement = findNextFocusableElement(element, event.shiftKey);

      if (focusableElement) {
        event.preventDefault();
        focusableElement.focus();
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
      focusGridElement(key, element, 4);
    }
    else if (key === "Enter") {
      const index = Number(element.getAttribute("data-index"));

      showMonth(element, index);
    }
  }

  function shouldReminderPreviewBeShown() {
    if (view.name === "reminders") {
      return false;
    }
    let shouldShow = false;

    if (!settings.reminderPreviewHidden && currentDay) {
      shouldShow = currentDay.reminders.length > 0;
    }

    if (settings.showTomorrowReminers && tomorrowDay) {
      shouldShow ||= tomorrowDay.reminders.length > 0;
    }

    return shouldShow;
  }

  if (!calendar || !visibleMonth || !currentDay || !tomorrowDay) {
    return null;
  }
  return (
    <>
      <HeaderDropdown user={googleUser} calendars={googleCalendars} toggleCalendarReminders={toggleCalendarReminders}
        showReminderList={showReminderList} handleUserSignOut={handleUserSignOut}/>
      {message ? <Toast message={message} position="top" offset="40px" locale={locale} dismiss={dismissMessage}/> : null}
      <div className="container-body calendar-current-date">
        <button className="btn text-btn calendar-current-date-btn" onClick={showCurrentDateView}>
          <div className="calendar-current-date-weekday">{currentDay.weekdayName}</div>
          <div>{currentDay.dateString}</div>
        </button>
      </div>
      <div className="container-body calendar-wrapper" style={{ "--x": `${transition.x}px`, "--y": `${transition.y}px`, "--additional-height": `${reminderPreviewHeight.current}px` } as CSSProperties}>
        {view.name === "day" ? (
          <Suspense fallback={<Spinner/>}>
            <SelectedDay day={view.data as Day} locale={locale} editReminder={editReminder}
              showForm={showForm} removeReminder={removeReminder} changeReminderColor={changeReminderColor}
              hide={showCalendar}/>
          </Suspense>
        ) : view.name === "year" ? (
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
                  onClick={({ target }) => showMonth(target as HTMLElement, index)} key={month.name}
                  tabIndex={0} data-index={index}>
                  <div className="calendar-month-inner">{month.name}</div>
                </li>
              ))}
            </ul>
          </div>
        ) : view.name === "reminders" ? (
          <Suspense fallback={null}>
            <ReminderList reminders={reminders.concat(googleReminders)} locale={locale} showReminderDay={showReminderDay}
              editReminder={editReminder} removeReminder={removeReminder} changeReminderColor={changeReminderColor}
              hide={showCalendar}/>
          </Suspense>
        ) : (
          <div className={`calendar${transition.active ? " transition" : ""}`}>
            <div className="calendar-header">
              <button className="btn icon-btn" onClick={() => changeMonth(-1, true)} title={locale.calendar.prevoius_month_title}>
                <Icon id="chevron-left"/>
              </button>
              <button className="btn text-btn calendar-title" onClick={viewYear}>{visibleMonth.current.dateString}</button>
              <button className="btn icon-btn" onClick={() => changeMonth(1, true)} title={locale.calendar.next_month_title}>
                <Icon id="chevron-right"/>
              </button>
            </div>
            <div className={`calendar-body${slideAnimation ? ` ${slideAnimation}` : ""}`}>
              <ul className="calendar-week-days">
                {weekdays.map(weekday => <li className="calendar-cell" key={weekday}>{weekday}</li>)}
              </ul>
              <ul className="calendar-days" onKeyDown={handleDaysKeyDown}>
                {visibleMonth.previous.days.map((day, index) => (
                  <li className="calendar-cell calendar-day" onClick={({ target }) => showDay(target, day, -1)} key={day.id}
                    tabIndex={0} aria-label={day.dateString} data-month="previous" data-index={index}>
                    <div>{day.day}</div>
                  </li>
                ))}
                {visibleMonth.current.days.map((day, index) => (
                  <li className={`calendar-cell calendar-day current-month-day${day.isCurrentDay ? " current" : ""}`}
                    onClick={({ target }) => showDay(target, day)} key={day.id}
                    tabIndex={0} aria-label={day.dateString} data-month="current" data-index={index}>
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
                    tabIndex={0} aria-label={day.dateString} data-month="next" data-index={index}>
                    <div>{day.day}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      {shouldReminderPreviewBeShown() ? (
        <ReminderPreview currentView={view.name} currentDay={currentDay} tomorrowDay={tomorrowDay} settings={settings} ref={reminderPreviewRef}/>) : null}
      {settings.worldClocksHidden ? null : (
        <Suspense fallback={null}>
          <WorldClocks parentVisible={visible} locale={locale}/>
        </Suspense>
      )}
    </>
  );
}
