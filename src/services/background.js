import { dispatchCustomEvent } from "../utils";

const downscaledBackground = JSON.parse(localStorage.getItem("downscaled-background"));
let backgroundInfo = JSON.parse(localStorage.getItem("background-info"));

async function fetchUnsplashInfo() {
  try {
    const apiUrl = "https://api.unsplash.com/photos/random";
    const key = process.env.UNSPLASH_KEY;
    const json = await fetch(`${apiUrl}?collections=825407&client_id=${key}`).then(res => res.json());

    return {
      url: buildImageUrl(json.urls.raw),
      cacheDate: Date.now(),
      name: json.user.name,
      username: json.user.username
    };
  } catch (e) {
    console.log(e);
  }
}

async function cacheUnsplashInfo() {
  const info = await fetchUnsplashInfo();

  if (info) {
    setTimeout(() => {
      cacheImage(info.url);
      cacheDownscaledBackground({ url: info.url });
      localStorage.setItem("background-info", JSON.stringify(info));
    }, 1000);
    return info;
  }
}

async function fetchBackgroundInfo() {
  if (backgroundInfo) {
    if (Date.now() - backgroundInfo.cacheDate > 1000 * 60 * 60 * 18) {
      cacheUnsplashInfo();
      return backgroundInfo;
    }
    cacheImage(backgroundInfo.url);

    if (!downscaledBackground || downscaledBackground.id !== backgroundInfo.url) {
      cacheDownscaledBackground({ url: backgroundInfo.url });
    }
    return backgroundInfo;
  }
  const info = await cacheUnsplashInfo();

  if (info) {
    backgroundInfo = info;
    dispatchCustomEvent("background-info-update", info);
    resetIDBStore();
    return info;
  }
}

function cacheImage(url) {
  caches.open("background-image-cache").then(async cache => {
    const matchedResponse = await cache.match(url);

    if (matchedResponse) {
      return;
    }
    await cache.add(url);

    const responses = await cache.keys();

    for (const response of responses) {
      if (response.url !== url) {
        cache.delete(response.url);
      }
    }
  });
}

function buildImageUrl(url) {
  const { width, height } = screen;
  const dpi = window.devicePixelRatio;
  const crop = "edges";
  const fit = "crop";

  return `${url}&fit=${fit}&crop=${crop}&auto=format&w=${width}&h=${height}&dpi=${dpi}&q=90`;
}

function getBackgroundInfo() {
  return backgroundInfo;
}

function resetBackgroundInfo() {
  backgroundInfo = null;
  localStorage.removeItem("background-info");
  deleteServiceWokerCache();
  dispatchCustomEvent("background-info-update", null);
}

function deleteServiceWokerCache() {
  caches.keys().then(keys => {
    keys.forEach(key => {
      if (key === "background-image-cache") {
        caches.delete(key);
      }
    });
  });
}

function setUrlBackground(url) {
  setTimeout(() => {
    cacheDownscaledBackground({ url });
    resetBackgroundInfo();
    resetIDBStore();
  }, 1000);
}

async function getIDBBackground(id) {
  const { createStore, get } = await import("idb-keyval");
  const store = createStore("initium", "background");

  return get(id, store);
}

async function setIDBBackground(image) {
  const { createStore, set, clear } = await import("idb-keyval");
  const store = createStore("initium", "background");

  await clear(store);
  await set(image.name, image, store);

  setTimeout(() => {
    cacheDownscaledBackground({
      id: image.name,
      url: URL.createObjectURL(image)
    });
    resetBackgroundInfo();
  }, 1000);
}

async function resetIDBStore() {
  const { createStore, clear } = await import("idb-keyval");
  const store = createStore("initium", "background");

  clear(store);
}

async function cacheDownscaledBackground({ url, id = url }) {
  const image = await preloadBackground(url);

  createDownscaledBackground({ id, image });
}

function getDownscaledBackground(image) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = Math.ceil(image.width / 10);
  canvas.height = Math.ceil(image.height / 10);

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  ctx.filter = "blur(2px) brightness(90%)";
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png", 0.8);
}

function createDownscaledBackground({ id, image }) {
  const background = JSON.parse(localStorage.getItem("downscaled-background")) || {};

  if (background.id === id) {
    return;
  }
  const dataURL = getDownscaledBackground(image);

  localStorage.setItem("downscaled-background", JSON.stringify({ id, dataURL }));
}

function updateDownscaledBackgroundPosition(x, y) {
  const background = JSON.parse(localStorage.getItem("downscaled-background"));

  background.x = x;
  background.y = y;

  localStorage.setItem("downscaled-background", JSON.stringify(background));
}

function preloadBackground(url) {
  return new Promise(resolve => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      resolve(image);
    };
    image.src = url;
  });
}

export {
  fetchBackgroundInfo,
  getBackgroundInfo,
  setUrlBackground,
  getIDBBackground,
  setIDBBackground,
  updateDownscaledBackgroundPosition
};
