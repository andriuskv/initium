export type Site = {
  url: string,
  title: string,
  iconUrl?: string
  local?: boolean
}

export type PersistentSite = {
  id: string,
  url: string,
  title: string,
  iconUrl?: string
}

export type FormType = {
  index?: number,
  updating?: boolean,
  title?: string,
  url?: string
}
