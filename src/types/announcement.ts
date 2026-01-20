export type Announcement = {
  id: string,
  type: string,
  date: number,
  iconId?: string,
  titleId?: string,
  title?: string,
  content?: string,
  contentId?: string,
  expires: number
  age?: number,
  actionId?: string,
  actionTitleId?: string,
  override?: boolean,
  duration?: number
}
