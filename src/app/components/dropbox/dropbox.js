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
        this.fetching = false;
        this.showLogin = false;
        this.dropbox = this.storage.get("dropbox") || {};
        this.showHero = !this.dropbox.images;
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
            this.showFolderInput = !this.showLogin && !this.dropbox.imageLocation;
        });
    }

    logout() {
        this.client.signOut();
        this.storage.remove("dropbox");

        this.dropbox = {};
        this.showHero = true;
        this.showLogin = false;
        this.showFolderInput = false;
        this.showNames = false;
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

                if (!this.dropbox.imageLocation) {
                    this.showFolderInput = true;
                    return;
                }

                if (this.dropbox.images && this.dropbox.images.length) {
                    this.showNames = true;
                }
            }
            else {
                this.showLogin = true;
            }
        });
    }

    showErrorMessage(message) {
        this.fetching = false;
        this.errorMessage = message;

        setTimeout(() => {
            this.errorMessage = "";
            this.showFolderInput = true;
        }, 4000);
    }

    getThumbnail(file, index) {
        if (!file.is_dir && file.thumb_exists) {
            const href = `https://content.dropboxapi.com/1/thumbnails/auto/${file.path}`;

            fetch(`${href}?access_token=${this.client._credentials.token}&size=xs`)
            .then(response => response.blob())
            .then(blob => {
                const image = new Image();

                image.addEventListener("load", () => {
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");

                    canvas.width = image.width;
                    canvas.height = 18;

                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

                    this.dropbox.images[index].thumbnail = canvas.toDataURL("image/jpeg", 0.4);
                });
                image.src = window.URL.createObjectURL(blob);
            });
        }
    }

    getUrl(file, index) {
        if (!file.is_dir && file.mime_type.includes("image")) {
            const href = `https://api.dropboxapi.com/1/shares/auto/${file.path}`;
            const url = `${href}?access_token=${this.client._credentials.token}&short_url=false`;

            fetch(url).then(response => response.json())
            .then(json => {
                if (!json.url) {
                    return;
                }

                const url = json.url.split("");

                url[url.length - 1] = "1";

                this.dropbox.images[index].url = url.join("");
            });
        }
    }

    fetchImages(event, folderName) {
        if (folderName && (event.which === 1 || event.which === 13)) {
            this.fetching = true;
            this.showFolderInput = false;
            this.dropbox.imageLocation = folderName;
            this.dropbox.images = [];

            this.client.readdir(`/${folderName}`, (error, entries, dir_stat) => {
                if (error) {
                    this.showErrorMessage(error.response.error);
                    return;
                }

                dir_stat._json.contents.splice(200);
                dir_stat._json.contents.forEach((file, index) => {

                    // +2 because folderName is surounded by 2 backslashes
                    this.dropbox.images[index] = {
                        name: file.path.slice(folderName.length + 2)
                    };

                    this.getUrl(file, index);
                    this.getThumbnail(file, index);
                });
                this.fetching = false;
                this.showHero = false;
                this.showNames = true;

                setTimeout(() => {
                    this.storage.set("dropbox", this.dropbox);
                }, 60000);
            });
        }
    }

    setImageAsBackground(url) {
        this.background.emit(url);
    }
}
