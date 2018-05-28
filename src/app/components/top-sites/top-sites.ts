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

    isNewSiteFormVisible: boolean = false;
    isFetching: boolean = false;
    visibleSiteCount: number = 4;
    topSites: Array<any> = [];
    visibleSites: Array<any> = [];
    emptySites: undefined[] = [];
    editedSite: any = null;

    constructor(private settingService: SettingService, private domSanitizer: DomSanitizer) {
        this.settingService = settingService;
        this.domSanitizer = domSanitizer;
    }

    ngOnInit() {
        const topSites = JSON.parse(localStorage.getItem("top sites"));
        const { showingOneRow } = this.settingService.getSetting("mainBlock");

        this.settingService.subscribeToChanges(this.changeHandler.bind(this));

        if (!showingOneRow) {
            this.visibleSiteCount = 8;
        }

        if (Array.isArray(topSites)) {
            this.topSites = this.resetImages(topSites);
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
                site.image = this.getFavicon(site.url);
                return site;
            });
            this.updateVisibleSites();
            this.isFetching = false;
        });
    }

    resetTopSites() {
        this.isFetching = true;
        localStorage.removeItem("top sites");
        this.getTopSites();
    }

    removeSite(index) {
        this.topSites.splice(index, 1);
        this.updateVisibleSites();
        this.saveSites();
    }

    updateVisibleSites() {
        this.root.nativeElement.style.setProperty("--rows", this.visibleSiteCount / 4);
        this.visibleSites = this.topSites.slice(0, this.visibleSiteCount);
        this.emptySites.length = this.visibleSiteCount - this.visibleSites.length;
    }

    getFavicon(url) {
        const { origin } = new URL(url);

        return this.domSanitizer.bypassSecurityTrustUrl(`chrome://favicon/${origin}`);
    }

    resetImages(sites) {
        return sites.map(site => {
            if (typeof site.image === "object") {
                site.image = this.getFavicon(site.url);
            }
            return site;
        });
    }

    showNewSiteForm() {
        this.isNewSiteFormVisible = true;
    }

    hideNewSiteForm() {
        this.isNewSiteFormVisible = false;
    }

    appendProtocol(url) {
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return url;
        }
        return `https://${url}`;
    }

    processImage(image) {
        return new Promise(resolve => {
            const reader = new FileReader();

            reader.onloadend = function(event: any) {
                const image = new Image();

                image.onload = function() {
                    const canvas = document.createElement("canvas");
                    const width = 144;
                    const height = 98;

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
        const { elements } = event.target;
        const url = this.appendProtocol(elements.url.value);
        const title = elements.title.value;
        const [file] = elements.thumb.files;

        event.preventDefault();

        if (this.editedSite) {
            await this.updateSite(title, url, file);
        }
        else {
            this.topSites.push({
                url,
                image: file ? await this.processImage(file) : this.getFavicon(url),
                title: title || url
            });
        }
        this.updateVisibleSites();
        this.hideNewSiteForm();
        this.saveSites();
        event.target.reset();
    }

    async updateSite(title, url, file) {
        const { index, image: oldImage, title: oldTitle, url: oldUrl } = this.editedSite;
        let image = null;

        if (file) {
            image = await this.processImage(file);
        }
        else if (url !== oldUrl || !oldImage) {
            image = this.getFavicon(url);
        }
        this.topSites[index] = {
            url,
            image,
            title: title || oldTitle
        };
        this.editedSite = null;
    }

    editSite(index) {
        this.editedSite = { ...this.topSites[index], index };
        this.showNewSiteForm();
    }

    saveSites() {
        localStorage.setItem("top sites", JSON.stringify(this.topSites));
    }
}
