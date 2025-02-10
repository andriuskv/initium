function setPageTitle(title?: string) {
  document.title = `${title || "New Tab"} | Initium`;
}

function dispatchCustomEvent<T>(eventName: string, data?: T) {
  const event = new CustomEvent(eventName, { detail: data });

  window.dispatchEvent(event);
}

function delay<T>(milliseconds: number): Promise<T> {
  return new Promise(resolve => {
    setTimeout(resolve, milliseconds);
  });
}

function getRandomString(length = 8) {
  return Math.random().toString(32).slice(2, 2 + length);
}

function getRandomHslColor() {
  return `hsl(${Math.floor(Math.random() * 360) + 1}deg 100% 68%)`;
}

function getRandomHexColor() {
  const chars = "6789ABCDEF";
  let color = "#";

  for (let i = 0; i < 6; i++) {
    color += chars[Math.floor(Math.random() * chars.length)];
  }
  return color;
}

function hue2rgb(p: number, q: number, t: number): number {
  if (t < 0) {
    t += 1;
  }

  if (t > 1) {
    t -= 1;
  }

  if (t < 1 / 6) {
    return p + (q - p) * 6 * t;
  }

  if (t < 1 / 2) {
    return q;
  }

  if (t < 2 / 3) {
    return p + (q - p) * (2 / 3 - t) * 6;
  }
  return p;
}

function hslToRgb(h: number, s: number, l: number) {
  let r = 255;
  let g = 255;
  let b = 255;

  if (s === 0) {
    r = g = b = Math.round(l * 255);
  }
  else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

function rgbToHex(r: number, g: number, b: number) {
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function hslToHex(h: number, s: number, l: number) {
  const { r, g, b } = hslToRgb(h, s, l);

  return rgbToHex(r, g, b);
}

function hslStringToHex(string: string) {
  const regex = /hsl\((\d+)deg (\d+)% (\d+)%\)/;
  const match = string.match(regex);

  if (match) {
    const [_, h, s, l] = match;
    return hslToHex(parseInt(h, 10) / 360, parseInt(s, 10) / 100, parseInt(l, 10) / 100);
  }
  throw new Error("Invalid hsl(h, s, l) value");
}

function findFocusableElements(container: HTMLElement | Document = document, excludeDropdown = false) {
  const selector = "button:not(:disabled), input:not(:disabled), a[href], textarea, [tabindex]";
  const elements = Array.from(container.querySelectorAll(selector)) as HTMLElement[];

  if (excludeDropdown) {
    return elements.filter(element => !element.closest(".dropdown"));
  }
  return elements;
}

function findRelativeFocusableElement(element: HTMLElement, direction: number) {
  const elements = findFocusableElements();
  const index = elements.indexOf(element);
  return elements[index + direction];
}

function formatBytes(bytes: number, { excludeUnits = false } = {}) {
  const kb = bytes / 1024;
  const value = kb % 1 === 0 ? kb : kb.toFixed(2);

  if (excludeUnits) {
    return value.toString();
  }
  return `${value} kB`;
}

function generateNoise(amount: number, opacity: number) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
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

function timeout(callback: () => void, duration: number, id?: number) {
  if (id) {
    window.clearTimeout(id);
  }
  id = window.setTimeout(callback, duration);

  return id;
}

function getRandomValueBetweenTwoNumbers(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function replaceLink(text: string, className: string, openInNewTab: boolean) {
  const regex = /(http|https):\/\/[a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}(\/\S*)?/g;
  return text.replace(regex, href => `<a href="${href}" class="${className}"${openInNewTab ? " target=_blank" : ""}>${href}</a>`);
}

function toggleBehindElements(shouldShow, className) {
  const rootElement = document.getElementById("root")!;
  const { parentElement } = document.querySelector(`.${className}`)!;
  const rootElements = rootElement.children as HTMLCollectionOf<HTMLElement>;
  const parentElements = parentElement!.children as HTMLCollectionOf<HTMLElement>;

  if (shouldShow) {
    for (const element of rootElements) {
      element.style.opacity = "";
      element.style.visibility = "";
    }

    for (const element of parentElements) {
      element.style.opacity = "";
      element.style.visibility = "";
    }
  }
  else {
    const excludes = ["wallpaper", "wallpaper-video", "middle-top"];

    for (const element of rootElements) {
      if (!excludes.some(exclude => element.classList.contains(exclude))) {
        element.style.opacity = "0";
        element.style.visibility = "hidden";
      }
    }

    for (const element of parentElements) {
      if (!element.classList.contains(className)) {
        element.style.opacity = "0";
        element.style.visibility = "hidden";
      }
    }
  }
}

function getLocalStorageItem<T>(key: string): T | null {
  const item = localStorage.getItem(key);
  return item ? JSON.parse(item) : null;
}

export {
  setPageTitle,
  dispatchCustomEvent,
  delay,
  getRandomString,
  getRandomHslColor,
  getRandomHexColor,
  hslStringToHex,
  findFocusableElements,
  findRelativeFocusableElement,
  formatBytes,
  generateNoise,
  timeout,
  getRandomValueBetweenTwoNumbers,
  replaceLink,
  toggleBehindElements,
  getLocalStorageItem
};
