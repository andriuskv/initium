import { Component, Input } from "@angular/core";

@Component({
    selector: "main-block",
    template: `
        <div class="main-block"
            [class.expanded]="isTwitterExpanded"
            [class.is-nav-hidden]="isNavHidden">
            <main-block-nav (choice)="onChoice($event)"
                [setting]="mainBlockSetting"
                [newItemUpdate]="itemUpdate"
                [tabNameChange]="tabName">
            </main-block-nav>
            <main-block-content
                [choice]="item"
                [setting]="mainBlockSetting"
                (newItems)="onNewItems($event)"
                (navState)="onNavState($event)"
                (toggleTab)="onToggleTab($event)"
                (toggleSize)="onToggleSize($event)">
            </main-block-content>
        </div>
    `
})
export class MainBlock {
    @Input() setting;

    isNavHidden: boolean;
    isTwitterExpanded: boolean;
    item: string;
    tabName: string;
    itemUpdate: any;
    mainBlockSetting: any;

    ngOnChanges(changes) {
        const settingValue = changes.setting.currentValue;

        if (settingValue) {
            this.mainBlockSetting = settingValue;
        }
    }

    onChoice(choice) {
        this.item = choice;
    }

    onNewItems(item) {
        this.itemUpdate = Object.assign({}, item);
    }

    onNavState(isHidden) {
        this.isNavHidden = isHidden;
    }

    onToggleTab(name) {
        this.tabName = name;
    }

    onToggleSize(state) {
        this.isTwitterExpanded = state && this.item === "twitter";
    }
}
