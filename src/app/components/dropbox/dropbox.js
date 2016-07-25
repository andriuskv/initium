/* global Dropbox */

import { Component, Output, EventEmitter } from "@angular/core";
import { LocalStorageService } from "services/localStorageService";

@Component({
    selector: "dropbox",
    templateUrl: "app/components/dropbox/dropbox.html"
})
export class DropboxComp {
    @Output() background = new EventEmitter();

    static get parameters() {
        return [[LocalStorageService]];
    }

    constructor(localStorageService) {
        this.storage = localStorageService;
        this.fetching = true;
        this.showItems = false;
        this.showLogin = false;
        this.activeDir = {};
        this.rootDir = {
            name: "Root",
            isDir: true,
            path: "/",
            items: []
        };
        this.dropboxContents = this.storage.get("dropbox") || this.rootDir;
    }

    ngOnInit() {
        if (document.getElementById("js-dropbox")) {
            this.init();
            return;
        }

        const script = document.createElement("script");

        script.setAttribute("src", "js/libs/dropbox.js");
        script.setAttribute("id", "js-dropbox");
        document.getElementsByTagName("body")[0].appendChild(script);
        script.addEventListener("load", () => {
            this.init();
        }, false);
    }

    init() {
        this.client = new Dropbox.Client({ key: "" });
        this.client.authDriver(new Dropbox.AuthDriver.ChromeExtension({
            receiverPath: "receiver.html"
        }));
        this.authenticate();
    }

    login() {
        this.client.authenticate(error => {
            if (error) {
                console.log(error);
                this.client.reset();
                return;
            }
            this.loggedIn = true;
            this.showLogin = false;
            this.fetching = true;
            this.selectItem(this.dropboxContents);
        });
    }

    logout() {
        this.client.signOut();
        this.storage.remove("dropbox");
        this.dropboxContents = Object.assign({}, this.rootDir);
        this.activeDir = {};
        this.showLogin = false;
        this.showItems = false;
        this.loggedIn = false;
        this.fetching = true;

        setTimeout(() => {
            this.fetching = false;
            this.showLogin = true;
        }, 2000);
    }

    authenticate() {
        this.client.authenticate({ interactive: false }, error => {
            if (error) {
                console.log(error);
                return;
            }

            if (this.client.isAuthenticated()) {
                this.loggedIn = true;

                if (this.dropboxContents.cached) {
                    this.activeDir = this.dropboxContents;
                    this.showItems = true;
                    this.fetching = false;
                }
                else {
                    this.selectItem(this.dropboxContents);
                }
            }
            else {
                this.showLogin = true;
                this.fetching = false;
            }
        });
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
            const href = `https://content.dropboxapi.com/1/thumbnails/auto/${path}`;

            fetch(`${href}?access_token=${this.client._credentials.token}&size=xs`)
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

    getImageUrl(path) {
        const href = `https://api.dropboxapi.com/1/shares/auto/${path}`;
        const url = `${href}?access_token=${this.client._credentials.token}&short_url=false`;

        return fetch(url)
            .then(response => response.json())
            .then(json => {
                if (!json.url) {
                    return;
                }
                const url = json.url.split("");

                // replace dl value from 0 to 1 so that image could be displayed
                url[url.length - 1] = "1";
                return url.join("");
            });
    }

    setImageAsBackground(item) {
        if (item.url) {
            this.background.emit(item.url);
            return;
        }
        this.getImageUrl(item.path)
            .then(url => {
                item.url = url;
                this.background.emit(url);
                this.storage.set("dropbox", this.dropboxContents);
            });
    }

    getDir(items, dirNames) {
        const dir = items.find(item => item.name === dirNames[0]);

        if (dirNames.length === 1) {
            return dir;
        }
        dirNames.splice(0, 1);
        return this.getDir(dir.items, dirNames);
    }

    fetchItem(selectedItem) {
        this.showItems = false;
        this.fetching = true;
        this.client.readdir(selectedItem.path, (error, entries, dir_stat) => {
            if (error) {
                this.showErrorMessage(error.response.error);
                return;
            }
            dir_stat._json.contents.forEach((item, index) => {
                const newItem = {
                    name: entries[index],
                    isDir: item.is_dir,
                    mimeType: item.mime_type,
                    thumbnail: "./resources/images/file-icon.png",
                    path: item.path
                };

                if (newItem.isDir) {
                    newItem.cached = false;
                    newItem.items = [];
                    newItem.thumbnail = "./resources/images/folder-icon.png";
                    selectedItem.items.unshift(newItem);
                }
                else {
                    if (item.thumb_exists) {
                        this.getThumbnail(item.path)
                        .then(thumbnail => {
                            newItem.thumbnail = thumbnail;
                        });
                    }
                    selectedItem.items.push(newItem);
                }
            });
            selectedItem.cached = true;
            this.showItems = true;
            this.fetching = false;
            this.activeDir = selectedItem;

            // give some time to finish fetching thumbnails before saving to localStorage
            setTimeout(() => {
                this.storage.set("dropbox", this.dropboxContents);
            }, 30000);
        });
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

    selectItem(item) {
        if (!item.isDir) {
            if (item.mimeType.startsWith("image")) {
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
        const dirNames = item.path.split("/").slice(1);
        const dir = item.path === "/" ? item : this.getDir(this.dropboxContents.items, dirNames);

        if (dir.cached) {
            this.activeDir = dir;
            return;
        }
        this.fetchItem(dir);
    }
}
