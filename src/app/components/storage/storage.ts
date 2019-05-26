import { Component } from "@angular/core";

@Component({
    selector: "storage",
    templateUrl: "./storage.html",
    styleUrls: ["./storage.scss"]
})
export class Storage {
    initialized = false;
    items = [{
        name: "tasks",
        fullName: "Tasks"
    },
    {
        name: "notepad",
        fullName: "Notepad"
    },
    {
        name: "feeds",
        fullName: "RSS feed"
    },
    {
        name: "reminders",
        fullName: "Calendar reminders"
    }];
    maxStoragePerItem = chrome.storage.sync.QUOTA_BYTES_PER_ITEM;
    maxStorage = this.items.length * this.maxStoragePerItem;
    maxStorageFormated = this.formatBytes(this.maxStorage);
    usedStorageFormated;
    usedStorage = 0;
    usedStorageInPercent = 0;
    dashoffset = 1000;
    boundStorageChangeHandler = this.handleStorageChange.bind(this);

    ngOnInit() {
        chrome.storage.sync.onChanged.addListener(this.boundStorageChangeHandler);
        this.items.forEach((item, index) => {
            chrome.storage.sync.getBytesInUse(item.name, bytes => {
                this.usedStorage += bytes;
                this.updateItem(item, bytes);

                if (index === this.items.length - 1) {
                    this.updateUsage();
                    this.initialized = true;
                }
            });
        });
    }

    ngOnDestroy() {
        chrome.storage.sync.onChanged.removeListener(this.boundStorageChangeHandler);
    }

    updateItem(item, bytes) {
        Object.assign(item, {
            bytes,
            usageRatio: bytes / this.maxStoragePerItem,
            usedStorage: this.formatBytes(bytes)
        });
    }

    updateUsage() {
        const usageRatio = this.usedStorage / this.maxStorage;
        this.usedStorageInPercent = Math.ceil(usageRatio * 100);
        this.usedStorageFormated = this.formatBytes(this.usedStorage);

        // 1000 = empty circle, 717 = full circle
        this.dashoffset = 1000 - 283 * usageRatio;
    }

    handleStorageChange(storage) {
        const [name] = Object.keys(storage);

        chrome.storage.sync.getBytesInUse(name, bytes => {
            const item = this.items.find(item => item.name === name);
            const byteDiff = bytes - (item as any).bytes;
            this.usedStorage += byteDiff;
            this.updateItem(item, bytes);
            this.updateUsage();
        });
    }

    formatBytes(bytes) {
        const kb = bytes / 1024;

        return kb % 1 === 0 ? kb : kb.toFixed(2);
    }
}
