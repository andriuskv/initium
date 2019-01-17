import { Component, Output, EventEmitter } from "@angular/core";
import { ZIndexService } from "../../services/zIndexService";

@Component({
    selector: "widget-menu",
    templateUrl: "./widget-menu.html"
})
export class WidgetMenu {
    @Output() toggle = new EventEmitter();

    isClosing: boolean = false;
    reminderInicatorVisible: boolean = false;
    zIndex: number = 0;
    item: any = {};

    constructor(private zIndexService: ZIndexService) {}

    toggleUpperBlock() {
        this.toggle.emit("upper");
    }

    showItem(id, title = id, iconId = id) {
        this.item = { id, title, iconId };
        this.increaseZIndex();
    }

    hideItem() {
        this.isClosing = true;

        setTimeout(() => {
            this.item = {};
            this.isClosing = false;
        }, 500);
    }

    increaseZIndex() {
        this.zIndex = this.zIndexService.incIfLess(this.zIndex);
    }

    showReminderIndicator(visible) {
        this.reminderInicatorVisible = visible;
    }
}
