export type Time = {
  hours: string,
  minutes: string,
  seconds: string
};

export type Preset = Time & {
  id: string,
  name: string
}
