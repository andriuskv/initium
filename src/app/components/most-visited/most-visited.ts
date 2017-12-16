/* global chrome */

import { Component, Input } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

declare const chrome;

@Component({
    selector: "most-visited",
    templateUrl: "./most-visited.html"
})
export class MostVisited {
    @Input() item;
    @Input() setting;

    hasBackup: boolean = true;
    isNewPagePanelVisible: boolean = false;
    isFetching: boolean = false;
    mostVisited: any = {};

    constructor(private domSanitizer: DomSanitizer) {
        this.domSanitizer = domSanitizer;
    }

    ngOnInit() {
        const mostVisited = JSON.parse(localStorage.getItem("most visited"));

        if (mostVisited) {
            mostVisited.display = mostVisited.display.map(page => {
                if (!page.uploaded) {
                    page.image = this.getImage(page.url);
                }
                return page;
            });
            this.mostVisited = mostVisited;
            this.checkBackup();
            return;
        }
        this.getMostVisited();
    }

    ngOnChanges() {
        if (this.setting && this.setting.resetMostVisited) {
            this.resetMostVisited();
        }
    }

    getMostVisited() {
        chrome.topSites.get(data => {
            this.mostVisited = {
                display: data.slice(0, 8).map(page => {
                    page.image = this.getImage(page.url);
                    return page;
                }),
                backup: data.slice(8)
            };
            this.checkBackup();
            this.isFetching = false;
        });
    }

    resetMostVisited() {
        this.setting = null;
        this.isFetching = true;
        localStorage.removeItem("most visited");
        this.getMostVisited();
    }

    removePage(event, index) {
        event.preventDefault();

        if (this.mostVisited.backup.length) {
            const [page] = this.mostVisited.backup.splice(0, 1);

            page.image = this.getImage(page.url);
            this.mostVisited.display.splice(index, 1, page);
        }
        else {
            this.mostVisited.display.splice(index, 1);
        }
        this.checkBackup();
        localStorage.setItem("most visited", JSON.stringify(this.mostVisited));
    }

    checkBackup() {
        this.hasBackup = this.mostVisited.display.length === 8;
    }

    getImage(url) {
        url = new URL(url);

        return this.domSanitizer.bypassSecurityTrustUrl(`chrome://favicon/${url.origin}`);
    }

    showPanel() {
        this.isNewPagePanelVisible = true;
    }

    hidePanel() {
        this.isNewPagePanelVisible = false;
    }

    appendProtocol(url) {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            return `https://${url}`;
        }
        return url;
    }

    processImage(image) {
        return new Promise(resolve => {
            const reader = new FileReader();

            reader.onloadend = function(event: any) {
                const image = new Image();

                image.onload = function() {
                    const canvas = document.createElement("canvas");
                    const width = 142;
                    const height = 95;

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

    async addPage(event) {
        event.preventDefault();

        if (!event.target.checkValidity()) {
            return;
        }
        const { elements } = event.target;
        const url = this.appendProtocol(elements.url.value);
        const title = elements.title.value || url;
        const image = elements.thumb.files[0];

        this.mostVisited.display.push({
            image: image ? await this.processImage(image) : this.getImage(url),
            uploaded: !!image,
            title,
            url
        });
        localStorage.setItem("most visited", JSON.stringify(this.mostVisited));
        this.checkBackup();
        this.hidePanel();
        event.target.reset();
    }
}
