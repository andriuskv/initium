import { Component, Output, EventEmitter, Input } from "@angular/core";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "main-block-nav",
    template: `
        <ul class="container main-block-nav" [class.hidden]="hideBar">
            <li class="main-block-nav-item">
                <button class="btn-icon" (click)="selectItem('mostVisited')" title="Most visited">
                    <svg viewBox="0 0 24 24">
                        <path d="M16,5V11H21V5M10,11H15V5H10M16,18H21V12H16M10,18H15V12H10M4,18H9V12H4M4,11H9V5H4V11Z" />
                    </svg>
                </button>
            </li>
            <li class="main-block-nav-item">
                <button class="btn-icon" (click)="selectItem('notepad')" title="Notepad">
                    <svg viewBox="0 0 24 24">
                        <path d="M19,19V5H5V19H19M19,3A2,2 0 0,1 21,5V19C21,20.11 20.1,21 19,21H5A2,2 0 0,1 3,19V5A2,2 0 0,1 5,3H19M16.7,9.35L15.7,10.35L13.65,8.3L14.65,7.3C14.86,7.08 15.21,7.08 15.42,7.3L16.7,8.58C16.92,8.79 16.92,9.14 16.7,9.35M7,14.94L13.06,8.88L15.12,10.94L9.06,17H7V14.94Z" />
                    </svg>
                </button>
            </li>
            <li class="main-block-nav-item">
                <button class="btn-icon" (click)="selectItem('twitter')" title="Twitter">
                    <svg viewBox="0 0 24 24">
                        <use href="#twitter"></use>
                    </svg>
                    <span class="indicator" *ngIf="items.twitter.new"></span>
                </button>
            </li>
            <li class="main-block-nav-item">
                <button class="btn-icon" (click)="selectItem('rssFeed')" title="RSS feed">
                    <svg viewBox="0 0 24 24">
                        <use href="#rss"></use>
                    </svg>
                    <span class="indicator" *ngIf="items.rssFeed.new"></span>
                </button>
            </li>
        </ul>
    `
})
export class MainBlockNav {
    @Output() choice = new EventEmitter();
    @Input() setting;
    @Input() newItemUpdate;
    @Input() tabNameChange;

    hideBar: boolean;
    item: string = this.getItem();
    items: any = {
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

        this.hideBar = settings.hideItemBar;
        this.choice.emit(this.item);
    }

    ngOnChanges(changes) {
        if (changes.newItemUpdate && !changes.newItemUpdate.isFirstChange()) {
            const newItem = changes.newItemUpdate.currentValue;
            this.items[newItem.name].new = newItem.isNew;
            return;
        }

        if (changes.tabNameChange && !changes.tabNameChange.isFirstChange()) {
            this.selectItem(changes.tabNameChange.currentValue, true);
            return;
        }

        if (changes.setting && !changes.setting.isFirstChange()) {
            this.hideBar = changes.setting.currentValue.hideItemBar;
        }
    }

    getItem() {
        const item = localStorage.getItem("favorite tab");

        return typeof item === "string" ? item : "mostVisited";
    }

    selectItem(item, keepVisible) {
        this.item = item === this.item && !keepVisible ? "" : item;

        if (this.item === "twitter" || this.item === "rssFeed") {
            this.items[this.item].new = false;
        }
        this.choice.emit(this.item);
        localStorage.setItem("favorite tab", this.item);
    }
}
