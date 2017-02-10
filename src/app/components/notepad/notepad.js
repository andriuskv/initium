/* global chrome */

import { Component, Inject } from "@angular/core";
import { DOCUMENT } from "@angular/platform-browser";

@Component({
    selector: "notepad",
    template: `
        <ul class="notepad-header">
            <li class="notepad-header-item"
                *ngFor="let tab of tabs; let i = index"
                [class.active]="activeTabIndex === i">
                <button class="btn" (click)="hideInputAndSelectTab(i)" *ngIf="!tab.settingTitle">{{ tab.title }}</button>
                <button class="icon-cancel font-btn notepad-remove-tab-btn"
                    (click)="removeTab(i)"
                    *ngIf="tabs.length > 1 && !tab.settingTitle">
                </button>
                <input class="input notepad-title-input" type="text" #input
                    (keyup.enter)="setTitle(input)"
                    *ngIf="tab.settingTitle">
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
        this.activeTabIndex = 0;
    }

    ngOnInit() {
        chrome.storage.sync.get("notepad", storage => {
            if (typeof storage.notepad === "string") {
                this.saveTabContent(storage.notepad);
            }
            else if (storage.notepad && storage.notepad.length) {
                this.tabs = storage.notepad;
            }
            this.hideInputAndSelectTab(this.activeTabIndex);
        });
    }

    hideTitleInput() {
        this.tabs = this.tabs.map(tab => {
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
        this.activeTabContent = this.tabs[index].content;
    }

    createNewTab() {
        this.hideTitleInput();
        this.tabs.push({
            title: "Tab",
            content: "",
            settingTitle: true
        });
        this.selectTab(this.tabs.length - 1);
        setTimeout(() => {
            this.document.querySelector(".notepad-title-input").focus();
        });
    }

    removeTab(index) {
        if (index === this.activeTabIndex) {
            this.selectTab(0);
        }
        else if (index < this.activeTabIndex) {
            this.activeTabIndex -= 1;
        }
        this.tabs.splice(index, 1);
        this.saveTabs();
    }

    setTitle(input) {
        const title = input.value.trim();
        const tab = this.tabs[this.tabs.length - 1];

        tab.title = title ? title : "Tab";
        tab.settingTitle = false;
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
        this.tabs[this.activeTabIndex].content = content;
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
