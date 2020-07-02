import { Component, Output, EventEmitter, Input } from "@angular/core";
import { ZIndexService } from "../../services/zIndexService";

@Component({
    selector: "widget-menu",
    templateUrl: "./widget-menu.html",
    styleUrls: ["./widget-menu.scss"]
})
export class WidgetMenu {
    @Output() toggle = new EventEmitter();
    @Output() showBackgroundViewer = new EventEmitter();
    @Input() countdownIndicatorStatus;

    isClosing = false;
    reminderIndicatorVisible = false;
    zIndex = 0;
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

    onShowBackgroundViewer(data) {
        this.showBackgroundViewer.emit(data);
    }

    increaseZIndex() {
        this.zIndex = this.zIndexService.incIfLess(this.zIndex);
    }

    showReminderIndicator(visible) {
        this.reminderIndicatorVisible = visible;
    }
}
