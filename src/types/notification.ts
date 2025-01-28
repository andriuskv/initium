export type Notification = {
  content: string,
  id?: string,
  hiding?: boolean,
  iconId?: string,
  title?: string,
  duration?: number,
  action?: () => void,
  actionTitle?: string
}
