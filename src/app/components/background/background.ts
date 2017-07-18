import { Component, Input } from "@angular/core";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "background",
    template: `
        <div class="background" [style.background-image]="background" *ngIf="background"></div>
    `
})
export class Background {
    @Input() setting = {};

    background: string;

    constructor(private settingService: SettingService) {
        this.settingService = settingService;
    }

    ngOnInit() {
        const { background: settings } = this.settingService.getSettings();

        this.background = this.getBackground(settings.url);
    }

    ngOnChanges(changes) {
        const setting = changes.setting.currentValue;

        if (setting) {
            this.background = this.getBackground(setting.url);
        }
    }

    getBackground(url) {
        return `url(${url || "https://source.unsplash.com/collection/825407/daily"})`;
    }
}
