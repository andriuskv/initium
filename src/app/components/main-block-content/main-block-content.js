import { Component, Output, EventEmitter, Input } from "@angular/core";

@Component({
    selector: "main-block-content",
    templateUrl: "app/components/main-block-content/main-block-content.html"
})
export class MainBlockContent {
    @Input() choice;
    @Input() setting;
    @Output() newTweets = new EventEmitter();
    @Output() newEntries = new EventEmitter();
    @Output() toggleTab = new EventEmitter();

    constructor() {
        this.item = "";
        this.itemState = JSON.parse(localStorage.getItem("main block item state")) || {};
    }

    ngOnChanges(changes) {
        if (changes.choice && typeof changes.choice.currentValue === "string") {
            this.item = changes.choice.currentValue;
            return;
        }
        const setting = changes.setting;

        if (setting && setting.currentValue) {
            this.mainBlockSetting = setting.currentValue;

            if (typeof this.mainBlockSetting.hideItemBar === "boolean") {
                this.isItemBarHidden = this.mainBlockSetting.hideItemBar;
            }
        }
    }

    onNewTweets(count) {
        this.newTweets.emit(count);
    }

    onNewEntries(count) {
        this.newEntries.emit(count);
    }

    onToggleTab(item) {
        this.toggleTab.emit(item);
    }

    toggleItemState() {
        this.itemState[this.item] = !this.itemState[this.item];
        localStorage.setItem("main block item state", JSON.stringify(this.itemState));
    }
}
