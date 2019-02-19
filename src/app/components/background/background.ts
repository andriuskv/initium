import { Component, ElementRef } from "@angular/core";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "background",
    styles: [`
        :host {
            position: absolute;
            top: 0;
            right: 0;
            bottom: 0;
            left: 0;
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            transition: 0.2s background-position;
            transition-delay: 0.2s;
            filter: brightness(90%);
        }
    `],
    template: ""
})
export class Background {
    constructor(private settingService: SettingService, private elRef: ElementRef) {}

    ngOnInit() {
        this.setBackground(this.settingService.getSetting("background"));
        this.settingService.subscribeToSettingChanges(({ background }) => {
            if (background) {
                this.setBackground(background);
            }
        });
    }

    setBackground({ url, x, y }) {
        const element = this.elRef.nativeElement;
        element.style.backgroundPosition = `${x}% ${y}%`;
        element.style.backgroundImage = `url(${url || "https://source.unsplash.com/collection/825407/daily"})`;
    }
}
