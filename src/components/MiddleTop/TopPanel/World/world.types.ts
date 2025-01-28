export type Clock = {
  alreadyAdded: boolean,
  id: string,
  timeZone: string,
  city: string,
  country: string,
  diff: number,
  diffString: string
  time?: string
}
