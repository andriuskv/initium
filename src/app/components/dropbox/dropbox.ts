import { Component, Output, EventEmitter } from "@angular/core";
import { SettingService } from "../../services/settingService";
import Dropbox from "dropbox";

declare const process;

@Component({
    selector: "dropbox",
    template: `
        <div class="dropbox-container">
            <div class="dropbox-header">
                <button class="btn-icon" (click)="goBack(activeDir)" *ngIf="activeDir.path && activeDir.path !== '/'" title="Back">
                    <svg viewBox="0 0 24 24">
                        <use href="#chevron-left"></use>
                    </svg>
                </button>
                <span class="drobox-path">{{ activeDir.pathForDisplay }}</span>
                <button class="btn-icon" title="Logout" *ngIf="loggedIn" (click)="logout()">
                    <svg viewBox="0 0 24 24">
                        <use href="#cross"></use>
                    </svg>
                </button>
            </div>
            <div class="dropbox-hero" [class.show]="!showItems">
                <svg class="dropbox-hero-icon" viewBox="0 0 24 24">
                    <use href="#dropbox"></use>
                </svg>
                <div class="dropbox-login-btn-container">
                    <button class="btn" *ngIf="showLogin" (click)="login()">Log in</button>
                    <img src="./assets/images/ring.svg" class="dropbox-spinner" *ngIf="fetching" alt="">
                    <p class="dropbox-error-message" *ngIf="errorMessage">{{ errorMessage }}</p>
                </div>
            </div>
            <ul class="dropbox-items" [class.show]="showItems">
                <li class="dropbox-item" *ngFor="let item of activeDir.items" (click)="selectItem(item)">
                    <img src="{{ item.thumbnail }}" class="dropbox-item-thumbnail">
                    <span class="dropbox-item-name">{{ item.name }}</span>
                    <img src="./assets/images/ring.svg" class="dropbox-spinner" *ngIf="item.fetching" alt="">
                    <span class="dropbox-item-error" [class.show]="item.error">Not an image</span>
                </li>
            </ul>
        </div>
    `
})
export class DropboxComp {
    @Output() background = new EventEmitter();
    @Output() setting = new EventEmitter();

    fetching: boolean = true;
    showItems: boolean = false;
    showLogin: boolean = false;
    loggedIn: boolean = false;
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
    errorMessage: string = "";

    constructor(private settingService: SettingService) {
        this.settingService = settingService;
        this.dropboxContents = JSON.parse(localStorage.getItem("dropbox")) || this.rootDir;
    }

    ngOnInit() {
        const token = localStorage.getItem("dropbox token");
        this.dropbox = new Dropbox({ clientId: process.env.DROPBOX_API_KEY });

        if (token) {
            this.init(token);
        }
        else {
            this.fetching = false;
            this.showLogin = true;
        }
    }

    init(token) {
        this.dropbox.setAccessToken(token);
        this.loggedIn = true;
        this.showLogin = false;

        if (this.dropboxContents.cached) {
            this.activeDir = this.dropboxContents;
            this.showItems = true;
            this.fetching = false;
        }
        else {
            this.fetchRootDir();
        }
    }

    login() {
        const authUrl = this.dropbox.getAuthenticationUrl(`${window.location.origin}/receiver.html`);

        window.open(authUrl);
        window.addEventListener("storage", function onStorageChange(event) {
            if (event.key === "dropbox token") {
                this.init(event.newValue);
            }
            window.removeEventListener("storage", onStorageChange);
        }.bind(this));
    }

    logout() {
        this.dropbox.authTokenRevoke();
        this.dropbox.setAccessToken("");
        localStorage.removeItem("dropbox");
        localStorage.removeItem("dropbox token");
        this.dropboxContents = Object.assign(this.rootDir);
        this.activeDir = {};
        this.showItems = false;
        this.loggedIn = false;
        this.fetching = false;
        this.showLogin = true;
    }

    showErrorMessage(message) {
        this.fetching = false;
        this.errorMessage = message;

        setTimeout(() => {
            this.errorMessage = "";
        }, 4000);
    }

    getThumbnail(path) {
        return new Promise(resolve => {
            fetch("https://content.dropboxapi.com/2/files/get_thumbnail", {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${this.dropbox.accessToken}`,
                    "Dropbox-API-Arg": JSON.stringify({ path, size: "w32h32" })
                }
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
        this.showItems = false;
        this.fetching = true;

        this.fetchDir(this.dropboxContents)
        .then(() => {
            this.showItems = true;
            this.fetching = false;
        });
    }

    fetchDir(dir) {
        dir.fetching = true;
        return this.dropbox.filesListFolder({ path: dir.path })
        .then(res => {
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
                    newEntry.thumbnail = "./assets/images/folder-icon.png";
                }
                else {
                    newEntry.thumbnail = "./assets/images/file-icon.png";
                    if (this.isImage(entry.name)) {
                        this.getThumbnail(newEntry.path)
                        .then(thumbnail => {
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
        const setting = {
            background: { url }
        };

        this.setting.emit(setting);
        this.settingService.updateSetting(setting);
    }

    setImageAsBackground(item) {
        if (item.url) {
            this.setBackground(item.url);
            return;
        }
        item.fetching = true;
        this.dropbox.sharingGetSharedLinks({ path: item.path })
        .then(res => {
            const image = res.links.find(link => link.url.includes(item.name));

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
        });
    }

    selectItem(item) {
        if (!item.isDir) {
            if (this.isImage(item.name) && !item.fetching) {
                this.setImageAsBackground(item);
            }
            else {
                item.error = true;
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
