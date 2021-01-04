import { NgModule, Component, Output, EventEmitter } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { DropboxService } from "../../services/dropboxService";
import { SettingService } from "../../services/settingService";
import { BackgroundService } from "../../services/backgroundService";

@Component({
    selector: "dropbox",
    templateUrl: "./dropbox.html",
    styleUrls: ["./dropbox.scss"]
})
export class Dropbox {
    @Output() sessionEnded = new EventEmitter();

    activeFolder = null;
    dropboxFolder = null;

    constructor(
        private dropboxService: DropboxService,
        private backgroundService: BackgroundService,
        private settingService: SettingService) {}

    async ngOnInit() {
        this.dropboxFolder = this.dropboxService.getDropbox();

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

    async setImageAsBackground(item) {
        const blob = await this.dropboxService.fetchImage(item);

        this.backgroundService.setIDBBackground(blob);
        this.settingService.updateSetting({
            background: {
                type: "blob",
                id: blob.name
            }
        });
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
            item.items.forEach(file => {
                if (file.isImage && !file.thumbnail) {
                    this.dropboxService.fetchThumbnail(file, this.dropboxFolder);
                }
            });
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
}

@NgModule({
    declarations: [Dropbox],
    imports: [BrowserModule]
})
class DropboxModule {}
