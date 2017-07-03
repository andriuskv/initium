import { Component, Output, EventEmitter, Input } from "@angular/core";

@Component({
    selector: "main-block-content",
    template: `
        <ul class="container main-block-content" [class.hidden]="!item">
            <li class="main-block-content-item" [class.hidden]="item !== 'mostVisited'">
                <most-visited [setting]="mainBlockSetting"></most-visited>
            <li>
            <li class="main-block-content-item" [class.hidden]="item !== 'notepad'">
                <notepad></notepad>
            </li>
            <li class="main-block-content-item" [class.hidden]="item !== 'twitter'">
                <twitter [item]="item"
                    (newTweets)="onNewItems($event, 'twitter')"
                    (toggleTab)="onToggleTab($event)"
                    (toggleSize)="onToggleSize($event)">
                </twitter>
            </li>
            <li class="main-block-content-item" [class.hidden]="item !== 'rssFeed'">
                <rss-feed [item]="item"
                    (newEntries)="onNewItems($event, 'rssFeed')"
                    (toggleTab)="onToggleTab($event)">
                </rss-feed>
            </li>
        </ul>
    `
})
export class MainBlockContent {
    @Input() choice;
    @Input() setting;
    @Output() newItems = new EventEmitter();
    @Output() toggleTab = new EventEmitter();
    @Output() toggleSize = new EventEmitter();

    isItemBarHidden: boolean;
    item: string = "";
    mainBlockSetting: any;

    ngOnChanges(changes) {
        if (changes.choice) {
            this.item = changes.choice.currentValue;
            return;
        }

        if (changes.setting && !changes.setting.isFirstChange()) {
            this.mainBlockSetting = changes.setting.currentValue;
        }
    }

    onNewItems(isNew, name) {
        this.newItems.emit({ isNew, name });
    }

    onToggleTab(item) {
        this.toggleTab.emit(item);
    }

    onToggleSize(state) {
        this.toggleSize.emit(state);
    }
}
