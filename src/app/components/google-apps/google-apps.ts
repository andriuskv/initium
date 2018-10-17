import { Component } from "@angular/core";

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
    `
})
export class GoogleApps {
    apps: any[] = [];

    async ngOnInit() {
        const { apps } = await fetch("assets/google-apps.json").then(res => res.json());
        this.apps = apps;
    }
}
