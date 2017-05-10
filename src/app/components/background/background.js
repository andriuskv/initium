import { Component, Input } from "@angular/core";

@Component({
    selector: "background",
    template: `
        <div class="background" [style.background-image]="background" *ngIf="background"></div>
    `
})
export class Background {
    @Input() setting = {};

    ngOnChanges(changes) {
        const setting = changes.setting.currentValue;

        if (setting) {
            this.background = `url(${setting.url || "https://source.unsplash.com/collection/825407/daily"})`;
        }
    }
}
