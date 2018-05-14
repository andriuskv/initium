import { Injectable } from "@angular/core";
import { ChromeStorageService } from "./chromeStorageService";

@Injectable({
  providedIn: "root"
})
export class ReminderService {
    constructor(private chromeStorageService: ChromeStorageService) {
        this.chromeStorageService = chromeStorageService;
    }

    getReminders() {
        return new Promise(resolve => {
            this.chromeStorageService.get("reminders", storage => {
                resolve(storage.reminders || []);
            });
        });
    }

    saveReminders(reminders) {
        this.chromeStorageService.set({ reminders });
    }

    subscribeToChanges(handler) {
        this.chromeStorageService.subscribeToChanges(handler);
    }
}
