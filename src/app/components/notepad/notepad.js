import { Component } from "@angular/core";
import { LocalStorageService } from "services/localStorageService";

@Component({
    selector: "notepad",
    template: `
        <textarea class="main-block-notepad"
            [value]="notepad"
            (input)="onInput($event)"
            (keydown)="preventLossOfFocus($event)">
        </textarea>
    `
})
export class Notepad {

    static get parameters() {
        return [[LocalStorageService]];
    }

    constructor(localStorageService) {
        this.storage = localStorageService;
        this.notepad = this.storage.get("notepad") || "";
    }

    insertSpace(elem) {
        const selectionStart = elem.selectionStart;
        const space = "\t";

        elem.value = elem.value.substring(0, selectionStart) + space + elem.value.substring(elem.selectionEnd);

        // Move caret to the end of inserted character.
        elem.selectionStart = selectionStart + 1;
        elem.selectionEnd = elem.selectionStart;
    }

    saveContent(content) {
        this.storage.set("notepad", content);
    }

    onInput(event) {
        this.saveContent(event.target.value);
    }

    preventLossOfFocus(event) {
        if (event.which === 9) {
            event.preventDefault();
            this.insertSpace(event.target);
            this.saveContent(event.target.value);
        }
    }
}
