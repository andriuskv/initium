export type Label = {
  id: string,
  name: string,
  color: string,
  flagged?: boolean
}

export type Subtask = {
  id: string,
  rawText: string,
  text?: string,
  optional?: boolean,
  hidden?: boolean,
  removed?: boolean
}

export type TaskRepeatHistory = {
  id: string,
  status: number,
  elapsed?: number,
  dateString?: string
}

export type TaskRepeat = {
  start: number,
  gap: number,
  unit: "day" | "week" | "month",
  limit: number,
  status?: number,
  number: number,
  history?: TaskRepeatHistory[]
}

export type TaskType = {
  id: string,
  rawText: string,
  text?: string,
  subtasks: Subtask[],
  labels: Label[],
  hidden?: boolean,
  creationDate: number,
  completeWithSubtasks?: boolean,
  expirationDate?: number,
  expirationDateString?: string,
  removed?: boolean,
  removedThroughForm?: boolean,
  repeat?: TaskRepeat
}

export type Group = {
  id: string,
  name: string,
  tasks: TaskType[],
  expanded: boolean,
  taskCount: number,
  hiding?: boolean,
  renameEnabled?: boolean,
  state?: "collapsing" | "expanding"
}

export type TaskForm = {
  creationDate?: number,
  updating?: boolean,
  groupIndex?: number,
  taskIndex?: number,
  groupId?: string,
}
