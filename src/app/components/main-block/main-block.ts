import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
    selector: "main-block",
    template: `
        <div class="main-block" [class.expanded]="isTwitterExpanded">
            <main-block-nav (choice)="onChoice($event)"
                [setting]="mainBlockSetting"
                [newItemUpdate]="itemUpdate"
                [tabNameChange]="tabName">
            </main-block-nav>
            <main-block-content
                [choice]="item"
                [setting]="mainBlockSetting"
                (newItems)="onNewItems($event)"
                (toggleTab)="onToggleTab($event)"
                (toggleSize)="onToggleSize($event)"
                (showViewer)="onShowViewer($event)">
            </main-block-content>
        </div>
    `
})
export class MainBlock {
    @Input() setting;
    @Output() showViewer = new EventEmitter();

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

    onToggleTab(name) {
        this.tabName = name;
    }

    onToggleSize(state) {
        this.isTwitterExpanded = state && this.item === "twitter";
    }

    onShowViewer(data) {
        this.showViewer.emit(data);
    }
}
