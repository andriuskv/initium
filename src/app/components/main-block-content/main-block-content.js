import { Component, Output, EventEmitter, Input } from "@angular/core";

@Component({
    selector: "main-block-content",
    templateUrl: "app/components/main-block-content/main-block-content.html"
})
export class MainBlockContent {
    @Input() choice;
    @Input() setting;
    @Output() newItemCount = new EventEmitter();
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

    onNewItemCount(count, name) {
        this.newItemCount.emit({ count, name });
    }

    onToggleTab(item) {
        this.toggleTab.emit(item);
    }

    toggleItemState() {
        this.itemState[this.item] = !this.itemState[this.item];
        localStorage.setItem("main block item state", JSON.stringify(this.itemState));
    }
}
