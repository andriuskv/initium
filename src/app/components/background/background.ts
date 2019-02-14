import { Component } from "@angular/core";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "background",
    template: `
        <div class="background"
            [style.background-image]="background"
            [style.background-position]="x + '% ' + y + '%'"></div>
    `
})
export class Background {
    background: string = "";
    x: number = 50;
    y: number = 50;

    constructor(private settingService: SettingService) {}

    ngOnInit() {
        this.setBackground(this.settingService.getSetting("background"));
        this.settingService.subscribeToSettingChanges(({ background }) => {
            if (background) {
                this.setBackground(background);
            }
        });
    }

    setBackground({ url, x, y }) {
        this.x = x;
        this.y = y;
        this.background = `url(${url || "https://source.unsplash.com/collection/825407/daily"})`;
    }
}
