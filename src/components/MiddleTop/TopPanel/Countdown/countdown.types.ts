export type Units = "year" | "month" | "day" | "hour" | "minute" | "second";

export type Countdown = {
  id: string,
  title: string,
  isInPast?: boolean,
  willBeInPast?: boolean,
  date?: string,
  dateString: string,
  diff: number,
  view: Units,
  year?: {
    value: number,
    unit: string,
  },
  month?: {
    value: number,
    unit: string,
  },
  day?: {
    value: number,
    unit: string,
  },
  hour?: {
    value: number,
    unit: string,
  },
  minute?: {
    value: number,
    unit: string,
  },
  second?: {
    value: number,
    unit: string,
  }
}
