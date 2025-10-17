export type Tab = {
  id: string,
  title: string,
  iconId: string,
  disabled?: boolean,
  renderPending?: boolean,
  expandable?: boolean,
  indicatorVisible?: boolean,
  delay?: number,
  firstRender?: boolean
}

export type Tabs = { [key: string]: Tab };
