import { Component, Input, ViewChild } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "most-visited",
    templateUrl: "./most-visited.html"
})
export class MostVisited {
    @Input() isVisible: boolean = false;
    @ViewChild("root") root;

    addButtonVisible: boolean = false;
    isNewPagePanelVisible: boolean = false;
    isFetching: boolean = false;
    visibleSiteCount: number = 8;
    mostVisited: Array<any> = [];
    visibleSites: Array<any> = [];
    rootStyles: any = null;

    constructor(
        private settingService: SettingService,
        private domSanitizer: DomSanitizer
    ) {
        this.settingService = settingService;
        this.domSanitizer = domSanitizer;
    }

    ngOnInit() {
        const mostVisited = JSON.parse(localStorage.getItem("most visited"));
        const { showingOneRow } = this.settingService.getSetting("mainBlock");

        this.settingService.subscribeToChanges(this.changeHandler.bind(this));

        if (showingOneRow) {
            this.visibleSiteCount = 4;
        }

        if (mostVisited) {
            if (Array.isArray(mostVisited)) {
                this.mostVisited = this.resetImages(mostVisited);
            }
            else {
                this.mostVisited = this.resetImages(mostVisited.display);
                this.saveSites();
            }
            this.updateVisibleSites();
        }
        else {
            this.getMostVisited();
        }
    }

    changeHandler({ mainBlock }) {
        if (!mainBlock) {
            return;
        }

        if (mainBlock.resetMostVisited) {
            this.resetMostVisited();
        }
        else if (typeof mainBlock.showingOneRow === "boolean") {
            this.visibleSiteCount = mainBlock.showingOneRow ? 4 : 8;
            this.updateVisibleSites();
        }
    }

    getMostVisited() {
        chrome.topSites.get(data => {
            this.mostVisited = data.map((page: any) => {
                page.image = this.getImage(page.url);
                return page;
            });
            this.updateVisibleSites();
            this.isFetching = false;
        });
    }

    resetMostVisited() {
        this.isFetching = true;
        localStorage.removeItem("most visited");
        this.getMostVisited();
    }

    removePage(event, index) {
        event.preventDefault();

        this.mostVisited.splice(index, 1);
        this.updateVisibleSites();
        this.saveSites();
    }

    updateVisibleSites() {
        this.root.nativeElement.style.setProperty("--rows", this.visibleSiteCount / 4);
        this.visibleSites = this.mostVisited.slice(0, this.visibleSiteCount);
        this.addButtonVisible = this.visibleSites.length < this.visibleSiteCount;
    }

    getImage(url) {
        url = new URL(url);

        return this.domSanitizer.bypassSecurityTrustUrl(`chrome://favicon/${url.origin}`);
    }

    resetImages(sites) {
        return sites.map(site => {
            if (!site.uploaded) {
                site.image = this.getImage(site.url);
            }
            return site;
        });
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

        this.mostVisited.push({
            image: image ? await this.processImage(image) : this.getImage(url),
            uploaded: !!image,
            title,
            url
        });
        this.updateVisibleSites();
        this.hidePanel();
        this.saveSites();
        event.target.reset();
    }

    saveSites() {
        localStorage.setItem("most visited", JSON.stringify(this.mostVisited));
    }
}
