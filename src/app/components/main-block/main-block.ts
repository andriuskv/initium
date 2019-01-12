import { Component, Output, EventEmitter } from "@angular/core";
import { SettingService } from "../../services/settingService";
import { ZIndexService } from "../../services/zIndexService";

@Component({
    selector: "main-block",
    templateUrl: "./main-block.html"
})
export class MainBlock {
    @Output() showViewer = new EventEmitter();

    isNavHidden: boolean = false;
    isExpanded: boolean = false;
    isTabExpandable: boolean = false;
    isSidebarExpanded: boolean = false;
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

    constructor(private settingService: SettingService, private zIndexService: ZIndexService) {}

    ngOnInit() {
        const { isNavHidden } = this.settingService.getSetting("mainBlock");
        const tab = localStorage.getItem("active tab");

        this.tab = typeof tab === "string" ? tab : "topSites";
        this.isNavHidden = isNavHidden;
        this.isTabExpandable = this.tab && this.tab !== "topSites";
        this.settingService.subscribeToSettingChanges(this.changeHandler.bind(this));
    }

    changeHandler({ mainBlock }) {
        if (mainBlock && typeof mainBlock.isNavHidden === "boolean") {
            this.isNavHidden = mainBlock.isNavHidden;
        }
    }

    onTabUpdate(name) {
        this.tabs[name].new = true;
    }

    toggleSize() {
         this.isExpanded = !this.isExpanded;
    }

    showSidebar() {
        this.isSidebarExpanded = true;
    }

    hideSidebar() {
        this.isSidebarExpanded = false;
    }

    onShowViewer(data) {
        this.showViewer.emit(data);
    }

    selectTab(tab, keepVisible) {
        this.tab = tab === this.tab && !keepVisible ? "" : tab;
        this.isTabExpandable = this.tab && this.tab !== "topSites";

        if (this.tabs[this.tab]) {
            this.tabs[this.tab].new = false;
        }
        localStorage.setItem("active tab", this.tab);
    }

    handleClickOnContainer() {
        this.zIndex = this.zIndexService.incIfLess(this.zIndex);
    }
}
