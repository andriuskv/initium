import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class BackgroundService {
  subject: Subject<object> = new Subject();
  backgroundInfo = JSON.parse(localStorage.getItem("background-info"));

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
      localStorage.setItem("background-info", JSON.stringify(info));
      return info;
    }
  }

  async fetchBackgroundInfo() {
    if (this.backgroundInfo) {
      if (Date.now() - this.backgroundInfo.cacheDate > 1000 * 60 * 60 * 20) {
        this.cacheUnsplashInfo();
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

  subscribeToChanges(handler) {
    return this.subject.subscribe(handler);
  }
}
