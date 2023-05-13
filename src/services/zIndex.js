let zIndex = 1;

function getIncreasedZIndex() {
  zIndex += 1;
  return zIndex;
}

function handleZIndex({ currentTarget }) {
  const currentZIndex = currentTarget.style.getPropertyValue("--z-index");

  if (currentZIndex < zIndex) {
    zIndex += 1;
    currentTarget.style.setProperty("--z-index", zIndex);
  }
}

export {
  getIncreasedZIndex,
  handleZIndex
};
