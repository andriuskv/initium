import { Component } from "@angular/core";
import { apps } from "../../data/google-apps.json";

@Component({
    selector: "google-apps",
    template: `
        <ul class="apps">
            <li class="apps-item" *ngFor="let app of apps">
                <a [href]="app.url" class="apps-item-link">
                    <img [src]="app.iconPath"  class="apps-item-icon"alt="">
                    <div class="apps-item-title">{{ app.title }}</div>
                </a>
            </li>
        </ul>
    `,
    styleUrls: ["./google-apps.scss"]
})
export class GoogleApps {
    apps: any[] = apps;
}
