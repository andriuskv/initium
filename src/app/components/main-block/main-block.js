import { Component, Input } from "@angular/core";

@Component({
    selector: "main-block",
    template: `
        <div class="main-block">
            <main-block-nav (choice)="onChoice($event)"
                [setting]="mainBlockSetting"
                [newItemUpdate]="itemUpdate"
                [tabNameChange]="tabName">
            </main-block-nav>
            <main-block-content
                [choice]="item"
                [setting]="mainBlockSetting"
                (newItems)="onNewItems($event)"
                (toggleTab)="onToggleTab($event)">
            </main-block-content>
        </div>
    `
})
export class MainBlock {
    @Input() setting;

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

    onToggleTab(name) {
        this.tabName = name;
    }
}
