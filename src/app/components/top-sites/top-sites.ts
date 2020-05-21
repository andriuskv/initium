import { Component, Input } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "top-sites",
    templateUrl: "./top-sites.html",
    styleUrls: ["./top-sites.scss"]
})
export class TopSites {
    @Input() isVisible = false;

    isFormVisible = false;
    addSiteButtonVisible = false;
    visibleSiteCount = 4;
    topSites = [];
    visibleSites = [];
    editedSite = null;
    formThumbnail = null;

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
        });
    }

    resetTopSites() {
        if (this.isFormVisible) {
            this.hideForm();
        }
        localStorage.removeItem("top sites");
        this.getTopSites();
    }

    removeSite() {
        this.topSites.splice(this.editedSite.index, 1);
        this.updateVisibleSites();
        this.hideForm();
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

    processImage(imageFile) {
        return new Promise(resolve => {
            const reader = new FileReader();

            reader.onloadend = function(event: any) {
                const image = new Image();

                image.onload = function() {
                    const canvas = document.createElement("canvas");
                    let { width, height } = image;
                    const minSize = Math.min(width, height, 96);

                    if (width < height) {
                        height = minSize / image.width * height;
                        width = minSize;
                    }
                    else {
                        width = minSize / image.height * width;
                        height = minSize;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    canvas.getContext("2d").drawImage(image, 0, 0, width, height);
                    resolve(canvas.toDataURL(imageFile.type, 0.72));
                };
                image.src = event.target.result;
            };
            reader.readAsDataURL(imageFile);
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
