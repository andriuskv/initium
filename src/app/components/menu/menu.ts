import { Component, Output, EventEmitter } from "@angular/core";
import { ZIndexService } from "../../services/zIndexService";

@Component({
    selector: "menu",
    templateUrl: "./menu.html"
})
export class Menu {
    @Output() toggle = new EventEmitter();
    @Output() setting = new EventEmitter();

    visible: boolean = false;
    isClosing: boolean = false;
    title: string = "";
    selectedItem: string = "";
    zIndex: number = 0;

    constructor(private zIndexService: ZIndexService) {
        this.zIndexService = zIndexService;
    }

    toggleUpperBlockComp() {
        this.toggle.emit("upper");
    }

    onSetting(setting) {
        this.setting.emit(setting);
    }

    capitalize(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    toggleMenu() {
        this.visible = !this.visible;

        if (this.visible) {
            this.zIndex = this.zIndexService.inc();
        }
    }

    toggleItem(item) {
        this.selectedItem = item;
        this.title = this.capitalize(item);
        this.zIndex = this.zIndexService.inc();
    }

    closeSelectedItem() {
        this.isClosing = true;

        setTimeout(() => {
            this.selectedItem = "";
            this.isClosing = false;
        }, 500);
    }
}
