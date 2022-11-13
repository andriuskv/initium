import { dispatchCustomEvent } from "../utils";

const downscaledWallpaper = JSON.parse(localStorage.getItem("downscaled-wallpaper"));
let wallpaperInfo = JSON.parse(localStorage.getItem("wallpaper-info"));

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
      cacheDownscaledWallpaper({ url: info.url });
      resetIDBStore();
      deleteOldServiceWokerCache();
      localStorage.removeItem("background-info");
      localStorage.setItem("wallpaper-info", JSON.stringify(info));
    }, 1000);
    return info;
  }
}

async function fetchWallpaperInfo() {
  if (wallpaperInfo) {
    if (Date.now() - wallpaperInfo.cacheDate > 1000 * 60 * 60 * 18) {
      cacheUnsplashInfo();
      return wallpaperInfo;
    }
    cacheImage(wallpaperInfo.url);

    if (!downscaledWallpaper || downscaledWallpaper.id !== wallpaperInfo.url) {
      cacheDownscaledWallpaper({ url: wallpaperInfo.url });
    }
    return wallpaperInfo;
  }
  const info = await cacheUnsplashInfo();

  if (info) {
    wallpaperInfo = info;
    dispatchCustomEvent("wallpaper-info-update", info);
    return info;
  }
}

function cacheImage(url) {
  caches.open("wallpaper-image-cache").then(async cache => {
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

function getWallpaperInfo() {
  return wallpaperInfo;
}

function resetWallpaperInfo() {
  wallpaperInfo = null;
  localStorage.removeItem("wallpaper-info");
  deleteServiceWokerCache();
  dispatchCustomEvent("wallpaper-info-update", null);
}

function deleteServiceWokerCache() {
  caches.keys().then(keys => {
    keys.forEach(key => {
      if (key === "wallpaper-image-cache") {
        caches.delete(key);
      }
      else if (key === "background-image-cache") {
        caches.delete(key);
      }
    });
  });
}

function deleteOldServiceWokerCache() {
  caches.keys().then(keys => {
    keys.forEach(key => {
      if (key === "background-image-cache") {
        caches.delete(key);
      }
    });
  });
}

function setUrlWallpaper(url) {
  setTimeout(() => {
    cacheDownscaledWallpaper({ url, source: "url" });
    resetWallpaperInfo();
    resetIDBStore();
  }, 1000);
}

async function getIDBWallpaper(id) {
  const { createStore, get } = await import("idb-keyval");

  try {
    const store = createStore("initium", "wallpaper");
    const image = await get(id, store);

    return image;
  } catch (e) {
    console.log(e);
    const store = createStore("initium", "background");
    const image = await get(id, store);

    await indexedDB.deleteDatabase("initium");

    setIDBWallpaper(image);
    return image;
  }
}

async function setIDBWallpaper(image) {
  const { createStore, set, clear } = await import("idb-keyval");
  let store = null;

  try {
    store = createStore("initium", "wallpaper");
    await clear(store);
  } catch (e) {
    console.log(e);
    await indexedDB.deleteDatabase("initium");
    store = createStore("initium", "wallpaper");
  }
  await set(image.name, image, store);

  setTimeout(() => {
    cacheDownscaledWallpaper({
      id: image.name,
      url: URL.createObjectURL(image)
    });
    resetWallpaperInfo();
  }, 1000);
}

async function resetIDBStore() {
  try {
    const { createStore, clear } = await import("idb-keyval");
    const store = createStore("initium", "wallpaper");

    clear(store);
  } catch (e) {
    console.log(e);
    indexedDB.deleteDatabase("initium");
  }
}

async function cacheDownscaledWallpaper({ url, id = url, source }) {
  const image = await preloadImage(url, source);

  createDownscaledWallpaper({ id, image });
}

function getDownscaledWallpaper(image) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = Math.ceil(image.width / 10);
  canvas.height = Math.ceil(image.height / 10);

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  ctx.filter = "blur(2px) brightness(90%)";
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png", 0.8);
}

function createDownscaledWallpaper({ id, image }) {
  const wallpaper = JSON.parse(localStorage.getItem("downscaled-wallpaper")) || {};

  if (wallpaper.id === id) {
    return;
  }
  const dataURL = getDownscaledWallpaper(image);

  localStorage.setItem("downscaled-wallpaper", JSON.stringify({ id, dataURL }));
}

function updateDownscaledWallpaperPosition(x, y) {
  const wallpaper = JSON.parse(localStorage.getItem("downscaled-wallpaper"));

  wallpaper.x = x;
  wallpaper.y = y;

  localStorage.setItem("downscaled-wallpaper", JSON.stringify(wallpaper));
}

function preloadImage(url, source) {
  return new Promise(resolve => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      resolve(image);
    };

    image.onerror = (e) => {
      console.log(e);

      if (source === "url") {
        localStorage.setItem("downscaled-wallpaper", JSON.stringify({ url }));
      }
      else {
        localStorage.removeItem("downscaled-wallpaper");
      }
    };

    image.src = url;
  });
}

export {
  fetchWallpaperInfo,
  getWallpaperInfo,
  resetWallpaperInfo,
  setUrlWallpaper,
  getIDBWallpaper,
  setIDBWallpaper,
  resetIDBStore,
  updateDownscaledWallpaperPosition
};
