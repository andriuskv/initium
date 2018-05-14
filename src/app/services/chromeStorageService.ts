import { Injectable } from "@angular/core";
import { Subject } from "rxjs";

@Injectable({
  providedIn: "root"
})
export class ChromeStorageService {
    isLocalChange: boolean = false;
    data: Subject<object> = new Subject();

    constructor() {
        this.listenToChanges();
    }

    get(name, callback) {
        chrome.storage.sync.get(name, callback);
    }

    set(value) {
        this.isLocalChange = true;
        chrome.storage.sync.set(value);
    }

    listenToChanges() {
        chrome.storage.onChanged.addListener(changes => {
            if (this.isLocalChange) {
                this.isLocalChange = false;
                return;
            }
            this.data.next(changes);
        });
    }

    subscribeToChanges(handler) {
        this.data.subscribe(handler);
    }
}
