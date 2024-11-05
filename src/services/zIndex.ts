const components: { [key: string]: number } = {};
let currentActiveComponent: { name: string, index: number } | null = null;

function getZIndex(name: string): number {
  const index = currentActiveComponent ? currentActiveComponent.index + 1 : 2;
  currentActiveComponent = { name, index };
  components[name] = index;
  return index;
}

function increaseZIndex(name: string): number {
  if (currentActiveComponent?.name === name) {
    return components[name];
  }
  return getZIndex(name);
}

function handleZIndex({ currentTarget }: MouseEvent, name: string) {
  if (currentActiveComponent?.name === name) {
    return;
  }

  if (currentTarget) {
    const index = getZIndex(name);

    (currentTarget as HTMLElement).style.setProperty("--z-index", index.toString());
  }
}

export {
  increaseZIndex,
  handleZIndex
};
