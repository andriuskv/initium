import { Injectable } from "@angular/core";
import { Dropbox } from "dropbox";

@Injectable({
  providedIn: "root"
})
export class DropboxService {
    timeoutId = 0;
    dbx = null;

    init() {
        const token = localStorage.getItem("dropbox token");

        if (token) {
            this.dbx = new Dropbox({ accessToken: token, fetch } as any);
            return;
        }
        this.dbx = new Dropbox({ clientId: process.env.DROPBOX_API_KEY, fetch } as any);
        return this.getAccessToken();
    }

    getAccessToken() {
        return new Promise((resolve, reject) => {
            const url = this.dbx.getAuthenticationUrl(`${window.location.origin}/receiver.html`);
            const authWindow: any = window.open(url, "_blank", "width=640,height=480");
            const intervalId = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(intervalId);

                    if (authWindow.token) {
                        this.dbx.setAccessToken(authWindow.token);
                        localStorage.setItem("dropbox token", authWindow.token);
                        resolve();
                    }
                    else {
                        reject();
                    }
                }
            }, 800);
        });
    }

    resetDropbox() {
        this.dbx.authTokenRevoke();
        this.deleteServiceWorkerCache();
        localStorage.removeItem("dropbox token");
        localStorage.removeItem("dropbox");
    }

    async fetchFolderItems(folder) {
        const response = await this.dbx.filesListFolder({ path: folder.path });

        response.entries.forEach(entry => {
            const item: any = {
                name: entry.name,
                path: entry.path_lower
            };

            if (entry[".tag"] === "folder") {
                Object.assign(item, {
                    isFolder: true,
                    items: [],
                    icon: "folder",
                    pathForDisplay: entry.path_display
                });
            }
            else {
                item.icon = "file";

                if (this.isImage(entry.name)) {
                    item.isImage = true;
                }
            }
            folder.items.push(item);
        });
        folder.cached = true;
    }

    async fetchThumbnail(entry, folder) {
        const response = await this.dbx.filesGetThumbnail({
            path: entry.path,
            size: "w32h32"
        });

        if (response) {
            const image = new Image();

            image.onload = () => {
                const canvas = document.createElement("canvas");
                const ctx = canvas.getContext("2d");

                canvas.width = image.width;
                canvas.height = 20;
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                entry.thumbnail = canvas.toDataURL("image/jpeg", 0.4);
                delete entry.icon;

                window.clearTimeout(this.timeoutId);
                this.timeoutId = window.setTimeout(() => {
                    this.saveDropbox(folder);
                }, 400);
            };
            image.src = window.URL.createObjectURL(response.fileBlob);
        }
    }

    async fetchImageUrl({ path, name }) {
        const response = await this.dbx.sharingGetSharedLinks({ path });
        let image = response.links.find(link => link.path.endsWith(name));

        if (!image) {
            image = await this.dbx.sharingCreateSharedLinkWithSettings({ path });
        }
        return this.makeImageDisplayable(image.url);
    }

    isImage(name) {
        return /(\.jpe?g|\.png|\.gif|\.bmp)$/i.test(name);
    }

    makeImageDisplayable(url) {
        return url.replace(/0$/, "1");
    }

    getDropbox() {
        return JSON.parse(localStorage.getItem("dropbox")) || {
            isFolder: true,
            path: "",
            pathForDisplay: "/",
            items: []
        };
    }

    saveDropbox(folder) {
        localStorage.setItem("dropbox", JSON.stringify(folder));
    }

    deleteServiceWorkerCache() {
        caches.keys().then(keys => {
            keys.forEach(key => {
                if (key.startsWith("dropbox")) {
                    caches.delete(key);
                }
            });
        });
    }
}
