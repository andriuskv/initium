import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
    selector: "main-block",
    template: `
        <div class="main-block" [class.expanded]="isTwitterExpanded">
            <main-block-nav (activeTab)="onActiveTab($event)"
                [setting]="setting"
                [tabUpdate]="tabUpdate"
                [tabChange]="tabName">
            </main-block-nav>
            <main-block-content
                [item]="activeTab"
                [setting]="setting"
                (newItems)="onTabUpdate($event)"
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
    activeTab: string;
    tabName: string;
    tabUpdate: any;

    onActiveTab(activeTab) {
        this.activeTab = activeTab;
    }

    onTabUpdate(tab) {
        this.tabUpdate = Object.assign({}, tab);
    }

    onToggleTab(name) {
        this.tabName = name;
    }

    onToggleSize(state) {
        this.isTwitterExpanded = state && this.activeTab === "twitter";
    }

    onShowViewer(data) {
        this.showViewer.emit(data);
    }
}
