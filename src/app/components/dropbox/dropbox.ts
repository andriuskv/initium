import { Component, Output, EventEmitter } from "@angular/core";
import { DropboxService } from "../../services/dropboxService";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "dropbox",
    templateUrl: "./dropbox.html",
    styleUrls: ["./dropbox.scss"]
})
export class Dropbox {
    @Output() sessionEnded = new EventEmitter();

    activeFolder: any = null;
    dropboxFolder: any = null;
    subscriber: any = null;

    constructor(
        private dropboxService: DropboxService,
        private settingService: SettingService) {}

    async ngOnInit() {
        this.dropboxFolder = this.dropboxService.getDropbox();
        this.subscriber = this.settingService.subscribeToSettingChanges(this.settingChangeHandler.bind(this));

        try {
            await this.dropboxService.init();

            if (!this.dropboxFolder.cached) {
                await this.dropboxService.fetchFolderItems(this.dropboxFolder);
                this.saveDropbox();
            }
            this.activeFolder = this.dropboxFolder;
        } catch (e) {
            console.log(e);
            this.sessionEnded.emit();
        }
    }

    logout() {
        this.dropboxService.resetDropbox();
        this.sessionEnded.emit();
    }

    getFolder(folder, name) {
        if (folder.items.find(item => item.name === name)) {
            return folder;
        }
        for (const item of folder.items) {
            if (item.isFolder && this.getFolder(item, name)) {
                return item;
            }
        }
    }

    goBack() {
        this.activeFolder = this.getFolder(this.dropboxFolder, this.activeFolder.name);
    }

    setBackground(url) {
        this.settingService.updateSetting({
            background: { url, x: 50, y: 50 }
        });
    }

    async setImageAsBackground(item) {
        if (item.url) {
            this.setBackground(item.url);
            return;
        }
        item.url = await this.dropboxService.fetchImageUrl(item);
        this.setBackground(item.url);
    }

    async selectItem(item) {
        if (item.fetching) {
            return;
        }
        item.fetching = true;

        if (item.isFolder) {
            if (!item.cached) {
                await this.dropboxService.fetchFolderItems(item);
            }
            this.activeFolder = item;
        }
        else if (item.isImage) {
            await this.setImageAsBackground(item);
        }
        else {
            item.error = true;

            setTimeout(() => {
                delete item.error;
            }, 800);
        }
        delete item.fetching;
        this.saveDropbox();
    }

    saveDropbox() {
        this.dropboxService.saveDropbox(this.dropboxFolder);
    }

    settingChangeHandler({ background }) {
        if (background && !background.url.includes("dropbox.com")) {
            this.dropboxService.deleteServiceWorkerCache();
            this.subscriber.unsubscribe();
        }
    }
}
