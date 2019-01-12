import { Component } from "@angular/core";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "background",
    template: `
        <div class="background" [style.background-image]="background"></div>
    `
})
export class Background {
    background: string = "";

    constructor(private settingService: SettingService) {}

    ngOnInit() {
        const { url } = this.settingService.getSetting("background");

        this.setBackground(url);
        this.settingService.subscribeToSettingChanges(({ background }) => {
            if (background) {
                this.setBackground(background.url);
            }
        });
    }

    setBackground(url) {
        this.background = `url(${url || "https://source.unsplash.com/collection/825407/daily"})`;
    }
}
