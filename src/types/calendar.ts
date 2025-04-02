export type DDate = {
  year: number,
  month: number,
  day: number
}

export type ReminderRepeat = {
  type: "custom" | "week" | "month" | "weekday" | "day",
  customTypeGapName: "days" | "weeks" | "months",
  year: number,
  month: number,
  day: number,
  gap: number,
  count: number,
  tooltip: string,
  endDate?: {
    year: number,
    month: number,
    day: number
  },
  leftoverDays?: number,
  firstWeekday?: 0 | 1,
  weekdays?: {
    dynamic: boolean[]
    static: boolean[]
  }
}

export type Reminder = {
  id: string,
  type: string,
  creationDate: number,
  dateString?: string,
  year: number,
  month: number,
  day: number,
  range: {
    from?: { hours: number, minutes: number },
    to?: { hours: number, minutes: number },
    text?: string
  },
  repeat?: ReminderRepeat,
  nextRepeat?: {
    year: number,
    month: number,
    day: number,
    repeats: number,
    gapIndex: number,
    gaps?: number[],
    leftoverDays?: number,
    done?: boolean
  }
  notify?: {
    type: "default" | "time",
    time?: { full: number, hours?: number, minutes?: number }
  }
  removing?: boolean,
  editable: boolean,
  color: string,
  text: string,
  description?: string
  descriptionRaw?: string
}

export type GoogleReminder = Reminder & {
  type: "google",
  calendarId: string,
  colorId?: string,
  meet?: {
    iconUri: string,
    label: string,
    uri: string
  }
  repeat?: Reminder["repeat"] & {
    freq?: "yearly",
    firstWeekday: 0 | 1
  }
}

export type Day = {
  isCurrentDay?: boolean,
  id: string,
  year: number,
  month: number,
  day: number,
  weekdayName?: string,
  dateString: string,
  reminders: (Reminder | GoogleReminder)[]
}

export type Month = {
  isCurrentMonth?: boolean,
  firstDayIndex: number,
  name: string,
  dateString: string,
  days: Day[]
}

export type CalendarType = { [key: string]: Month[] }

export type GoogleCalendar = {
  id: string,
  title: string,
  color: string
  canEdit: boolean,
  selected: boolean,
  primary?: boolean,
  fetching?: boolean
}

export type GoogleUser = {
  email: string
  name: string
  photo: string
}
