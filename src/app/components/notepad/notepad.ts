import { Component, Input, ViewChild } from "@angular/core";
import { ChromeStorageService } from "../../services/chromeStorageService";

@Component({
    selector: "notepad",
    templateUrl: "./notepad.html",
    styleUrls: ["./notepad.scss"]
})
export class Notepad {
    @Input() isVisible = false;
    @ViewChild("textarea") textarea;
    @ViewChild("editTitleInput") editTitleInput;

    initialized = false;
    menuVisible = false;
    shift = 0;
    activeTabIndex = 0;
    inputTimeoutId = 0;
    undoTimeoutId = 0;
    tabs = [{
        title: "Tab",
        content: ""
    }];
    pendingTabs = [];
    editedTitle;

    constructor(private chromeStorageService: ChromeStorageService) {}

    ngOnInit() {
        this.chromeStorageService.subscribeToChanges(({ notepad }) => {
            if (notepad) {
                this.tabs = [...notepad.newValue];
                this.selectTab();
            }
        });
        this.chromeStorageService.get("notepad", ({ notepad }) => {
            this.initialized = true;
            this.tabs = notepad || this.tabs;
            this.selectTab();
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

    showMenu() {
        this.menuVisible = true;
    }

    hideMenu() {
        this.menuVisible = false;
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
        event.target.reset();
    }

    selectTabFromList(index) {
        // If selected tab is not visible, shift tabs to the leftmost side.
        if (index < this.shift || index >= this.shift + 4) {
            this.shift = index > this.tabs.length - 4 ? this.tabs.length - 4 : index;
        }
        this.selectTab(index);
        this.hideMenu();
        requestAnimationFrame(() => {
            this.textarea.nativeElement.focus();
        });
    }

    removeTab(index) {
        const tab = this.tabs[index];

        if (this.editedTitle && this.editedTitle.tabIndex === index) {
            this.editedTitle = null;
        }
        this.tabs.splice(index, 1);

        if (tab.content) {
            this.pendingTabs.push(tab);
            window.clearTimeout(this.undoTimeoutId);
            this.undoTimeoutId = window.setTimeout(() => {
                this.pendingTabs.length = 0;
                this.saveTabs();
            }, 6000);
        }
        else {
            this.saveTabs();
        }

        if (this.activeTabIndex > 0 && index <= this.activeTabIndex) {
            this.activeTabIndex -= 1;
        }

        if (this.shift > 0 && this.activeTabIndex >= this.tabs.length - 3) {
            this.shift -= 1;
        }
    }

    undoTabRemoval() {
        window.clearTimeout(this.undoTimeoutId);
        this.tabs = this.tabs.concat(this.pendingTabs);
        this.pendingTabs.length = 0;
    }

    saveTabContent(content) {
        this.tabs[this.activeTabIndex].content = content;
        window.clearTimeout(this.inputTimeoutId);
        this.inputTimeoutId = window.setTimeout(() => {
            this.saveTabs();
        }, 400);
    }

    downloadTab(target, index) {
        const { content } = this.tabs[index];
        const data = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(data);
        target.href = url;

        setTimeout(() => {
            target.href = "";
            URL.revokeObjectURL(url);
        }, 100);
    }

    enableTitleEdit(index) {
        this.editedTitle = {
            tabIndex: index,
            value: this.tabs[index].title
        };
        requestAnimationFrame(() => {
            this.editTitleInput.nativeElement.focus();
        });
    }

    disableTitleEdit() {
        this.editedTitle = null;
    }

    editTabTitle(event) {
        const { tabIndex, value } = this.editedTitle;
        event.preventDefault();

        this.tabs[tabIndex].title = event.target.elements.title.value || value;
        this.editedTitle = null;
        this.saveTabs();
    }

    saveTabs() {
        this.chromeStorageService.set({ notepad: this.tabs });
    }
}
