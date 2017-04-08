/* global chrome */

import { Component, Inject } from "@angular/core";
import { DOCUMENT } from "@angular/platform-browser";

@Component({
    selector: "notepad",
    template: `
        <ul class="notepad-header">
            <li *ngIf="tabs.length > 4">
                <button class="icon-left-open btn notepad-shift-btn" (click)="prevVisibleTabs()"></button>
            </li>
            <li class="notepad-header-item"
                *ngFor="let tab of visibleTabs; let i = index"
                [class.active]="activeTabIndex === i">
                <button class="btn notepad-select-tab-btn" (click)="hideInputAndSelectTab(i)"
                    *ngIf="!tab.settingTitle">{{ tab.title }}</button>
                <button class="icon-cancel font-btn notepad-remove-tab-btn"
                    (click)="removeTab(i)"
                    *ngIf="tabs.length > 1 && !tab.settingTitle">
                </button>
                <input class="input notepad-title-input" type="text" #input
                    (keyup.enter)="blurTitleInput(input)"
                    (blur)="setTitle(input)"
                    *ngIf="tab.settingTitle">
            </li>
            <li *ngIf="tabs.length > 4">
                <button class="icon-right-open btn notepad-shift-btn" (click)="nextVisibleTabs()"></button>
            </li>
            <li>
                <button class="icon-plus btn notepad-create-new-btn" (click)="createNewTab()"></button>
            </li>
        </ul>
        <textarea class="input notepad"
            [(ngModel)]="activeTabContent"
            (input)="onInput($event)"
            (keydown.tab)="preventLossOfFocus($event)">
        </textarea>
    `
})
export class Notepad {
    static get parameters() {
        return [[new Inject(DOCUMENT)]];
    }

    constructor(document) {
        this.document = document;
        this.tabs = [{
            title: "Tab",
            content: ""
        }];

        this.visibleTabs = [];
        this.shift = 0;
        this.activeTabIndex = 0;
    }

    ngOnInit() {
        chrome.storage.sync.get("notepad", storage => {
            this.tabs = storage.notepad || this.tabs;
            this.setVisibleTabs();
            this.hideInputAndSelectTab(this.activeTabIndex);
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
        this.document.querySelector(".notepad").focus();
    }

    setTitle(input) {
        const title = input.value.trim();
        const tab = this.tabs[this.tabs.length - 1];

        tab.title = title ? title : "Tab";
        tab.settingTitle = false;
        this.setVisibleTabs(this.shift);
        this.saveTabs();
    }

    insertSpace(elem) {
        const selectionStart = elem.selectionStart;
        const space = "\t";

        elem.value = elem.value.substring(0, selectionStart) + space + elem.value.substring(elem.selectionEnd);

        // Move caret to the end of inserted character.
        elem.selectionStart = selectionStart + 1;
        elem.selectionEnd = elem.selectionStart;
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

    preventLossOfFocus(event) {
        event.preventDefault();
        this.insertSpace(event.target);
        this.saveTabContent(event.target.value);
    }
}
