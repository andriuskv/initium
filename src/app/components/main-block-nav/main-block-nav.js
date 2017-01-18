import { Component, Output, EventEmitter, Input } from "@angular/core";

@Component({
    selector: "main-block-nav",
    templateUrl: "app/components/main-block-nav/main-block-nav.html"
})
export class MainBlockNav {
    @Output() choice = new EventEmitter();
    @Input() setting;
    @Input() newItemUpdate;
    @Input() tabNameChange;

    constructor() {
        this.item = this.getItem();
        this.items = {
            twitter: {
                new: false
            },
            rssFeed: {
                new: false
            }
        };
    }

    ngOnInit() {
        this.choice.emit(this.item);
    }

    ngOnChanges(changes) {
        if (changes.newItemUpdate && !changes.newItemUpdate.isFirstChange()) {
            const newItem = changes.newItemUpdate.currentValue;
            this.items[newItem.name].new = newItem.isNew;
            return;
        }

        if (changes.tabNameChange && !changes.tabNameChange.isFirstChange()) {
            this.selectItem(changes.tabNameChange.currentValue, true);
            return;
        }

        if (changes.setting && !changes.setting.isFirstChange()) {
            this.hideBar = changes.setting.currentValue.hideItemBar;
        }
    }

    getItem() {
        const item = localStorage.getItem("favorite tab");

        return typeof item === "string" ? item : "mostVisited";
    }

    selectItem(item, keepVisible) {
        this.item = item === this.item && !keepVisible ? "" : item;

        if (this.item === "twitter" || this.item === "rssFeed") {
            this.items[this.item].new = false;
        }
        this.choice.emit(this.item);
        localStorage.setItem("favorite tab", this.item);
    }
}
