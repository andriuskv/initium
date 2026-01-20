export type Notification = {
  id: string,
  type?: string,
  left?: number,
  hiding?: boolean,
  iconId?: string,
  title?: string,
  titleId?: string,
  content?: string,
  contentId?: string,
  duration?: number,
  action?: () => void,
  actionTitle?: string,
  actionTitleId?: string,
  dismissTitle?: string
}
