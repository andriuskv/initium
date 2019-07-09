import { Component, ElementRef } from "@angular/core";
import { SettingService } from "../../services/settingService";
import { BackgroundService } from "../../services/backgroundService";

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
  constructor(
    private settingService: SettingService,
    private backgroundService: BackgroundService,
    private elRef: ElementRef
  ) {}

    ngOnInit() {
      this.setBackground(this.settingService.getSetting("background"));
      this.settingService.subscribeToSettingChanges(({ background }) => {
        if (background) {
          this.setBackground(background);
        }
      });
    }

    async setBackground(background) {
      if (background.url) {
        this.setBackgroundStyle(background);
        this.backgroundService.resetBackgroundInfo();
      }
      else {
        const info = await this.backgroundService.fetchBackgroundInfo();

        if (info) {
          this.setBackgroundStyle({ url: info.url });
        }
      }
    }

    async setBackgroundStyle({ url, x = 50, y = 50 }) {
      const element = this.elRef.nativeElement;
      element.style.backgroundPosition = `${x}% ${y}%`;
      element.style.backgroundImage = `url(${url})`;
    }
  }
