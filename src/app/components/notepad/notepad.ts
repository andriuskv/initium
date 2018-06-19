import { Component, Input, ViewChild } from "@angular/core";
import { ChromeStorageService } from "../../services/chromeStorageService";

@Component({
    selector: "notepad",
    templateUrl: "./notepad.html"
})
export class Notepad {
    @Input() isVisible: boolean = false;
    @ViewChild("textarea") textarea;
    @ViewChild("tabTitleInput") tabTitleInput;

    initialized: boolean = false;
    showingForm: boolean = false;
    removingTab: boolean = false;
    shift: number = 0;
    activeTabIndex: number = 0;
    tabToRemove: number = 0;
    inputTimeoutId: number = 0;
    tabs: Array<any> = [];

    constructor(private chromeStorageService: ChromeStorageService) {
        this.chromeStorageService = chromeStorageService;
        this.tabs = [{
            title: "Tab",
            content: ""
        }];
    }

    ngOnInit() {
        this.chromeStorageService.subscribeToChanges(({ notepad }) => {
            if (notepad) {
                this.tabs = [...notepad.newValue];
                this.selectTab();
            }
        });
        this.chromeStorageService.get("notepad", storage => {
            this.tabs = storage.notepad || this.tabs;
            this.selectTab();

            this.initialized = true;
        });
    }

    previousVisibleTabs() {
        this.shift -= 1;

        if (this.activeTabIndex >= this.shift + 4) {
            this.selectTab(this.activeTabIndex - 1);
        }
    }

    nextVisibleTabs() {
        this.shift += 1;

        if (this.activeTabIndex < this.shift) {
            this.selectTab(this.activeTabIndex + 1);
        }
    }

    selectTab(index = 0) {
        this.activeTabIndex = index;
    }

    showForm() {
        this.showingForm = true;

        setTimeout(() => {
            this.tabTitleInput.nativeElement.focus();
        });
    }

    hideForm() {
        this.showingForm = false;
        this.removingTab = false;
    }

    createTab(event) {
        event.preventDefault();

        this.tabs.push({
            title : event.target.elements.title.value.trim() || "Tab",
            content: ""
        });
        this.shift = this.tabs.length - 4;

        if (this.shift < 0) {
            this.shift = 0;
        }
        this.selectTab(this.tabs.length - 1);
        this.saveTabs();
        this.hideForm();

        setTimeout(() => {
            this.textarea.nativeElement.focus();
        });
    }

    setTabForRemoval(index) {
        if (this.tabs[index].content) {
            this.removingTab = true;
            this.showingForm = true;
            this.tabToRemove = index;
        }
        else {
            this.removeTab(index);
        }
    }

    removeTab(index) {
        if (index === 0 && index === this.activeTabIndex) {
            this.activeTabIndex = 0;
        }
        else if (index <= this.activeTabIndex) {
            this.activeTabIndex -= 1;
        }

        if (this.shift && index >= this.tabs.length - 4) {
            this.shift -= 1;
        }
        this.tabs.splice(index, 1);
        this.selectTab(this.activeTabIndex);
        this.saveTabs();
        this.hideForm();
    }

    saveTabContent(content) {
        this.tabs[this.activeTabIndex].content = content;

        clearTimeout(this.inputTimeoutId);

        this.inputTimeoutId = window.setTimeout(() => {
            this.saveTabs();
        }, 400);
    }

    saveTabs() {
        this.chromeStorageService.set({ notepad: this.tabs });
    }
}
