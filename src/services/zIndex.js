const components = {};
let currentActiveComponent = null;

function getZIndex(name) {
  const index = currentActiveComponent ? currentActiveComponent.index + 1 : 2;
  currentActiveComponent = { name, index };
  components[name] = index;
  return index;
}

function increaseZIndex(name) {
  if (currentActiveComponent?.name === name) {
    return components[name];
  }
  return getZIndex(name);
}

function handleZIndex({ currentTarget }, name) {
  if (currentActiveComponent?.name === name) {
    return;
  }
  const index = getZIndex(name);
  currentTarget.style.setProperty("--z-index", index);
}

export {
  increaseZIndex,
  handleZIndex
};
