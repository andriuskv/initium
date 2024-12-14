export type Notification = {
  text: string,
  id?: string,
  hiding?: boolean,
  iconId?: string,
  title?: string,
  action?: () => void,
  actionTitle?: string
}
