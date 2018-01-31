import { Component, Output, EventEmitter } from "@angular/core";
import { ZIndexService } from "../../services/zIndexService";

@Component({
    selector: "menu",
    templateUrl: "./menu.html"
})
export class Menu {
    @Output() toggle = new EventEmitter();

    visible: boolean = false;
    isClosing: boolean = false;
    reminderInicatorVisible: boolean = false;
    title: string = "";
    selectedItem: string = "";
    zIndex: number = 0;

    constructor(private zIndexService: ZIndexService) {
        this.zIndexService = zIndexService;
    }

    toggleUpperBlockComp() {
        this.toggle.emit("upper");
    }

    capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    toggleMenu() {
        this.visible = !this.visible;
    }

    toggleItem(item) {
        this.selectedItem = item;
        this.title = this.capitalize(item);

        if (item === "calendar" && this.reminderInicatorVisible) {
            this.reminderInicatorVisible = false;
        }
    }

    closeSelectedItem() {
        this.isClosing = true;

        setTimeout(() => {
            this.selectedItem = "";
            this.isClosing = false;
        }, 500);
    }

    handleClickOnContainer() {
        this.zIndex = this.zIndexService.incIfLess(this.zIndex);
    }

    showReminderIndicator(visible) {
        this.reminderInicatorVisible = visible;
    }
}
