import { Component, Output, EventEmitter } from "@angular/core";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "dropbox",
    templateUrl: "./dropbox.html"
})
export class Dropbox {
    @Output() sessionEnded = new EventEmitter();

    dropbox: any;
    activeDir: any = null;
    rootDir: object = {
        name: "Root",
        isDir: true,
        path: "",
        pathForDisplay: "/",
        items: []
    };
    dropboxContents: any = JSON.parse(localStorage.getItem("dropbox")) || this.rootDir;

    constructor(private settingService: SettingService) {}

    async ngOnInit() {
        const { Dropbox }: any = await import("dropbox");
        const token = localStorage.getItem("dropbox token");
        this.dropbox = new Dropbox({ clientId: process.env.DROPBOX_API_KEY, fetch });

        if (token) {
            this.init(token);
        }
        else {
            this.login();
        }
    }

    init(token) {
        this.dropbox.setAccessToken(token);

        if (this.dropboxContents.cached) {
            this.activeDir = this.dropboxContents;
        }
        else {
            this.fetchDir(this.dropboxContents);
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
                    this.sessionEnded.emit();
                }
            }
        }, 800);
    }

    logout() {
        this.dropbox.authTokenRevoke();
        this.dropbox.setAccessToken("");
        localStorage.removeItem("dropbox");
        localStorage.removeItem("dropbox token");

        this.sessionEnded.emit();

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

    goBack() {
        const dirNames = this.activeDir.path.split("/").slice(1);

        if (dirNames.length === 1) {
            this.activeDir = this.dropboxContents;
        }
        else {
            dirNames.pop();
            this.activeDir = this.getDir(this.dropboxContents.items, dirNames);
        }
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
                            this.saveDropbox();
                        });
                    }
                }
                dir.items.push(newEntry);
            });
            this.activeDir = dir;
            dir.cached = true;
            dir.fetching = false;
            this.saveDropbox();
        })
        .catch(error => {
            console.log(error);
        });
    }

    isImage(name) {
        return /(\.jpe?g|\.png|\.gif|\.bmp)$/i.test(name);
    }

    makeImageDisplayable(image) {
        return image.url.replace(/0$/, "1");
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

            if (image) {
                return this.makeImageDisplayable(image);
            }
            return this.dropbox.sharingCreateSharedLinkWithSettings({ path: item.path })
                .then(this.makeImageDisplayable);
        })
        .then(url => {
            item.url = url;
            item.fetching = false;

            this.setBackground(url);
            this.saveDropbox();
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

    saveDropbox() {
        localStorage.setItem("dropbox", JSON.stringify(this.dropboxContents));
    }
}
