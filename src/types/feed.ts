export type Entry = {
  id: string,
  title: string,
  description: string,
  link: string,
  truncated: boolean,
  newEntry?: boolean,
  date?: string,
  thumbnail?: string
}

export type FeedType = {
  index?: number,
  id: string,
  title: string,
  url: string,
  description: string,
  newEntryCount: number,
  entries: Entry[]
  updated?: string,
  image?: string,
  fetching?: boolean,
  updatingTitle?: boolean
}

export type Feeds = {
  active: FeedType[],
  inactive: FeedType[],
  failed: FeedType[]
}

export type Nav = {
  activeIndex: number,
  shift: number,
  animateLeft?: boolean,
  animateRight?: boolean
}
