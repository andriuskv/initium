import { Component, Output, EventEmitter } from "@angular/core";
import { SettingService } from "../../services/settingService";
import { ZIndexService } from "../../services/zIndexService";

@Component({
    selector: "main-block",
    template: `
        <div class="container main-block"
            [class.expanded]="isExpanded"
            [class.hidden]="isNavHidden && !tab"
            [style.zIndex]="zIndex"
            (click)="handleClickOnContainer()">
            <ul class="main-block-nav" [class.hidden]="isNavHidden" [class.is-tab-visible]="tab">
                <li class="main-block-nav-item">
                    <button class="btn-icon" (click)="selectTab('topSites')" title="Top sites">
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
                    <button class="btn-icon main-block-nav-item-btn"
                        [class.indicator-visible]="tabs.twitter.new"
                        (click)="selectTab('twitter')" title="Twitter">
                        <svg viewBox="0 0 24 24">
                            <use href="#twitter"></use>
                        </svg>
                    </button>
                </li>
                <li class="main-block-nav-item">
                    <button class="btn-icon main-block-nav-item-btn"
                        [class.indicator-visible]="tabs.rssFeed.new"
                        (click)="selectTab('rssFeed')" title="RSS feed">
                        <svg viewBox="0 0 24 24">
                            <use href="#rss"></use>
                        </svg>
                    </button>
                </li>
            </ul>
            <top-sites [isVisible]="tab === 'topSites'"></top-sites>
            <notepad [isVisible]="tab === 'notepad'"></notepad>
            <twitter [isVisible]="tab === 'twitter'"
                (newTweets)="onTabUpdate('twitter')"
                (toggleTab)="selectTab($event, true)"
                (toggleSize)="onToggleSize($event)"
                (showViewer)="onShowViewer($event)">
            </twitter>
            <rss-feed [isVisible]="tab === 'rssFeed'"
                (newEntries)="onTabUpdate('rssFeed')"
                (toggleTab)="selectTab($event, true)"
                (toggleSize)="onToggleSize()">
            </rss-feed>
        </div>
    `
})
export class MainBlock {
    @Output() showViewer = new EventEmitter();

    isNavHidden: boolean = false;
    isExpanded: boolean = false;
    tab: string = "";
    zIndex: number = 0;
    tabs: any = {
        twitter: {
            new: false
        },
        rssFeed: {
            new: false
        }
    };

    constructor(
        private settingService: SettingService,
        private zIndexService: ZIndexService
    ) {
        this.settingService = settingService;
        this.zIndexService = zIndexService;
    }

    ngOnInit() {
        const { isNavHidden } = this.settingService.getSetting("mainBlock");
        const tab = localStorage.getItem("active tab");

        this.tab = typeof tab === "string" ? tab : "topSites";
        this.isNavHidden = isNavHidden;
        this.settingService.subscribeToChanges(this.changeHandler.bind(this));
    }

    changeHandler({ mainBlock }) {
        if (mainBlock && typeof mainBlock.isNavHidden === "boolean") {
            this.isNavHidden = mainBlock.isNavHidden;
        }
    }

    onTabUpdate(name) {
        this.tabs[name].new = true;
    }

    onToggleSize(state = !this.isExpanded) {
        this.isExpanded = state;
    }

    onShowViewer(data) {
        this.showViewer.emit(data);
    }

    selectTab(tab, keepVisible) {
        this.tab = tab === this.tab && !keepVisible ? "" : tab;

        if (this.tabs[this.tab]) {
            this.tabs[this.tab].new = false;
        }
        else {
            this.isExpanded = false;
        }
        localStorage.setItem("active tab", this.tab);
    }

    handleClickOnContainer() {
        this.zIndex = this.zIndexService.incIfLess(this.zIndex);
    }
}
