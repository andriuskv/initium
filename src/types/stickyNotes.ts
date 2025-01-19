export type Note = {
  index?: number,
  action?: string,
  id?: string,
  title: string,
  content: string,
  titleDisplayString?: string,
  contentDisplayString?: string
  discarding?: boolean,
  color?: string,
  backgroundColor: string,
  x: number;
  y: number;
  tilt: number;
  scale?: number,
  textScale?: number,
  textStyle?: {
    index: number,
    color: number[],
    opacity: number,
    string: string
  }
}

export type FormType = Note & {
  id?: string,
  index?: number,
  readyToShow?: boolean,
  action: "create" | "edit"
}
