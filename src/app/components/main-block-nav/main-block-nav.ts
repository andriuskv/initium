import { Component, Output, EventEmitter, Input } from "@angular/core";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "main-block-nav",
    template: `
        <ul class="container main-block-nav" [class.hidden]="hideBar">
            <li class="main-block-nav-item">
                <button class="icon-th font-btn" (click)="selectItem('mostVisited')" title="Most visited"></button>
            </li>
            <li class="main-block-nav-item">
                <button class="icon-edit font-btn" (click)="selectItem('notepad')" title="Notepad"></button>
            </li>
            <li class="main-block-nav-item">
                <button class="icon-twitter font-btn" (click)="selectItem('twitter')" title="Twitter">
                    <span class="indicator" *ngIf="items.twitter.new"></span>
                </button>
            </li>
            <li class="main-block-nav-item">
                <button class="icon-rss font-btn" (click)="selectItem('rssFeed')" title="RSS feed">
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
