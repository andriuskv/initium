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
            this.dbx = new Dropbox({ accessToken: token });
            return;
        }
        this.dbx = new Dropbox({ clientId: process.env.DROPBOX_API_KEY });
        return this.getAccessToken();
    }

    getAccessToken() {
        return new Promise<void>((resolve, reject) => {
            const url = this.dbx.auth.getAuthenticationUrl(`${window.location.origin}/receiver.html`);
            const authWindow: any = window.open(url, "_blank", "width=640,height=480");
            const intervalId = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(intervalId);

                    if (authWindow.token) {
                        this.dbx.auth.setAccessToken(authWindow.token);
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

        response.result.entries.forEach(entry => {
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
            image.src = URL.createObjectURL(response.result.fileBlob);
        }
    }

    async fetchImage({ path, name }) {
        const response = await this.dbx.sharingGetSharedLinks({ path });
        let image = response.result.links.find(link => link.path.endsWith(name));

        if (!image) {
            image = await this.dbx.sharingCreateSharedLinkWithSettings({ path });
        }
        const linkFileResponse = await this.dbx.sharingGetSharedLinkFile({ url: image.url });
        const blob = linkFileResponse.result.fileBlob;
        blob.name = name;

        return blob;
    }

    isImage(name) {
        return /(\.jpe?g|\.png|\.gif|\.bmp)$/i.test(name);
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
