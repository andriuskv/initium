import { Component } from "@angular/core";
import { SettingService } from "../../services/settingService";
import { dispatchCustomEvent } from "../../utils/utils";

@Component({
    selector: "dropbox",
    template: `
        <div class="dropbox-header">
            <button class="btn-secondary btn-secondary-alt"
                *ngIf="activeDir.path && activeDir.path !== '/'"
                (click)="goBack(activeDir)" title="Back">
                <svg viewBox="0 0 24 24">
                    <use href="#chevron-left"></use>
                </svg>
            </button>
            <span class="drobox-path">{{ activeDir.pathForDisplay }}</span>
            <button class="btn-secondary btn-secondary-alt" title="Logout" (click)="logout()">
                <svg viewBox="0 0 24 24">
                    <use href="#cross"></use>
                </svg>
            </button>
        </div>
        <ul class="dropbox-items">
            <li class="dropbox-item" *ngFor="let item of activeDir.items" (click)="selectItem(item)">
                <img src="{{ item.thumbnail }}" *ngIf="item.thumbnail; else elseBlock">
                <ng-template #elseBlock>
                    <svg viewBox="0 0 24 24">
                        <use attr.href="#{{ item.icon }}"></use>
                    </svg>
                </ng-template>
                <span class="dropbox-item-name">{{ item.name }}</span>
                <img src="./assets/images/ring.svg" class="dropbox-spinner" *ngIf="item.fetching" alt="">
                <span class="dropbox-item-error" *ngIf="item.error">Not an image</span>
            </li>
        </ul>
    `
})
export class DropboxComp {
    dropbox: any;
    activeDir: any = {};
    rootDir: object = {
        name: "Root",
        isDir: true,
        path: "",
        pathForDisplay: "/",
        items: []
    };
    dropboxContents: any;

    constructor(private settingService: SettingService) {
        this.settingService = settingService;
        this.dropboxContents = JSON.parse(localStorage.getItem("dropbox")) || this.rootDir;
    }

    ngOnInit() {
        window.addEventListener("dropbox-login", async () => {
            const Dropbox: any = await import("dropbox");
            const token = localStorage.getItem("dropbox token");
            this.dropbox = new Dropbox.Dropbox({ clientId: process.env.DROPBOX_API_KEY });

            if (token) {
                this.init(token);
            }
            else {
                this.login();
            }
        });
    }

    init(token) {
        this.dropbox.setAccessToken(token);

        if (this.dropboxContents.cached) {
            this.activeDir = this.dropboxContents;

            dispatchCustomEvent("dropbox", {
                loggedIn: true
            });
        }
        else {
            this.fetchRootDir();
        }
    }

    login() {
        const authUrl = this.dropbox.getAuthenticationUrl(`${window.location.origin}/receiver.html`);
        const authWindow: any = window.open(authUrl, "_blank", "width=640,height=480");
        const intervalId = setInterval(() => {
            if (authWindow.closed) {
                clearInterval(intervalId);

                if (authWindow.token) {
                    this.init(authWindow.token);
                    localStorage.setItem("dropbox token", authWindow.token);
                }
                else {
                    dispatchCustomEvent("dropbox-window-closed");
                }
            }
        }, 800);
    }

    logout() {
        this.dropbox.authTokenRevoke();
        this.dropbox.setAccessToken("");
        localStorage.removeItem("dropbox");
        localStorage.removeItem("dropbox token");
        this.dropboxContents = this.rootDir;
        this.activeDir = {};

        dispatchCustomEvent("dropbox", {
            loggedIn: false
        });

        this.deleteServiceWorkerCache();
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

    getThumbnail(path) {
        return new Promise(resolve => {
            const headers = new Headers({
                "Authorization": `Bearer ${this.dropbox.accessToken}`,
                "Dropbox-API-Arg": JSON.stringify({ path, size: "w32h32" })
            });

            fetch("https://content.dropboxapi.com/2/files/get_thumbnail", {
                method: "GET",
                headers
            })
            .then(response => response.blob())
            .then(blob => {
                const image = new Image();

                image.onload = () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    canvas.width = image.width;
                    canvas.height = 20;
                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL("image/jpeg", 0.4));
                };
                image.src = window.URL.createObjectURL(blob);
            });
        });
    }

    getDir(items, dirNames) {
        const dir = items.find(item => item.name.toLowerCase() === dirNames[0]);

        if (dirNames.length === 1) {
            return dir;
        }
        dirNames.shift();
        return this.getDir(dir.items, dirNames);
    }

    goBack(currentDir) {
        const dirNames = currentDir.path.split("/").slice(1);

        if (dirNames.length === 1) {
            this.activeDir = this.dropboxContents;
        }
        else {
            dirNames.pop();
            this.activeDir = this.getDir(this.dropboxContents.items, dirNames);
        }
    }

    fetchRootDir() {
        this.fetchDir(this.dropboxContents).then(() => {
            dispatchCustomEvent("dropbox", {
                loggedIn: true
            });
        });
    }

    fetchDir(dir) {
        dir.fetching = true;

        return this.dropbox.filesListFolder({ path: dir.path }).then(res => {
            res.entries.forEach(entry => {
                const newEntry: any = {
                    name: entry.name,
                    isDir: entry[".tag"] === "folder",
                    path: entry.path_lower,
                    pathForDisplay: entry.path_display,
                    fetching: false
                };

                if (newEntry.isDir) {
                    newEntry.cached = false;
                    newEntry.items = [];
                    newEntry.icon = "folder";
                }
                else {
                    newEntry.icon = "file";

                    if (this.isImage(entry.name)) {
                        this.getThumbnail(newEntry.path).then(thumbnail => {
                            newEntry.thumbnail = thumbnail;
                            localStorage.setItem("dropbox", JSON.stringify(this.dropboxContents));
                        });
                    }
                }
                dir.items.push(newEntry);
            });
            this.activeDir = dir;
            dir.cached = true;
            dir.fetching = false;
            localStorage.setItem("dropbox", JSON.stringify(this.dropboxContents));
        })
        .catch(error => {
            console.log(error);
        });
    }

    isImage(name) {
        name = name.toLowerCase();
        return name.endsWith("jpg") || name.endsWith("jpeg") || name.endsWith("png")
            || name.endsWith("gif") || name.endsWith("bmp");
    }

    parseImageUrl(image) {
        const url = image.url.split("");

        // replace dl value from 0 to 1 so that image could be displayed
        url[url.length - 1] = "1";
        return url.join("");
    }

    setBackground(url) {
        this.settingService.updateSetting({
            background: { url }
        });
    }

    setImageAsBackground(item) {
        if (item.url) {
            this.setBackground(item.url);
            return;
        }
        item.fetching = true;

        this.dropbox.sharingGetSharedLinks({ path: item.path }).then(res => {
            const image = res.links.find(link => link.path.includes(item.name));

            if (!image) {
                return this.dropbox.sharingCreateSharedLinkWithSettings({ path: item.path })
                .then(res => this.parseImageUrl(res));
            }
            return this.parseImageUrl(image);
        })
        .then(url => {
            item.url = url;
            item.fetching = false;

            this.setBackground(url);
            localStorage.setItem("dropbox", JSON.stringify(this.dropboxContents));
        })
        .catch(error => {
            console.log(error);
            item.fetching = false;
        });
    }

    selectItem(item) {
        if (!item.isDir) {
            if (this.isImage(item.name) && !item.fetching) {
                this.setImageAsBackground(item);
            }
            else {
                item.error = true;
                item.fetching = false;

                setTimeout(() => {
                    item.error = false;
                }, 800);
            }
            return;
        }

        if (item.cached) {
            this.activeDir = item;
            return;
        }

        if (!item.fetching) {
            this.fetchDir(item);
        }
    }
}
