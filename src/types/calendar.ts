export type Reminder = {
  id: string,
  creationDate: number,
  day: number,
  month: number,
  year: number,
  range: {
    from?: { hours: number, minutes: number },
    to?: { hours: number, minutes: number },
    text?: string
  },
  repeat?: {
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
      day: number,
    }
    leftoverDays?: number,
    firstWeekday?: 0 | 1,
    weekdays?: {
      dynamic: boolean[]
      static: boolean[]
    }
  },
  notify?: {
    type: "default" | "time",
    time?: { full: number, hours?: number, minutes?: number }
  }
  color: string,
  text: string,
  description?: string
}

export type GoogleReminder = Reminder & {
  type: "google",
  calendarId: string,
  editable: boolean,
  colorId?: string,
  repeat?: Reminder["repeat"] & {
    freq?: "yearly",
    firstWeekday: 0 | 1
  }
}

export type GoogleCalendar = {
  id: string,
  title: string,
  color: string
  canEdit: boolean,
  selected: boolean,
  primary?: boolean
}

export type GoogleUser = {
  email: string
  name: string
  photo: string
}
