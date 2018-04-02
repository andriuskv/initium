import { Component, Input, ViewChild } from "@angular/core";
import { ChromeStorageService } from "../../services/chromeStorageService";

@Component({
    selector: "notepad",
    template: `
        <div class="main-block-content notepad"
            [class.visible]="isVisible"
            [class.active]="initialized">
            <div class="main-block-content-header">
                <button class="btn-icon notepad-header-btn"
                    *ngIf="tabs.length > 4"
                    (click)="previousVisibleTabs()"
                    [disabled]="shift <= 0">
                    <svg viewBox="0 0 24 24">
                        <use href="#chevron-left"></use>
                    </svg>
                </button>
                <ul class="notepad-tabs">
                    <li class="notepad-tab"
                        *ngFor="let tab of tabs; let i = index"
                        [class.active]="activeTabIndex === i"
                        [class.hidden]="i < shift || i >= shift + 4">
                        <button class="btn-icon notepad-tab-select-btn"
                            (click)="selectTab(i)">{{ tab.title }}</button>
                        <button class="btn-icon notepad-tab-remove-btn"
                            (click)="setTabForRemoval(i)"
                            *ngIf="tabs.length > 1"
                            title="Remove tab">
                            <svg viewBox="0 0 24 24">
                                <use href="#cross"></use>
                            </svg>
                        </button>
                    </li>
                </ul>
                <button class="btn-icon notepad-header-btn"
                    *ngIf="tabs.length > 4"
                    (click)="nextVisibleTabs()"
                    [disabled]="shift + 4 >= tabs.length">
                        <svg viewBox="0 0 24 24">
                            <use href="#chevron-right"></use>
                        </svg>
                </button>
                <button class="btn-icon notepad-header-btn"
                    (click)="showTabCreateModal()" title="Create tab">
                    <svg viewBox="0 0 24 24">
                        <use href="#plus"></use>
                    </svg>
                </button>
            </div>
            <textarea class="input notepad-input" #textarea
                [value]="tabs[activeTabIndex].content"
                (input)="saveTabContent($event.target.value)"></textarea>
            <div class="main-block-mask" *ngIf="showingTabRemoveModal">
                <div class="container main-block-mask-content notepad-modal">
                    <h4 class="notepad-modal-title">Are you really want to remove this tab?</h4>
                    <div>
                        <button class="btn" (click)="removeTab(tabToRemove)">Yes</button>
                        <button class="btn" (click)="hideTabRemoveModal()">No</button>
                    </div>
                </div>
            </div>
            <div class="main-block-mask" *ngIf="showingTabCreateModal">
                <div class="container main-block-mask-content notepad-modal">
                    <h4 class="notepad-modal-title">Create new tab</h4>
                    <form (submit)="createTab($event)">
                        <input type="text" class="input" name="title" placeholder="Title" #tabTitleInput>
                        <button class="btn">Create</button>
                    </form>
                    <button class="btn-icon notepad-modal-hide-btn" (click)="hideTabCreateModal()" title="Hide">
                        <svg viewBox="0 0 24 24">
                            <use href="#cross"></use>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `
})
export class Notepad {
    @Input() isVisible: boolean = false;
    @ViewChild("textarea") textarea;
    @ViewChild("tabTitleInput") tabTitleInput;

    initialized: boolean = false;
    showingTabRemoveModal: boolean = false;
    showingTabCreateModal: boolean = false;
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
        this.chromeStorageService.subscribeToChanges(this.chromeStorageChangeHandler.bind(this));
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

    showTabCreateModal() {
        this.showingTabCreateModal = true;

        setTimeout(() => {
            this.tabTitleInput.nativeElement.focus();
        });
    }

    hideTabCreateModal() {
        this.showingTabCreateModal = false;
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
        this.hideTabCreateModal();

        setTimeout(() => {
            this.textarea.nativeElement.focus();
        });
    }

    setTabForRemoval(index) {
        if (this.tabs[index].content) {
            this.showingTabRemoveModal = true;
            this.tabToRemove = index;
            this.selectTab(index);
        }
        else {
            this.removeTab(index);
        }
    }

    hideTabRemoveModal() {
        this.showingTabRemoveModal = false;
    }

    removeTab(index) {
        if (index <= this.activeTabIndex) {
            this.activeTabIndex -= 1;
        }

        if (this.shift && index >= this.tabs.length - 4) {
            this.shift -= 1;
        }
        this.tabs.splice(index, 1);
        this.selectTab(this.activeTabIndex);
        this.saveTabs();
        this.hideTabRemoveModal();
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

    chromeStorageChangeHandler({ notepad }) {
        if (notepad) {
            this.tabs = [...notepad.newValue];
            this.selectTab();
        }
    }
}
