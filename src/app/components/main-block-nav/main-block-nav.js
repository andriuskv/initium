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
                new: false,
                count: 0
            },
            rssFeed: {
                new: false,
                count: 0
            }
        };
    }

    ngOnInit() {
        this.choice.emit(this.item);
    }

    ngOnChanges(changes) {
        if (changes.newItemUpdate && !changes.newItemUpdate.isFirstChange()) {
            const newItem = changes.newItemUpdate.currentValue;
            const item = this.items[newItem.name];
            const count = newItem.count || 0;

            item.new = item.count !== count;
            item.count = count;

            if (item.count > 99) {
                item.count = "99+";
            }

            setTimeout(() => {
                item.new = false;
            }, 1000);
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
            const item = this.items[this.item];
            const itemCount = Number.parseInt(item.count, 10);

            if (itemCount) {
                item.count = 0;
            }
        }
        this.choice.emit(this.item);
        localStorage.setItem("favorite tab", this.item);
    }
}
