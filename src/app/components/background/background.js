import { Component, Input } from "@angular/core";

@Component({
    selector: "background",
    template: `
        <img src="{{ url }}" class="background" role="presentation" *ngIf="url">
    `
})
export class Background {
    @Input() setting = {};

    constructor() {
        this.url = "";
    }

    ngOnChanges(changes) {
        const setting = changes.setting.currentValue;

        if (setting) {
            this.url = setting.url;
        }
    }
}
