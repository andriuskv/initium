import { Component, Output, EventEmitter, ViewChild } from "@angular/core";
import { SettingService } from "../../services/settingService";
import { ZIndexService } from "../../services/zIndexService";

@Component({
    selector: "main-block",
    templateUrl: "./main-block.html"
})
export class MainBlock {
    @Output() showViewer = new EventEmitter();
    @ViewChild("container") container;

    isNavHidden = false;
    isExpanded = false;
    isTabExpandable = false;
    isSidebarExpanded = false;
    isResizingEnabled = false;
    tab = "";
    zIndex = 0;
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

    ngAfterViewInit() {
        const { height } = this.settingService.getSetting("mainBlock");

        if (typeof height === "number") {
            this.container.nativeElement.style.setProperty("--height", `${height}px`);
        }
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

        if (this.isExpanded) {
            this.isResizingEnabled = false;
        }
    }

    toggleResizing() {
        this.isResizingEnabled = !this.isResizingEnabled;
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

        if (!this.isTabExpandable) {
            this.isSidebarExpanded = false;
            this.isResizingEnabled = false;
        }
        localStorage.setItem("active tab", this.tab);
    }

    handleClickOnContainer() {
        this.zIndex = this.zIndexService.incIfLess(this.zIndex);
    }
}
