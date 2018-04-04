import { Component, Input, ViewChild } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "top-sites",
    templateUrl: "./top-sites.html"
})
export class TopSites {
    @Input() isVisible: boolean = false;
    @ViewChild("root") root;

    addButtonVisible: boolean = false;
    isNewSitePanelVisible: boolean = false;
    isFetching: boolean = false;
    visibleSiteCount: number = 8;
    topSites: Array<any> = [];
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
        const topSites = JSON.parse(
            localStorage.getItem("most visited") ||
            localStorage.getItem("top sites")
        );
        const { showingOneRow } = this.settingService.getSetting("mainBlock");

        this.settingService.subscribeToChanges(this.changeHandler.bind(this));

        if (showingOneRow) {
            this.visibleSiteCount = 4;
        }

        if (topSites) {
            if (Array.isArray(topSites)) {
                this.topSites = this.resetImages(topSites);
            }
            else {
                this.topSites = this.resetImages(topSites.display);
                this.saveSites();
            }
            this.updateVisibleSites();
        }
        else {
            this.getTopSites();
        }
    }

    changeHandler({ mainBlock }) {
        if (!mainBlock) {
            return;
        }

        if (mainBlock.resetTopSites) {
            this.resetTopSites();
        }
        else if (typeof mainBlock.showingOneRow === "boolean") {
            this.visibleSiteCount = mainBlock.showingOneRow ? 4 : 8;
            this.updateVisibleSites();
        }
    }

    getTopSites() {
        chrome.topSites.get(data => {
            this.topSites = data.map((site: any) => {
                site.image = this.getImage(site.url);
                return site;
            });
            this.updateVisibleSites();
            this.isFetching = false;
        });
    }

    resetTopSites() {
        this.isFetching = true;
        localStorage.removeItem("most visited");
        localStorage.removeItem("top sites");
        this.getTopSites();
    }

    removeSite(event, index) {
        event.preventDefault();

        this.topSites.splice(index, 1);
        this.updateVisibleSites();
        this.saveSites();
    }

    updateVisibleSites() {
        this.root.nativeElement.style.setProperty("--rows", this.visibleSiteCount / 4);
        this.visibleSites = this.topSites.slice(0, this.visibleSiteCount);
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
        this.isNewSitePanelVisible = true;
    }

    hidePanel() {
        this.isNewSitePanelVisible = false;
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

    async addSite(event) {
        event.preventDefault();

        if (!event.target.checkValidity()) {
            return;
        }
        const { elements } = event.target;
        const url = this.appendProtocol(elements.url.value);
        const title = elements.title.value || url;
        const image = elements.thumb.files[0];

        this.topSites.push({
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
        localStorage.setItem("top sites", JSON.stringify(this.topSites));
    }
}
