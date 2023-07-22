function setPageTitle(title) {
  document.title = `${title || "New Tab"} | Initium`;
}

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

function findFocusableElements(container = document, excludeDropdown = false) {
  const elements = Array.from(container.querySelectorAll("button:not(:disabled), input:not(:disabled), a[href], [tabindex]"));

  if (excludeDropdown) {
    return elements.filter(element => !element.closest(".dropdown"));
  }
  return elements;
}

function findRelativeFocusableElement(element, direction) {
  const elements = findFocusableElements();
  const index = elements.indexOf(element);
  return elements[index + direction];
}

function formatBytes(bytes) {
  const kb = bytes / 1024;

  return kb % 1 === 0 ? kb : kb.toFixed(2);
}

function generateNoise(amount, opacity) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  const size = 128;
  const imageData = ctx.createImageData(size, size);
  const length = imageData.data.length;

  canvas.width = size;
  canvas.height = size;

  for (let i = 0; i < length; i += 4) {
    if (Math.random() < amount) {
      imageData.data[i] = 255;
      imageData.data[i + 1] = 255;
      imageData.data[i + 2] = 255;
      imageData.data[i + 3] = Math.round(255 * opacity);
    }
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/png");
}

export {
  setPageTitle,
  dispatchCustomEvent,
  delay,
  getRandomString,
  getRandomHslColor,
  getRandomHexColor,
  findFocusableElements,
  findRelativeFocusableElement,
  formatBytes,
  generateNoise
};
