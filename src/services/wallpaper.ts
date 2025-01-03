import type { UseStore } from "idb-keyval";
import type { AppearanceSettings } from "types/settings";
import { dispatchCustomEvent, getLocalStorageItem } from "../utils";
import { getSetting, setSetting } from "./settings";

type UnsplashInfo = {
  cacheDate?: number
  url: string
  name: string
  username: string
}

type BingInfo = {
  cacheDate?: number
  url: string,
  endDate: number,
  copyright: string,
  copyrightLink: string
}

type WallpaperInfo = UnsplashInfo | BingInfo | null;

type DownscaledWallpaper = {
  id: string
  dataURL: string
  x?: number
  y?: number
}

const downscaledWallpaper = getLocalStorageItem<DownscaledWallpaper>("downscaled-wallpaper");
let wallpaperInfo = getLocalStorageItem<WallpaperInfo>("wallpaper-info");

function fetchDailyWallpaperInfo(provider: "unsplash" | "bing"): Promise<WallpaperInfo> {
  return fetch(`${process.env.SERVER_URL}/wallpaper?p=${provider}`).then(res => res.json());
}

async function cacheDailyWallpaperInfo(): Promise<WallpaperInfo | undefined> {
  const { wallpaper } = getSetting("appearance") as AppearanceSettings;
  const provider = wallpaper.provider ?? "unsplash";
  const info = await fetchDailyWallpaperInfo(provider);

  if (info) {
    info.cacheDate = Date.now();

    if (provider === "unsplash") {
      info.url = buildUnsplashImageUrl(info.url);
    }

    if (wallpaperInfo?.url === info.url) {
      return info;
    }
    setTimeout(() => {
      cacheImage(info.url);
      cacheDownscaledWallpaper({ url: info.url });
      resetIDBStore();
      localStorage.setItem("wallpaper-info", JSON.stringify(info));
    }, 1000);

    return info;
  }
}

async function fetchWallpaperInfo() {
  if (wallpaperInfo) {
    const currentDate = Date.now();
    const cacheDate = wallpaperInfo.cacheDate || 0;

    if (currentDate - cacheDate > 1000 * 60 * 60 * 18 ||
      ((wallpaperInfo as BingInfo).endDate && currentDate > (wallpaperInfo as BingInfo).endDate)) {
      cacheDailyWallpaperInfo();
      return wallpaperInfo;
    }
    cacheImage(wallpaperInfo.url);

    if (!downscaledWallpaper || downscaledWallpaper.id !== wallpaperInfo.url) {
      cacheDownscaledWallpaper({ url: wallpaperInfo.url });
    }
    return wallpaperInfo;
  }
  const info = await cacheDailyWallpaperInfo();

  if (info) {
    wallpaperInfo = info;
    dispatchCustomEvent("wallpaper-info-update", info);
    return info;
  }
}

function cacheImage(url: string) {
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

function buildUnsplashImageUrl(url: string) {
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
  localStorage.removeItem("downscaled-wallpaper");
  deleteServiceWorkerCache();
  dispatchCustomEvent("wallpaper-info-update", null);
}

function deleteServiceWorkerCache() {
  caches.keys().then(keys => {
    keys.forEach(key => {
      if (key === "wallpaper-image-cache") {
        caches.delete(key);
      }
    });
  });
}

function setUrlWallpaper(url: string, mimeType: string) {
  setTimeout(() => {
    cacheDownscaledWallpaper({ url, source: "url", mimeType });
    resetWallpaperInfo();
    resetIDBStore();
  }, 1000);
}

function resetIDBWallpaper() {
  setSetting("appearance", {
    ...getSetting("appearance") as AppearanceSettings,
    wallpaper: { provider: "unsplash", url: "" }
  });
  resetIDBStore();
}

async function getIDBWallpaper(id: string): Promise<File> {
  const { createStore, get } = await import("idb-keyval");
  const store = createStore("initium", "wallpaper");
  const image = await get(id, store);

  return image;
}

async function setIDBWallpaper(file: File) {
  const { createStore, set, clear } = await import("idb-keyval");
  let store: UseStore | null = null;

  try {
    store = createStore("initium", "wallpaper");
    await clear(store);
  } catch (e) {
    console.log(e);
    await indexedDB.deleteDatabase("initium");
    store = createStore("initium", "wallpaper");
  }
  await set(file.name, file, store);

  setTimeout(() => {
    cacheDownscaledWallpaper({
      id: file.name,
      mimeType: file.type,
      url: URL.createObjectURL(file)
    });
    resetWallpaperInfo();
  }, 1000);
}

async function resetIDBStore() {
  try {
    indexedDB.deleteDatabase("initium");
  } catch (e) {
    console.log(e);
  }
}

async function cacheDownscaledWallpaper({ url, id = url, source = "", mimeType }: { url: string, id?: string, source?: string, mimeType?: string}) {
  const wallpaper = getLocalStorageItem<DownscaledWallpaper>("downscaled-wallpaper");

  if (wallpaper?.id === id) {
    return;
  }
  const dataURL = await createDownscaledWallpaper({ url, source, mimeType });

  localStorage.setItem("downscaled-wallpaper", JSON.stringify({ id, dataURL }));
}

function getDownscaledImage(image: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  let canvasWidth = image.width / 10;
  let canvasHeight = image.height / 10;

  if (image.width > 3000) {
    canvasWidth /= 2;
    canvasHeight /= 2;
  }
  canvas.width = Math.ceil(canvasWidth);
  canvas.height = Math.ceil(canvasHeight);

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  ctx.filter = "blur(2px) brightness(90%)";
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png", 0.8);
}

function getDownscaledVideo({ url }: { url: string }): Promise<string> {
  return new Promise(resolve => {
    const video = document.createElement("video");

    video.crossOrigin = "anonymous";

    video.addEventListener("seeked", () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;
      let canvasWidth = video.videoWidth / 10;
      let canvasHeight = video.videoHeight / 10;

      if (video.videoWidth > 3000) {
        canvasWidth /= 2;
        canvasHeight /= 2;
      }
      canvas.width = Math.ceil(canvasWidth);
      canvas.height = Math.ceil(canvasHeight);

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = "blur(2px)";
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      resolve(canvas.toDataURL("image/png", 0.8));
    });
    video.src = url;
    // This allows canvas to render the first frame of the video.
    video.currentTime = 0.01;
  });
}

async function createDownscaledWallpaper({ url, source, mimeType }: { url: string, source: string, mimeType?: string }) {
  if (!mimeType || mimeType.startsWith("image")) {
    const image = await preloadImage(url, source);
    return getDownscaledImage(image);
  }
  return getDownscaledVideo({ url });
}

function updateDownscaledWallpaperPosition(x: number, y: number) {
  const wallpaper = getLocalStorageItem<DownscaledWallpaper>("downscaled-wallpaper");

  if (wallpaper) {
    wallpaper.x = x;
    wallpaper.y = y;

    localStorage.setItem("downscaled-wallpaper", JSON.stringify(wallpaper));
  }
}

function preloadImage(url: string, source: string): Promise<HTMLImageElement> {
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
  resetIDBWallpaper,
  updateDownscaledWallpaperPosition
};
