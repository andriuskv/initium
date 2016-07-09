/* global chrome */

import { Component, Input } from "@angular/core";
import { DomSanitizationService } from "@angular/platform-browser";
import { LocalStorageService } from "services/localStorageService";

@Component({
    selector: "most-visited",
    templateUrl: "app/components/most-visited/most-visited.html"
})
export class MostVisited {
    @Input() setting;

    static get parameters() {
        return [[DomSanitizationService], [LocalStorageService]];
    }

    constructor(domSanitizationService, localStorageService) {
        this.sanitizer = domSanitizationService;
        this.storage = localStorageService;
        this.mostVisited = {};
        this.newPage = {};
        this.hasBackup = true;
    }

    ngOnInit() {
        this.loadMostVisited();
    }

    ngOnChanges(changes) {
        if (changes.setting.currentValue) {
            this.resetMostVisited();
        }
    }

    getMostVisited() {
        chrome.topSites.get(data => {
            this.mostVisited = {
                display: data.slice(0, 8),
                backup: data.slice(8)
            };
            this.addImages(this.mostVisited.display);
            this.checkBackup();
        });
    }

    loadMostVisited() {
        const mostVisited = this.storage.get("most visited");

        if (mostVisited) {
            this.mostVisited = mostVisited;
            this.checkBackup();
            return;
        }
        this.getMostVisited();
    }

    resetMostVisited() {
        this.storage.remove("most visited");
        this.getMostVisited();
    }

    removePage(index) {
        if (this.mostVisited.backup.length) {
            const [page] = this.mostVisited.backup.splice(0, 1);

            page.image = this.getImage(page.url);
            this.mostVisited.display.splice(index, 1, page);
        }
        else {
            this.mostVisited.display.splice(index, 1);
        }
        this.checkBackup();
        this.storage.set("most visited", this.mostVisited);
    }

    checkBackup() {
        this.hasBackup = this.mostVisited.display.length === 8;
    }

    getImage(url) {
        const a = document.createElement("a");

        a.href = url;

        return this.sanitizer.bypassSecurityTrustUrl(`chrome://favicon/${a.protocol}//${a.hostname}${a.pathname}`);
    }

    addImages(pages) {
        pages.forEach(page => {
            page.image = this.getImage(page.url);
        });
    }

    showNewThumbWindow() {
        this.newThumbWindowVisible = true;
    }

    hideNewThumbWindow() {
        this.newThumbWindowVisible = false;
    }

    checkIfSafeUrl(url) {
        const isHttp = url.includes("http://");
        const isHttps = url.includes("https://");
        const includesWWW = url.includes("www.");

        if (!isHttp && !isHttps && !includesWWW) {
            return `http://www.${url}`;
        }
        if (!isHttp && !isHttps && includesWWW) {
            return `http://${url}`;
        }
        if (isHttp || isHttps) {
            if (includesWWW) {
                return url;
            }

            const index = url.indexOf("://") + 3;

            return `${url.substr(0, index)}www.${url.substr(index)}`;
        }
    }

    processImage(image) {
        return new Promise(resolve => {
            const reader = new FileReader();

            reader.onloadend = function(event) {
                const image = new Image();

                image.onload = function() {
                    const canvas = document.createElement("canvas");
                    const width = 118;
                    const height = 80;

                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext("2d").drawImage(image, 0, 0, width, height);

                    resolve(canvas.toDataURL("image/jpeg"));
                };
                image.src = event.target.result;
            };
            reader.readAsDataURL(image);
        });
    }

    addPage(fileInput) {
        const title = this.newPage.title;
        const url = this.checkIfSafeUrl(this.newPage.url);
        const image = fileInput.files[0];

        fileInput.value = "";
        this.newPage = {};
        if (image) {
            this.processImage(image)
            .then(processedImage => {
                this.mostVisited.display.push({
                    image: processedImage,
                    uploaded: true,
                    title,
                    url
                });
            });
        }
        else {
            this.mostVisited.display.push({
                image: this.getImage(url),
                title,
                url
            });
        }
        this.checkBackup();
        this.hideNewThumbWindow();
        this.storage.set("most visited", this.mostVisited);
    }
}
