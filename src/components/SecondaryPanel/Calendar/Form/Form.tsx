import type { ChangeEvent, MouseEvent, KeyboardEvent, FormEvent } from "react";
import type { TimeDateSettings } from "types/settings";
import type { Day, Reminder, GoogleReminder, GoogleCalendar, GoogleUser } from "types/calendar";
import { useState, useMemo } from "react";
import { getRandomHexColor, hslStringToHex, getRandomString, parseLocaleString } from "utils";
import { padTime, getWeekday, getWeekdays, getTimeString, formatDate, parseDateInputValue, getDateString } from "services/timeDate";
import { getSetting } from "services/settings";
import { createCalendarEvent, updateCalendarEvent, getEventColors, saveNotifiedReminder } from "services/calendar";
import { useMessage } from "hooks";
import Icon from "components/Icon";
import Dropdown from "components/Dropdown";
import Toast from "components/Toast";
import "./form.css";

type SelectedDay = {
  id: string,
  dateString: string,
  day: number,
  month: number,
  year: number,
  reminders: Reminder[]
}

type FormType = {
  submiting?: boolean,
  id: string,
  creationDate: number,
  text: string,
  descriptionRaw?: string
  day: number,
  month: number,
  year: number,
  type?: string,
  range: {
    enabled: boolean,
    text?: string
    dataList: { items: string[] }
    from: {
      text: string,
      hours: number,
      minutes: number
    },
    to: {
      text: string,
      hours: number,
      minutes: number
    },
    message?: string
  },
  repeat: {
    enabled: boolean,
    type: "custom" | "week" | "month" | "weekday" | "day",
    customTypeGapName: "days" | "weeks" | "months",
    year: number,
    month: number,
    day: number,
    gap: string | number,
    count: string | number,
    ends: "occurrences" | "never" | "date",
    endDate?: {
      year: number,
      month: number,
      day: number,
    }
    endDateString?: string,
    minEndDateString?: string,
    leftoverDays?: number,
    firstWeekday?: 0 | 1,
    weekdays: {
      current: number,
      dynamic: boolean[]
      static: boolean[]
    },
    dateMessage?: string,
    gapError?: boolean,
    countError?: boolean
  },
  notify: {
    enabled: boolean,
    type: "default" | "time",
    time: { full?: number, hours: number, minutes: number },
    message?: string
  }
  dateString: string,
  displayDateString: string,
  pickerColor: string,
  calendarId?: string
  colorId?: string,
  eventColors?: { id: string, color: string }[]
  eventColorIndex?: number
  updating?: boolean,
  selectedDay?: SelectedDay
}

type InitialForm = GoogleReminder & {
  selectedDay: Day,
  updating: boolean
};

type Props = {
  form: InitialForm,
  locale: any,
  user: GoogleUser,
  googleCalendars: GoogleCalendar[],
  updateReminder: (reminder: Reminder | GoogleReminder, form: FormType) => void,
  hide: () => void
}

export default function Form({ form: initialForm, locale, user, googleCalendars, updateReminder, hide }: Props) {
  const [form, setForm] = useState(() => getInitialForm(initialForm));
  const { message, showMessage, dismissMessage }= useMessage("");
  const weekdayNames = useMemo(() => {
    const { dateLocale } = getSetting("timeDate") as TimeDateSettings;
    return getWeekdays(dateLocale, "short");
  }, []);

  function getInitialForm(initialForm: InitialForm) {
    const { dateLocale } = getSetting("timeDate") as TimeDateSettings;
    const weekday = getWeekday(initialForm.year, initialForm.month, initialForm.day);
    const weekdays = {
      current: weekday,
      static: [false, false, false, false, false, false, false],
      dynamic: [false, false, false, false, false, false, false]
    };
    weekdays.static[weekday] = true;
    weekdays.dynamic[weekday] = true;

    const date = initialForm.selectedDay ? initialForm.selectedDay: initialForm;
    const dateString = getDateString(date);
    const displayDateString = formatDate(new Date(date.year, date.month, date.day), { locale: dateLocale });
    const pickerColor = initialForm.color ? initialForm.color.startsWith("hsl") ? hslStringToHex(initialForm.color) : initialForm.color : getRandomHexColor();

    const formA: FormType = {
      id: initialForm.id || getRandomString(),
      type: initialForm.type || "normal",
      creationDate: Date.now(),
      text: initialForm.text,
      descriptionRaw: initialForm.descriptionRaw,
      day: initialForm.day,
      month: initialForm.month,
      year: initialForm.year,
      dateString,
      displayDateString,
      pickerColor,
      updating: initialForm.updating,
      range: {
        enabled: false,
        dataList: generateTimeTable(),
        from: { hours: 0, minutes: 0, text: "" },
        to: { hours: 0, minutes: 0, text: "" }
      },
      repeat: {
        enabled: false,
        type: "custom",
        customTypeGapName: "days",
        day: initialForm.day,
        month: initialForm.month,
        year: initialForm.year,
        weekdays,
        ends: "never",
        gap: "",
        count: "",
        endDateString: initialForm.repeat?.endDate ? getDateString({
          year: initialForm.repeat.endDate.year,
          month: initialForm.repeat.endDate.month,
          day: initialForm.repeat.endDate.day
        }) : undefined,
        minEndDateString: getDateString({
          year: initialForm.year,
          month: initialForm.month,
          day: initialForm.day
        }),
      },
      notify: {
        enabled: false,
        type: "default",
        time: { hours: 1, minutes: 0 }
      }
    };

    if (initialForm.calendarId) {
      formA.eventColors = getEventColors(initialForm.calendarId, googleCalendars);

      if (formA.eventColors) {
        formA.eventColorIndex = formA.eventColors.length - 1;
      }

      if (initialForm.color && formA.eventColors) {
        const index = formA.eventColors.findIndex(({ color }) => initialForm.color === color);

        if (index >= 0) {
          formA.eventColorIndex = index;
          formA.colorId = formA.eventColors[formA.eventColorIndex].id;
        }
      }
    }

    if (initialForm.range) {
      formA.range.enabled = initialForm.range.text !== locale.calendar.range_label;

      if (initialForm.range.from) {
        formA.range.from = { ...initialForm.range.from, text: `${initialForm.range.from.hours}:${padTime(initialForm.range.from.minutes)}`, };
      }

      if (initialForm.range.to) {
        formA.range.to = { ...initialForm.range.to, text: `${initialForm.range.to.hours}:${padTime(initialForm.range.to.minutes)}`};
      }
      else {
        formA.range.to = {
          text: "",
          hours: 0,
          minutes: 0
        };
      }
    }

    if (initialForm.repeat) {
      formA.repeat.enabled = true;
      formA.repeat.type = initialForm.repeat.type || "custom";
      formA.repeat.ends = initialForm.repeat.count > 0 ? "occurrences" : "never";
      formA.repeat.gap = initialForm.repeat.gap ?? "";
      formA.repeat.count = initialForm.repeat.count;
      formA.repeat.year = initialForm.year;
      formA.repeat.month = initialForm.month;
      formA.repeat.day = initialForm.day;

      if (formA.repeat.endDateString) {
        formA.repeat.ends = "date";
      }

      if (initialForm.repeat.type === "weekday" && initialForm.repeat.weekdays) {
        formA.repeat.weekdays = {
          current: weekday,
          dynamic: initialForm.repeat.weekdays.dynamic,
          static: [...initialForm.repeat.weekdays.dynamic].with(weekday, true)
        };
      }
    }

    if (initialForm.notify) {
      formA.notify.enabled = true;
      formA.notify.type = initialForm.notify.type;

      if (initialForm.notify.time) {
        formA.notify.time = {
          full: initialForm.notify.time.full,
          hours: Math.floor(initialForm.notify.time.full / 60),
          minutes: initialForm.notify.time.full % 60
        };
      }
    }

    return formA;
  }

  function generateTimeTable() {
    const dataList = { items: [""] };
    let minutes = 0;
    let hours = 0;

    while (hours < 24) {
      dataList.items.push(getTimeString({ hours, minutes }, { padHours: true }));
      minutes += 30;

      if (minutes === 60) {
        hours += 1;
        minutes = 0;
      }
    }
    return dataList;
  }

  function validateHourFormat(value: string) {
    const regex24Hours = /^(([0-1]?[0-9])|(2[0-3])):[0-5]?[0-9]$/;
    const regex12Hours = /^((0?[1-9])|(1[0-2])):[0-5]?[0-9] ?[a|p|A|P][m|M]$/;

    return regex24Hours.test(value) || regex12Hours.test(value);
  }

  function parseTimeString(string: string) {
    if (!string || !validateHourFormat(string)) {
      return;
    }
    const [hourString, minuteString] = string.toLowerCase().split(":");
    let hours = parseInt(hourString, 10);

    if (minuteString.endsWith("am") && hours === 12) {
      hours = 0;
    }
    else if (minuteString.endsWith("pm") && hours < 12) {
      hours += 12;
    }

    return {
      hours,
      minutes: parseInt(minuteString, 10)
    };
  }

  async function handleFormSubmit(event: FormEvent) {
    interface FormElements extends HTMLFormControlsCollection {
      description: HTMLInputElement;
      reminder: HTMLInputElement;
      color: HTMLInputElement;
      enddate: HTMLInputElement;
    }
    const formElement = event.target as HTMLFormElement;
    const elements = formElement.elements as FormElements;
    const descriptionRaw = elements.description.value.trim();

    event.preventDefault();

    const reminder: Partial<Reminder> = {
      creationDate: Date.now(),
      id: form.id,
      text: elements.reminder.value,
      color: elements.color ? elements.color.value : "",
      year: form.year,
      month: form.month,
      day: form.day
    };

    if (descriptionRaw) {
      reminder.descriptionRaw = descriptionRaw;
    }
    const formRange = { ...form.range };

    if (formRange.enabled) {
      reminder.range = {
        from: parseTimeString(formRange.from.text),
        to: parseTimeString(formRange.to.text)
      };
      const { from, to } = reminder.range;

      if (to) {
        if (!from || to.hours < from.hours || (to.hours === from.hours && to.minutes <= from.minutes)) {
          setForm({
            ...form,
            range: {
              ...formRange,
              message: locale.calendar.form.invalid_range_message
            }
          });
          return;
        }
      }
      delete formRange.message;
    }

    const formRepeat = { ...form.repeat };

    if (formRepeat.enabled) {
      const repeat: Partial<Reminder["repeat"]> = {
        type: formRepeat.type
      };

      delete formRepeat.dateMessage;

      if (formRepeat.type === "custom") {
        if (formRepeat.gap) {
          delete formRepeat.gapError;
          repeat.gap = Number(formRepeat.gap);
          repeat.customTypeGapName = formRepeat.customTypeGapName;
        }
        else {
          formRepeat.gapError = true;
        }
      }
      else if (formRepeat.type === "weekday") {
        const settings = getSetting("timeDate") as TimeDateSettings;

        repeat.firstWeekday = settings.firstWeekday;
        repeat.weekdays = {
          static: formRepeat.weekdays.static,
          dynamic: [...formRepeat.weekdays.static]
        };
      }

      if (formRepeat.ends === "occurrences") {
        if (formRepeat.count) {
          repeat.count = Number(formRepeat.count);
        }
        else {
          formRepeat.countError = true;
        }
      }
      else if (formRepeat.ends === "date") {
        const dateString = elements.enddate.value;

        if (!dateString) {
          formRepeat.dateMessage = "Please provide date.";
          setForm({ ...form, range: formRange, repeat: formRepeat });
          return;
        }
        const endDate = parseDateInputValue(dateString);

        if (new Date(endDate.year, endDate.month, endDate.day) < new Date(form.year, form.month, form.day)) {
          formRepeat.dateMessage = "Date should be higher that the current selected date.";
          setForm({ ...form, range: formRange, repeat: formRepeat });
          return;
        }
        repeat.endDate = endDate;
      }

      if (formRepeat.gapError || formRepeat.countError) {
        setForm({ ...form, range: formRange, repeat: formRepeat });
        return;
      }
      reminder.repeat = repeat as Reminder["repeat"];
    }

    if (form.type !== "google" && form.notify.enabled) {
      if (form.range.enabled) {
        const { hours, minutes } = form.notify.time;

        if (hours === 0 && minutes === 0) {
          setForm({
            ...form,
            range: formRange,
            repeat: formRepeat,
            notify: {
              ...form.notify,
              message:  "Please provide notification time"
            }
          });
          return;
        }
        reminder.notify = {
          type: "time",
          time: { full: hours * 60 + minutes }
        };
      }
      else {
        reminder.notify = { type: "default" };
      }
      saveNotifiedReminder(reminder as Reminder);
    }

    if (form.type === "google") {
      const googleReminder = reminder as GoogleReminder;
      setForm({ ...form, submiting: true });

      const primaryCalendar = googleCalendars.find(calendar => calendar.primary);

      if (!primaryCalendar) {
        return;
      }
      googleReminder.type = "google";
      googleReminder.calendarId = primaryCalendar.id;
      if (form.eventColors && typeof form.eventColorIndex === "number") {
        googleReminder.color = form.eventColors[form.eventColorIndex].color;
      }
      googleReminder.colorId = form.colorId;
      googleReminder.editable = true;

      if (form.updating) {
        const event = await updateCalendarEvent(googleReminder, primaryCalendar.id);

        if (!event) {
          setForm({ ...form, submiting: false });
          showMessage("Unable to update an event. Try again later.");
          return;
        }
      }
      else {
        const event = await createCalendarEvent(googleReminder, primaryCalendar.id);

        if (!event) {
          setForm({ ...form, submiting: false });
          showMessage("Unable to create an event. Try again later.");
          return;
        }
        reminder.id = event.id;
      }
      updateReminder(googleReminder, form);
    }
    else {
      updateReminder(reminder as Reminder, form);
    }
    hide();
  }

  function preventFormSubmit(event: KeyboardEvent) {
    const element = event.target as HTMLElement;

    if (event.key === "Enter" && element.nodeName !== "BUTTON" && element.nodeName !== "TEXTAREA") {
      event.preventDefault();
    }
  }

  function changeReminderType(type: "normal" | "google") {
    if (type === "google" && !form.eventColors && form.calendarId) {
      const eventColors = getEventColors(form.calendarId, googleCalendars);

      if (eventColors) {
        setForm({
          ...form,
          type,
          eventColors,
          eventColorIndex: eventColors.length - 1
        });
      }

    }
    else {
      setForm({ ...form, type });
    }
  }

  function updateEventColor(id: string, index: number) {
    setForm({ ...form,
      colorId: id,
      eventColorIndex: index
    });
  }

  function toggleFormCheckbox(event: ChangeEvent<HTMLInputElement>) {
    const { name } = event.target as { name: "range" | "repeat" | "notify" };
    const obj = {
      ...form[name],
      enabled: !form[name].enabled
    };

    if (name === "repeat") {
      (obj as FormType["repeat"]).dateMessage = undefined;
    }

    setForm({
      ...form,
      [name]: obj
    });
  }

  function handleRepeatTypeChange({ target }: ChangeEvent<HTMLSelectElement>) {
    setForm({
      ...form,
      repeat: {
        ...form.repeat,
        type: target.value as FormType["repeat"]["type"]
      }
    });
  }

  function handleCustomTypeGapNameChange({ target }: ChangeEvent<HTMLSelectElement>) {
    setForm({
      ...form,
      repeat: {
        ...form.repeat,
        customTypeGapName: target.value as FormType["repeat"]["customTypeGapName"]
      }
    });
  }

  function handleWeekdaySelection({ target }: ChangeEvent<HTMLInputElement>, weekday: number) {
    if (!form.repeat?.weekdays || weekday === form.repeat.weekdays.current) {
      return;
    }
    setForm({
      ...form,
      repeat: {
        ...form.repeat,
        weekdays: {
          ...form.repeat.weekdays,
          static: form.repeat.weekdays.static.with(weekday, target.checked),
          dynamic: form.repeat.weekdays.dynamic
        }
      }
    });
  }

  function handleRangeInputChange({ target }: ChangeEvent<HTMLInputElement>) {
    const { name, value } = target as { name: "from" | "to", value: string };
    let message = form.range.message;

    if (validateHourFormat(value)) {
      message = undefined;
    }
    else if (value) {
      message = locale.calendar.form.invalid_time_format_message;
    }
    setForm({
      ...form,
      range: {
        ...form.range,
        message,
        [name]: {
          ...form.range[name],
          text: value
        }
      }
    });
  }

  function handleRepeatInputChange({ target }: ChangeEvent<HTMLInputElement>) {
    const { name, value } = target as { name: "gap" | "count", value: string };
    const regex = /^\d+$/;
    const repeat = { ...form.repeat };

    if (!value || regex.test(value)) {
      repeat[`${name}Error`] = false;
    }
    else if (name === "gap") {
      repeat.gapError = true;
    }
    else if (name === "count") {
      repeat.countError = true;
    }
    setForm({
      ...form,
      repeat: {
        ...repeat,
        [name]: value
      }
    });
  }

  function handleRadioInputChange({ target }: ChangeEvent<HTMLInputElement>) {
    if (target.type === "radio") {
      setForm({
        ...form,
        repeat: {
          ...form.repeat,
          ends: target.value as FormType["repeat"]["ends"]
        }
      });
    }
  }

  function selectRangeDataItem({ target }: MouseEvent<HTMLElement>, listName: "from" | "to") {
    const element = target as HTMLLIElement;

    if (element.nodeName === "LI") {
      setForm({
        ...form,
        range: {
          ...form.range,
          message: undefined,
          [listName]: {
            ...form.range[listName],
            text: element.textContent
          }
        }
      });
    }
  }

  function handleNotifyTimeChange({ target }: ChangeEvent<HTMLSelectElement>) {
    if (!form.notify.time) {
      return;
    }
    setForm({
      ...form,
      notify: {
        ...form.notify,
        time: { hours: form.notify.time.hours, minutes: form.notify.time.minutes, [target.name]: Number.parseInt(target.value, 10) }
      }
    });
  }

  function showSelectedDayPicker() {
    const element = document.querySelector("input[name=selecteddate]") as HTMLInputElement;

    if (element) {
      element.showPicker();
    }
  }

  function handleSelectedDayInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { dateLocale } = getSetting("timeDate") as TimeDateSettings;
    const displayDate = parseDateInputValue(event.target.value);
    const displayDateString = formatDate(new Date(displayDate.year, displayDate.month, displayDate.day), { locale: dateLocale });
    const weekday = getWeekday(displayDate.year, displayDate.month, displayDate.day);

    if (!form.repeat) {
      return;
    }
    let weekdaysStatic = form.repeat.weekdays.static.with(form.repeat.weekdays.current, false);
    weekdaysStatic = weekdaysStatic.with(weekday, true);

    setForm({
      ...form,
      ...displayDate,
      repeat: {
        ...form.repeat,
        weekdays: {
          current: weekday,
          static: weekdaysStatic,
          dynamic: form.repeat.weekdays.dynamic
        }
      },
      dateString: event.target.value,
      displayDateString
    });
  }

  const repeatCount = parseLocaleString(locale.calendar.form.repeat_count_label, <span key="a">{locale.calendar.form.repeat_after}</span>,
    <input type="text" className="input repeat-input" name="count" autoComplete="off" key="occurrences"
      value={form.repeat.count || ""} onChange={handleRepeatInputChange}
      disabled={form.repeat.ends !== "occurrences"} required={form.repeat.ends === "occurrences"}/>,
    <span key={form.repeat.count}>{form.repeat.count === "1" ? locale.calendar.form.repeat_occurrence : locale.calendar.form.repeat_occurrences}</span>
  );

  return (
    <form className="reminder-form" inert={form.submiting} onSubmit={handleFormSubmit} onKeyDown={preventFormSubmit}>
      <div className="container-header">
        {form.type === "google" ? (
          <img src="assets/google-product-logos/calendar.png" className="reminder-form-header-icon"
            width="24px" height="24px" loading="lazy" alt=""></img>
        ) : <Icon id="calendar" className="reminder-form-header-icon"/>}
        <h3 className="container-header-title">{locale.calendar.form.title}</h3>
      </div>
      <div className="container-body reminder-form-body">
        <div className="reminder-form-display-date">
          {form.type === "google" && form.eventColors && form.eventColorIndex !== undefined ? (
            <Dropdown
              toggle={{ body: <div className="reminder-form-selecated-event-color" style={{ backgroundColor: form.eventColors[form.eventColorIndex].color }}></div>, title: "Color picker" }}
              container={{ className: "reminder-form-event-color-dropdown-container" }}>
              <ul className="reminder-form-event-colors">
                {form.eventColors.map(({ id, color }, index) => (
                  <li key={index}>
                    <button type="button" className={`btn dropdown-btn reminder-form-event-color${form.eventColorIndex === index ? " active" : ""}`}
                      onClick={() => updateEventColor(id, index)} style={{ backgroundColor: color }}></button>
                  </li>
                ))}
              </ul>
            </Dropdown>
          ) : (
            <div className="reminder-form-color-picker-container">
              <input type="color" name="color" className="reminder-form-color-picker"
                defaultValue={form.pickerColor} title={locale.global.color_input_title} data-modal-keep/>
            </div>
          )}
          <div className="reminder-form-display-date-container">
            <button type="button" className="btn text-btn reminder-form-display-date-btn" title="Show date picker"
              onClick={showSelectedDayPicker} data-modal-keep>{form.displayDateString}</button>
            <input type="date" name="selecteddate" className="input reminder-form-display-date-input" tabIndex={-1}
              value={form.dateString} onChange={handleSelectedDayInputChange}/>
          </div>
          {!form.updating && user ? (
            <Dropdown container={{ className: "reminder-form-display-date-dropdown" }} toggle={{ title: locale.calendar.form.reminder_type_label }}>
              <div className="dropdown-group">
                <h4 className="reminder-form-display-date-dropdown-title">{locale.calendar.form.reminder_type_label}</h4>
              </div>
              <div className="dropdown-group">
                <button type="button" className={`btn text-btn dropdown-btn${form.type === "normal" ? " active" : ""}`}
                  onClick={() => changeReminderType("normal")}>{locale.calendar.form.reminder_type_label_normal}</button>
                <button type="button" className={`btn text-btn dropdown-btn${form.type === "google" ? " active" : ""}`}
                  onClick={() => changeReminderType("google")}>{locale.calendar.form.reminder_type_label_event}</button>
              </div>
            </Dropdown>
          ) : null}
        </div>
        <input type="text" className="input" name="reminder" autoComplete="off" defaultValue={form.text} placeholder={locale.calendar.form.input_placeholder} required/>
        <div className="textarea-container">
          <textarea className="input textarea reminder-form-textarea" name="description" defaultValue={form.descriptionRaw}
            placeholder={locale.calendar.form.desc_placeholder}></textarea>
        </div>
        <div className="reminder-form-row">
          <label className="reminder-form-setting">
            <input type="checkbox" className="sr-only checkbox-input" name="range"
              onChange={toggleFormCheckbox} checked={!form.range.enabled}/>
            <div className="checkbox">
              <div className="checkbox-tick"></div>
            </div>
            <span>{locale.calendar.range_label}</span>
          </label>
          <label className="reminder-form-setting">
            <input type="checkbox" className="sr-only checkbox-input" name="repeat"
              onChange={toggleFormCheckbox} checked={form.repeat.enabled}/>
            <div className="checkbox">
              <div className="checkbox-tick"></div>
            </div>
            <span>{locale.calendar.form.repeat_label}</span>
          </label>
          {form.type === "google" ? null : (
            <label className="reminder-form-setting">
              <input type="checkbox" className="sr-only checkbox-input" name="notify"
                onChange={toggleFormCheckbox} checked={form.notify.enabled}/>
              <div className="checkbox">
                <div className="checkbox-tick"></div>
              </div>
              <span>{locale.calendar.form.notify_label}</span>
            </label>
          )}
          {form.repeat.enabled && (
            <div className="select-container reminder-form-repeat-type-selection">
              <select className="input select" onChange={handleRepeatTypeChange} value={form.repeat.type}>
                <option value="custom">{locale.calendar.form.repeat_option_custom}</option>
                <option value="day">{locale.calendar.form.repeat_option_day}</option>
                <option value="weekday">{locale.calendar.form.repeat_option_weekday}</option>
                <option value="week">{locale.calendar.form.repeat_option_week}</option>
                <option value="month">{locale.calendar.form.repeat_option_month}</option>
              </select>
            </div>
          )}
        </div>
        {form.range.enabled && (
          <div>
            <div className="reminder-form-row">
              <div className="reminder-form-setting">
                <label htmlFor="range-from">{locale.calendar.form.range_from_label}</label>
                <div className="input-icon-btn-container">
                  <input type="text" id="range-from" className="input reminder-range-input" autoComplete="off" name="from"
                    onChange={handleRangeInputChange} value={form.range.from.text} required/>
                  <Dropdown toggle={{ iconId: "clock", title: "Time table" }} body={{ className: "reminder-form-data-list-dropdown" }}>
                    <ul className="reminder-form-data-list-items" onClick={event => selectRangeDataItem(event, "from")}>
                      {form.range.dataList.items.map((item, i) => <li className="reminder-form-data-list-item dropdown-btn" key={i}>{item}</li>)}
                    </ul>
                  </Dropdown>
                </div>
              </div>
              <div className="reminder-form-setting">
                <label htmlFor="range-to">{locale.calendar.form.range_to_label}</label>
                <div className="input-icon-btn-container">
                  <input type="text" id="range-to" className="input reminder-range-input" autoComplete="off" name="to"
                    onChange={handleRangeInputChange} value={form.range.to.text}/>
                  <Dropdown toggle={{ iconId: "clock", title: "Time table" }} body={{ className: "reminder-form-data-list-dropdown" }}>
                    <ul className="reminder-form-data-list-items" onClick={event => selectRangeDataItem(event, "to")}>
                      {form.range.dataList.items.map((item, i) => <li className="reminder-form-data-list-item dropdown-btn" key={i}>{item}</li>)}
                    </ul>
                  </Dropdown>
                </div>
              </div>
            </div>
            {form.range.message && <div className="reminder-form-input-message">{form.range.message}</div>}
          </div>
        )}
        {form.repeat.enabled && (
          <>
            {form.repeat.type === "custom" ? (
              <div>
                <label className="reminder-form-setting">
                  <span>{locale.calendar.form.repeat_custom_label}</span>
                  <span className="multi-input-container">
                    <input type="text" className="input multi-input-left repeat-input" name="gap" autoComplete="off"
                      value={form.repeat.gap} onChange={handleRepeatInputChange} required/>
                    <select className="input select multi-input-right" onChange={handleCustomTypeGapNameChange} value={form.repeat.customTypeGapName}>
                      <option value="days">{locale.calendar.form.repeat_custom_option_days}</option>
                      <option value="weeks">{locale.calendar.form.repeat_custom_option_weeks}</option>
                      <option value="months">{locale.calendar.form.repeat_custom_option_months}</option>
                    </select>
                  </span>
                </label>
                {form.repeat.gapError && <div className="reminder-form-input-message">{locale.calendar.form.invalid_number_message}</div>}
              </div>
            ) : form.repeat.type === "weekday" ? (
              <div className="reminder-form-setting reminder-form-weeekdays">
                {form.repeat.weekdays.static.map((selected, index) => (
                  <label className="checkbox-container reminder-form-weekday" key={index}>
                    <input type="checkbox" className="sr-only checkbox-input"
                      onChange={event => handleWeekdaySelection(event, index)} checked={selected || index === form.repeat?.weekdays.current}
                      disabled={index === form.repeat?.weekdays.current}/>
                    <div className="reminder-form-weekday-content">{weekdayNames[index]}</div>
                  </label>
                ))}
              </div>
            ) : null}
            <div className="reminder-form-setting reminder-form-column" onChange={handleRadioInputChange}>
              <div>{locale.calendar.form.repeat_end_setting_label}</div>
              <label className="reminder-form-row">
                <input type="radio" className="sr-only radio-input" name="ends"
                  value="never" defaultChecked={form.repeat.ends === "never"}/>
                <div className="radio"></div>
                <span>{locale.calendar.form.repeat_end_setting_never_label}</span>
              </label>
              <div>
                <label className="reminder-form-row">
                  <input type="radio" className="sr-only radio-input" name="ends"
                    value="date" defaultChecked={form.repeat.ends === "date"}/>
                  <div className="radio"></div>
                  <span>{locale.calendar.form.range_on_label}</span>
                  <input type="date" name="enddate" className="input reminder-form-end-date-input" data-modal-keep
                    defaultValue={form.repeat.endDateString}
                    disabled={form.repeat.ends !== "date"} required={form.repeat.ends === "date"}/>
                </label>
                {form.repeat.ends === "date" && form.repeat.dateMessage && (
                  <div className="reminder-form-input-message">{form.repeat.dateMessage}</div>
                )}
              </div>
              <div>
                <label className="reminder-form-row">
                  <input type="radio" className="sr-only radio-input" name="ends"
                    value="occurrences" defaultChecked={form.repeat.ends === "occurrences"}/>
                  <div className="radio"></div>
                  {repeatCount}
                </label>
                {form.repeat.ends === "occurrences" && form.repeat.countError && (
                  <div className="reminder-form-input-message">{locale.calendar.form.invalid_number_message}</div>
                )}
              </div>
            </div>
          </>
        )}
        {form.notify.enabled && form.range.enabled ? (
          <div className="reminder-form-notify-setting">
            <div className="reminder-form-column reminder-form-setting">
              <div>{locale.calendar.form.notify_time_label}</div>
              <div className="reminder-form-row">
                <label>
                  <div className="label-top">{locale.global.hour_s}</div>
                  <div className="select-container">
                    <select className="input select" onChange={handleNotifyTimeChange} value={form.notify.time.hours} name="hours">
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6">6</option>
                      <option value="7">7</option>
                      <option value="8">8</option>
                      <option value="9">9</option>
                      <option value="10">10</option>
                      <option value="11">11</option>
                      <option value="12">12</option>
                    </select>
                  </div>
                </label>
                <label>
                  <div className="label-top">{locale.global.minutes}</div>
                  <div className="select-container">
                    <select className="input select" onChange={handleNotifyTimeChange} value={form.notify.time.minutes} name="minutes">
                      <option value="0">0</option>
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="15">15</option>
                      <option value="20">20</option>
                      <option value="25">25</option>
                      <option value="30">30</option>
                      <option value="35">35</option>
                      <option value="40">40</option>
                      <option value="45">45</option>
                      <option value="50">50</option>
                      <option value="55">55</option>
                    </select>
                  </div>
                </label>
              </div>
            </div>
            {form.notify.message && <div className="reminder-form-input-message">{form.notify.message}</div>}
          </div>
        ): null}
      </div>
      {message ? <Toast message={message} position="bottom" offset="40px" locale={locale} dismiss={dismissMessage}/> : null}
      <div className="container-footer reminder-form-btns">
        <button type="button" className="btn text-btn" onClick={hide}>{locale.global.cancel}</button>
        <button className="btn">{form.updating ? locale.global.update : locale.global.create}</button>
      </div>
    </form>
  );
}
