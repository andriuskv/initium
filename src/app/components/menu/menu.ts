import { Component, Output, EventEmitter } from "@angular/core";

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
    }

    toggleItem(item) {
        this.selectedItem = item;
        this.title = this.capitalize(item);
    }

    closeSelectedItem() {
        this.isClosing = true;

        setTimeout(() => {
            this.selectedItem = "";
            this.isClosing = false;
        }, 500);
    }
}
