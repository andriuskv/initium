import { Component, Output, EventEmitter, Input } from "@angular/core";

@Component({
    selector: "main-block-content",
    template: `
        <most-visited [setting]="setting" [item]="item"></most-visited>
        <notepad [item]="item"></notepad>
        <twitter [item]="item"
            (newTweets)="onNewItems($event, 'twitter')"
            (toggleTab)="onToggleTab($event)"
            (toggleSize)="onToggleSize($event)"
            (showViewer)="onShowViewer($event)">
        </twitter>
        <rss-feed [item]="item"
            (newEntries)="onNewItems($event, 'rssFeed')"
            (toggleTab)="onToggleTab($event)">
        </rss-feed>
    `
})
export class MainBlockContent {
    @Input() item;
    @Input() setting;
    @Output() newItems = new EventEmitter();
    @Output() toggleTab = new EventEmitter();
    @Output() toggleSize = new EventEmitter();
    @Output() showViewer = new EventEmitter();

    onNewItems(isNew, name) {
        this.newItems.emit({ isNew, name });
    }

    onToggleTab(item) {
        this.toggleTab.emit(item);
    }

    onToggleSize(state) {
        this.toggleSize.emit(state);
    }

    onShowViewer(data) {
        this.showViewer.emit(data);
    }
}
