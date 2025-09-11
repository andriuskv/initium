type Item = {
  id: string,
  title: string,
  iconId: string,
  disabled?: boolean,
  rendered?: boolean,
  visible?: boolean,
  revealed?: boolean,
  moved?: boolean,
  x?: number,
  y?: number,
  indicatorVisible?: boolean
  attrs?: { [key: string]: string | boolean }
}
type Items = Record<string, Item>;

export type { Item, Items };
