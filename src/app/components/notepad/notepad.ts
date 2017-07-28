/* global chrome */

import { Component, Inject, Input } from "@angular/core";
import { DOCUMENT } from "@angular/platform-browser";

declare const chrome;

@Component({
    selector: "notepad",
    template: `
        <div class="container main-block-content" [class.visible]="item === 'notepad'">
            <ul class="notepad-header">
                <li *ngIf="tabs.length > 4">
                    <button class="btn-icon notepad-shift-btn" (click)="prevVisibleTabs()">
                        <svg viewBox="0 0 24 24">
                            <use href="#chevron-left"></use>
                        </svg>
                    </button>
                </li>
                <li class="notepad-header-item"
                    *ngFor="let tab of visibleTabs; let i = index"
                    [class.active]="activeTabIndex === i">
                    <button class="btn notepad-select-tab-btn" (click)="hideInputAndSelectTab(i)"
                        *ngIf="!tab.settingTitle">{{ tab.title }}</button>
                    <button class="btn-icon notepad-remove-tab-btn" (click)="removeTab(i)"
                        *ngIf="tabs.length > 1 && !tab.settingTitle"
                        title="Remove tab">
                        <svg viewBox="0 0 24 24">
                            <use href="#cross"></use>
                        </svg>
                    </button>
                    <input class="input notepad-title-input" type="text" #input
                        (keyup.enter)="blurTitleInput(input)"
                        (blur)="setTitle(input)"
                        *ngIf="tab.settingTitle">
                </li>
                <li *ngIf="tabs.length > 4">
                    <button class="btn-icon notepad-shift-btn" (click)="nextVisibleTabs()">
                        <svg viewBox="0 0 24 24">
                            <use href="#chevron-right"></use>
                        </svg>
                    </button>
                </li>
                <li>
                    <button class="btn-icon notepad-create-new-btn" (click)="createNewTab()" title="Add new tab">
                        <svg viewBox="0 0 24 24">
                            <use href="#plus"></use>
                        </svg>
                    </button>
                </li>
            </ul>
            <textarea class="input notepad-input" [(ngModel)]="activeTabContent" (input)="onInput($event)"></textarea>
        </div>
    `
})
export class Notepad {
    @Input() item;

    shift: number = 0;
    activeTabIndex: number = 0;
    activeTabContent: string = "";
    tabs: Array<any>;
    visibleTabs: Array<any> = [];

    constructor(@Inject(DOCUMENT) private document) {
        this.document = document;
        this.tabs = [{
            title: "Tab",
            content: ""
        }];
    }

    ngOnInit() {
        chrome.storage.sync.get("notepad", storage => {
            this.tabs = storage.notepad || this.tabs;
            this.setVisibleTabs();
            this.selectTab(this.activeTabIndex);
        });
    }

    setVisibleTabs(shift = 0) {
        this.visibleTabs = this.tabs.slice(shift, shift + 4);
    }

    prevVisibleTabs() {
        if (this.shift <= 0) {
            return;
        }
        const index = this.activeTabIndex;

        this.shift -= 1;
        this.setVisibleTabs(this.shift);
        this.selectTab(index === this.visibleTabs.length - 1 ? index : index + 1);
    }

    nextVisibleTabs() {
        if (this.shift + 4 >= this.tabs.length) {
            return;
        }
        const index = this.activeTabIndex;

        this.shift += 1;
        this.setVisibleTabs(this.shift);
        this.selectTab(index === 0 ? index : index - 1);
    }

    hideTitleInput() {
        this.visibleTabs = this.visibleTabs.map(tab => {
            tab.settingTitle = false;
            return tab;
        });
    }

    hideInputAndSelectTab(index) {
        this.hideTitleInput();
        this.selectTab(index);
    }

    selectTab(index) {
        this.activeTabIndex = index;
        this.activeTabContent = this.visibleTabs[index].content;
    }

    createNewTab() {
        this.hideTitleInput();
        this.tabs.push({
            title: "Tab",
            content: "",
            settingTitle: true
        });
        this.shift = this.tabs.length - 4;

        if (this.shift < 0) {
            this.shift = 0;
        }
        this.setVisibleTabs(this.shift);
        this.selectTab(this.visibleTabs.length - 1);
        setTimeout(() => {
            this.document.querySelector(".notepad-title-input").focus();
        });
    }

    removeTab(index) {
        const tabIndex = this.shift + index;

        if (index === this.activeTabIndex) {
            this.activeTabIndex = 0;
            this.shift = 0;
        }
        else if (index < this.activeTabIndex) {
            if (this.tabs.length < 5) {
                this.activeTabIndex -= 1;
            }
            else if (this.shift > 0) {
                this.shift -= 1;
            }
        }
        else if (this.tabs.length > 4 && this.shift + 4 >= this.tabs.length) {
            this.shift -= 1;
            this.activeTabIndex += 1;
        }
        this.tabs.splice(tabIndex, 1);
        this.setVisibleTabs(this.shift);
        this.selectTab(this.activeTabIndex);
        this.saveTabs();
    }

    blurTitleInput(input) {
        input.blur();
        this.document.querySelector(".notepad-input").focus();
    }

    setTitle(input) {
        const title = input.value.trim();
        const tab = this.tabs[this.tabs.length - 1];

        tab.title = title ? title : "Tab";
        tab.settingTitle = false;
        this.setVisibleTabs(this.shift);
        this.saveTabs();
    }

    saveTabContent(content) {
        this.tabs[this.shift + this.activeTabIndex].content = content;
        this.saveTabs();
    }

    saveTabs() {
        chrome.storage.sync.set({ notepad: this.tabs });
    }

    onInput(event) {
        this.saveTabContent(event.target.value);
    }
}
