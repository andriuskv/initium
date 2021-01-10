import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class BackgroundService {
  subject: Subject<object> = new Subject();
  backgroundInfo = JSON.parse(localStorage.getItem("background-info"));
  downscaledBackground = localStorage.getItem("downscaled-background");

  async fetchUnsplashInfo() {
    try {
      const apiUrl = "https://api.unsplash.com/photos/random";
      const key = process.env.UNSPLASH_KEY;
      const json = await fetch(`${apiUrl}?collections=825407&client_id=${key}`).then(res => res.json());

      return {
        url: this.buildImageUrl(json.urls.raw),
        cacheDate: Date.now(),
        name: json.user.name,
        username: json.user.username
      }
    } catch (e) {
      console.log(e);
    }
  }

  async cacheUnsplashInfo() {
    const info = await this.fetchUnsplashInfo();

    if (info) {
      this.cacheImage(info.url);
      this.cacheDownscaledBackground(info.url);
      localStorage.setItem("background-info", JSON.stringify(info));
      return info;
    }
  }

  async fetchBackgroundInfo() {
    if (this.backgroundInfo) {
      if (Date.now() - this.backgroundInfo.cacheDate > 1000 * 60 * 60 * 20) {
        this.cacheUnsplashInfo();
      }
      else if (!this.downscaledBackground) {
        this.cacheImage(this.backgroundInfo.url);
        this.cacheDownscaledBackground(this.backgroundInfo.url);
      }
      return this.backgroundInfo;
    }
    const info = await this.cacheUnsplashInfo();

    if (info) {
      this.backgroundInfo = info;
      this.subject.next(info);
      return info;
    }
  }

  cacheImage(url) {
    caches.open("background-image-cache").then(cache => {
      cache.add(url);
      cache.keys().then(responses => {
        responses.forEach(response => {
          if (response.url !== url) {
            cache.delete(response.url);
          }
        });
      });
    });
  }

  buildImageUrl(url) {
    const { width, height } = screen;
    const dpi = window.devicePixelRatio;
    const crop = "edges";
    const fit = "crop";

    return `${url}&fit=${fit}&crop=${crop}&auto=format&w=${width}&h=${height}&dpi=${dpi}`;
  }

  getBackgroundInfo() {
    return this.backgroundInfo;
  }

  resetBackgroundInfo() {
    this.backgroundInfo = null;
    this.subject.next(this.backgroundInfo);
    this.deleteServiceWokerCache();
    localStorage.removeItem("background-info");
  }

  deleteServiceWokerCache() {
    caches.keys().then(keys => {
      keys.forEach(key => {
        if (key === "background-image-cache") {
          caches.delete(key);
        }
      });
    });
  }

  async getIDBBackground(id) {
    const { Store, get } = await import("idb-keyval");
    const store = new Store("initium", "background");

    return get(id, store);
  }

  async setIDBBackground(image) {
    const { Store, set, clear } = await import("idb-keyval");
    const store = new Store("initium", "background");

    clear(store);
    set(image.name, image, store);
  }

  async resetIDBStore() {
    const { Store, clear } = await import("idb-keyval");
    const store = new Store("initium", "background");

    clear(store);
  }

  subscribeToChanges(handler) {
    return this.subject.subscribe(handler);
  }

  async cacheDownscaledBackground(url) {
    const image = await this.preloadBackground(url);

    this.createDownscaledBackground({ id: url, image });
  }

  getDownscaledBackground(image) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = Math.ceil(image.width / 10);
    canvas.height = Math.ceil(image.height / 10);

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/png", 0.8);
  }

  createDownscaledBackground({ id, image, x = 50, y = 50 }) {
    const background = JSON.parse(localStorage.getItem("downscaled-background")) || {};

    if (background.id === id) {
      return;
    }
    const dataURL = this.getDownscaledBackground(image);

    localStorage.setItem("downscaled-background", JSON.stringify({ id, x, y, dataURL }));
  }

  updateDownscaledBackgroundPosition(x, y) {
    const background = JSON.parse(localStorage.getItem("downscaled-background"));

    background.x = x;
    background.y = y;

    localStorage.setItem("downscaled-background", JSON.stringify(background));
  }

  preloadBackground(url) {
    return new Promise(resolve => {
      const image = new Image();
      image.crossOrigin = "anonymous";

      image.onload = () => {
        resolve(image);
      };
      image.src = url;
    });
  }
}
