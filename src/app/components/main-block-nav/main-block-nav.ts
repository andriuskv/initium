import { Component, Output, EventEmitter, Input } from "@angular/core";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "main-block-nav",
    template: `
        <ul class="container main-block-nav" [class.hidden]="isNavHidden">
            <li class="main-block-nav-item">
                <button class="btn-icon" (click)="selectTab('mostVisited')" title="Most visited">
                    <svg viewBox="0 0 24 24">
                        <path d="M16,5V11H21V5M10,11H15V5H10M16,18H21V12H16M10,18H15V12H10M4,18H9V12H4M4,11H9V5H4V11Z" />
                    </svg>
                </button>
            </li>
            <li class="main-block-nav-item">
                <button class="btn-icon" (click)="selectTab('notepad')" title="Notepad">
                    <svg viewBox="0 0 24 24">
                        <path d="M19,19V5H5V19H19M19,3A2,2 0 0,1 21,5V19C21,20.11 20.1,
                        21 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19M16.7,9.35L15.7,
                        10.35L13.65,8.3L14.65,7.3C14.86,7.08 15.21,7.08 15.42,7.3L16.7,
                        8.58C16.92,8.79 16.92,9.14 16.7,9.35M7,14.94L13.06,8.88L15.12,
                        10.94L9.06,17H7V14.94Z" />
                    </svg>
                </button>
            </li>
            <li class="main-block-nav-item">
                <button class="btn-icon" (click)="selectTab('twitter')" title="Twitter">
                    <svg viewBox="0 0 24 24">
                        <use href="#twitter"></use>
                    </svg>
                    <span class="indicator" *ngIf="tabs.twitter.new"></span>
                </button>
            </li>
            <li class="main-block-nav-item">
                <button class="btn-icon" (click)="selectTab('rssFeed')" title="RSS feed">
                    <svg viewBox="0 0 24 24">
                        <use href="#rss"></use>
                    </svg>
                    <span class="indicator" *ngIf="tabs.rssFeed.new"></span>
                </button>
            </li>
        </ul>
    `
})
export class MainBlockNav {
    @Output() activeTab = new EventEmitter();
    @Input() setting;
    @Input() tabUpdate;
    @Input() tabChange;

    isNavHidden: boolean;
    tab: string = "";
    tabs: any = {
        twitter: {
            new: false
        },
        rssFeed: {
            new: false
        }
    };

    constructor(private settingService: SettingService) {
        this.settingService = settingService;
    }

    ngOnInit() {
        const { mainBlock: settings } = this.settingService.getSettings();
        const tab = localStorage.getItem("active tab");

        this.tab = typeof tab === "string" ? tab : "mostVisited";
        this.isNavHidden = settings.hideItemBar;
        this.activeTab.emit(this.tab);
    }

    ngOnChanges() {
        if (this.tabUpdate) {
            const { name, isNew } = this.tabUpdate;

            this.tabs[name].new = isNew;
        }

        if (this.tabChange) {
            this.selectTab(this.tabChange, true);
        }

        if (this.setting && typeof this.setting.hideItemBar === "boolean") {
            this.isNavHidden = this.setting.hideItemBar;
        }
    }

    selectTab(tab, keepVisible) {
        this.tab = tab === this.tab && !keepVisible ? "" : tab;

        if (this.tab === "twitter" || this.tab === "rssFeed") {
            this.tabs[this.tab].new = false;
        }
        this.activeTab.emit(this.tab);
        localStorage.setItem("active tab", this.tab);
    }
}
