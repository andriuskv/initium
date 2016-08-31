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
            this.background = setting.url ? `url(${setting.url})` : "";
        }
    }
}
