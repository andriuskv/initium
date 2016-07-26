import { Component, Input } from "@angular/core";
import { LocalStorageService } from "services/localStorageService";

@Component({
    selector: "background",
    template: `
        <img src="{{ background }}" class="background" role="presentation" *ngIf="backgroundEnabled">
    `
})
export class Background {
    @Input() setting;
    @Input() newBackground;

    static get parameters() {
        return [[LocalStorageService]];
    }

    constructor(localStorageService) {
        this.storage = localStorageService;
    }

    ngOnInit() {
        const background = this.storage.get("background");

        if (background) {
            this.setBackground(background);
        }
    }

    ngOnChanges(changes) {
        if (changes.setting) {
            const setting = changes.setting.currentValue;

            if (setting && setting.reset && setting.reset.value) {
                this.storage.remove("background");
                this.backgroundEnabled = false;
            }
            return;
        }

        if (changes.newBackground) {
            const background = changes.newBackground.currentValue;

            if (background) {
                this.setBackground(background);
                this.storage.set("background", background);
            }
        }
    }

    setBackground(background) {
        this.backgroundEnabled = true;
        this.background = background;
    }
}
