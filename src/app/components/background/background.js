import { Component, Input } from "@angular/core";

@Component({
    selector: "background",
    template: `
        <img [src]="background" class="background" alt="" *ngIf="background">
    `
})
export class Background {
    @Input() setting = {};

    ngOnChanges(changes) {
        const setting = changes.setting.currentValue;

        if (setting) {
            this.background = setting.url || "https://source.unsplash.com/collection/825407/daily";
        }
    }
}
