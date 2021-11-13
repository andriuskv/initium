function dispatchCustomEvent(eventName, data = null) {
  const event = new CustomEvent(eventName, { detail: data });

  window.dispatchEvent(event);
}

function delay(milliseconds) {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

function getRandomString(length = 8) {
  return Math.random().toString(32).slice(2, 2 + length);
}

function getRandomHslColor() {
  return `hsl(${Math.floor(Math.random() * 360) + 1}deg ${100}% ${68}%)`;
}

function getRandomHexColor() {
  const chars = "6789ABCDEF";
  let color = "#";

  for (let i = 0; i < 6; i++) {
    color += chars[Math.floor(Math.random() * chars.length)];
  }
  return color;
}

function findFocusableElement(element, direction) {
  const elements = [...document.querySelectorAll("button, [tabindex]")];
  const index = elements.indexOf(element);
  return elements[index + direction];
}

function formatBytes(bytes) {
  const kb = bytes / 1024;

  return kb % 1 === 0 ? kb : kb.toFixed(2);
}

export {
  dispatchCustomEvent,
  delay,
  getRandomString,
  getRandomHslColor,
  getRandomHexColor,
  findFocusableElement,
  formatBytes
};
