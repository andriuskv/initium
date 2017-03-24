import { Component, Output, EventEmitter, Input } from "@angular/core";

@Component({
    selector: "main-block-content",
    template: `
        <ul class="container main-block-content"
            [class.hidden]="!item"
            [class.is-expanded]="itemState[item]"
            [class.is-item-bar-hidden]="isItemBarHidden"
            [class.is-twitter-active]="item === 'twitter'">
            <li class="main-block-content-item" [class.hidden]="item !== 'mostVisited'">
                <most-visited [setting]="mainBlockSetting"></most-visited>
            <li>
            <li class="main-block-content-item" [class.hidden]="item !== 'notepad'">
                <notepad></notepad>
            </li>
            <li class="main-block-content-item" [class.hidden]="item !== 'twitter'">
                <twitter [item]="item"
                    (newTweets)="onNewItems($event, 'twitter')"
                    (toggleTab)="onToggleTab($event)">
                </twitter>
            </li>
            <li class="main-block-content-item" [class.hidden]="item !== 'rssFeed'">
                <rss-feed [item]="item"
                    (newEntries)="onNewItems($event, 'rssFeed')"
                    (toggleTab)="onToggleTab($event)">
                </rss-feed>
            </li>
            <li *ngIf="item !== 'mostVisited'">
                <button class="btn main-block-expand-btn" (click)="toggleItemState()">
                    {{ this.itemState[this.item] ? "Contract" : "Expand" }}
                </button>
            </li>
    </ul>
    `
})
export class MainBlockContent {
    @Input() choice;
    @Input() setting;
    @Output() newItems = new EventEmitter();
    @Output() toggleTab = new EventEmitter();

    constructor() {
        this.item = "";
        this.itemState = JSON.parse(localStorage.getItem("main block item state")) || {};
    }

    ngOnChanges(changes) {
        if (changes.choice) {
            this.item = changes.choice.currentValue;
            return;
        }

        if (changes.setting && !changes.setting.isFirstChange()) {
            this.mainBlockSetting = changes.setting.currentValue;
            this.isItemBarHidden = this.mainBlockSetting.hideItemBar;
        }
    }

    onNewItems(isNew, name) {
        this.newItems.emit({ isNew, name });
    }

    onToggleTab(item) {
        this.toggleTab.emit(item);
    }

    toggleItemState() {
        this.itemState[this.item] = !this.itemState[this.item];
        localStorage.setItem("main block item state", JSON.stringify(this.itemState));
    }
}
