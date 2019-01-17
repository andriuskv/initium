import { Component, Input } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "top-sites",
    templateUrl: "./top-sites.html"
})
export class TopSites {
    @Input() isVisible: boolean = false;

    isFormVisible: boolean = false;
    isFetching: boolean = false;
    addSiteButtonVisible: boolean = false;
    visibleSiteCount: number = 4;
    topSites: Array<any> = [];
    visibleSites: Array<any> = [];
    editedSite: any = null;
    formThumbnail: any = null;

    constructor(private settingService: SettingService, private domSanitizer: DomSanitizer) {}

    ngOnInit() {
        const topSites = JSON.parse(localStorage.getItem("top sites"));
        const { showingOneRow } = this.settingService.getSetting("mainBlock");

        this.settingService.subscribeToSettingChanges(this.changeHandler.bind(this));

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
                site.image = {
                    isFavicon: true,
                    url: this.getFavicon(site.url)
                };
                return site;
            });
            this.updateVisibleSites();
            this.isFetching = false;
        });
    }

    resetTopSites() {
        if (this.isFormVisible) {
            this.hideForm();
        }
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
        this.visibleSites = this.topSites.slice(0, this.visibleSiteCount);
        this.addSiteButtonVisible = this.visibleSites.length < this.visibleSiteCount;
    }

    getFavicon(url) {
        const { href } = new URL(url);

        return this.domSanitizer.bypassSecurityTrustUrl(`chrome://favicon/size/16@2x/${href}`);
    }

    resetImages(sites) {
        return sites.map(site => {
            if (site.image.isFavicon) {
                site.image.url = this.getFavicon(site.url);
            }
            return site;
        });
    }

    showForm() {
        this.isFormVisible = true;
    }

    hideForm() {
        this.isFormVisible = false;
        this.editedSite = null;
        this.formThumbnail = null;
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

                    resolve(canvas.toDataURL("image/jpeg", 0.72));
                };
                image.src = event.target.result;
            };
            reader.readAsDataURL(image);
        });
    }

    addSite(event) {
        const { elements } = event.target;
        const url = this.appendProtocol(elements.url.value);
        const title = elements.title.value;

        event.preventDefault();

        if (this.editedSite) {
            this.updateSite(title, url);
        }
        else {
            const image = this.formThumbnail ? this.formThumbnail : {
                isFavicon: true,
                url: this.getFavicon(url)
            };

            this.topSites.push({
                url,
                image,
                title: title || url
            });
        }
        this.updateVisibleSites();
        this.hideForm();
        this.saveSites();
    }

    updateSite(title, url) {
        const { index, image: oldImage, title: oldTitle } = this.editedSite;
        let image = oldImage;

        if (this.formThumbnail && !this.formThumbnail.isFavicon) {
            image = this.formThumbnail;
        }
        else {
            image = {
                isFavicon: true,
                url: this.getFavicon(url)
            };
        }
        this.topSites[index] = {
            url,
            image,
            title: title || oldTitle
        };
    }

    editSite(index) {
        this.editedSite = { ...this.topSites[index], index };
        this.formThumbnail = this.editedSite.image;
        this.showForm();
    }

    removeFormThumbnail() {
        this.formThumbnail = null;
    }

    async handleFileInputChange({ target }) {
        this.formThumbnail = {
            isFavicon: false,
            url: await this.processImage(target.files[0])
        };
        target.value = "";
    }

    saveSites() {
        localStorage.setItem("top sites", JSON.stringify(this.topSites));
    }
}
