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
  id: string,
  title: string,
  url: string,
  description: string,
  newEntryCount: number,
  entries: Entry[]
  updated?: string,
  image?: string,
  fetching?: boolean,
  updatingTitle?: boolean,
  message?: string
}

export type FailedFeedType = FeedType & {
  index: number
}

export type Feeds = {
  active: FeedType[],
  inactive: FeedType[],
  failed: FailedFeedType[]
}

export type Nav = {
  activeIndex: number,
  shift: number,
  animateLeft?: boolean,
  animateRight?: boolean
}
