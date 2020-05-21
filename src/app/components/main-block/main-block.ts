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
    navDisabled = false;
    isExpanded = false;
    isTabExpandable = false;
    isSidebarExpanded = false;
    isResizingEnabled = false;
    tabName = "";
    zIndex = 0;
    tabs: any = {
        topSites: {
            disabled: false
        },
        notepad: {
            disabled: false
        },
        twitter: {
            disabled: false,
            new: false
        },
        rssFeed: {
            disabled: false,
            new: false
        }
    };

    constructor(private settingService: SettingService, private zIndexService: ZIndexService) {}

    ngOnInit() {
        const mainBlock = this.settingService.getSetting("mainBlock");
        const tab = localStorage.getItem("active tab");

        this.tabName = typeof tab === "string" ? tab : "topSites";
        this.isTabExpandable = this.tabName && this.tabName !== "topSites";
        this.isNavHidden = mainBlock.isNavHidden;
        this.tabs.topSites.disabled = mainBlock.topSitesDisabled;
        this.tabs.notepad.disabled = mainBlock.notepadDisabled;
        this.tabs.twitter.disabled = mainBlock.twitterDisabled;
        this.tabs.rssFeed.disabled = mainBlock.rssFeedDisabled;

        const { disabledTabCount } = this.getTabInfo();
        this.navDisabled = disabledTabCount > 2;
        this.settingService.subscribeToSettingChanges(this.changeHandler.bind(this));
    }

    ngAfterViewInit() {
        const { height } = this.settingService.getSetting("mainBlock");

        if (typeof height === "number") {
            this.container.nativeElement.style.setProperty("--height", `${height}px`);
        }
    }

    changeHandler({ mainBlock }) {
        if (!mainBlock) {
            return;
        }
        const { isNavHidden, topSitesDisabled, notepadDisabled, twitterDisabled, rssFeedDisabled } = mainBlock;

        if (typeof isNavHidden === "boolean") {
            this.isNavHidden = isNavHidden;
        }
        else if (typeof topSitesDisabled === "boolean") {
            this.toggleTabState("topSites", topSitesDisabled);
        }
        else if (typeof notepadDisabled === "boolean") {
            this.toggleTabState("notepad", notepadDisabled);
        }
        else if (typeof twitterDisabled === "boolean") {
            this.toggleTabState("twitter", twitterDisabled);
        }
        else if (typeof rssFeedDisabled === "boolean") {
            this.toggleTabState("rssFeed", rssFeedDisabled);
        }
    }

    getTabInfo() {
        let disabledTabCount = 0;
        let firstNotDisabledTab = "";

        for (const key of Object.keys(this.tabs)) {
            if (this.tabs[key].disabled) {
                disabledTabCount += 1;
            }
            else if (!firstNotDisabledTab) {
                firstNotDisabledTab = key;
            }
        }
        return { disabledTabCount, firstNotDisabledTab };
    }

    toggleTabState(name, value) {
        this.tabs[name].disabled = value;
        this.navDisabled = false;
        const { disabledTabCount, firstNotDisabledTab } = this.getTabInfo();

        if (disabledTabCount > 2) {
            this.navDisabled = true;
        }

        if (value && name === this.tabName) {
            this.tabName = firstNotDisabledTab;
            this.isTabExpandable = this.tabName && this.tabName !== "topSites";
            this.isExpanded = false;
            this.isSidebarExpanded = false;
            this.isResizingEnabled = false;
            localStorage.setItem("active tab", this.tabName);
        }
        else if (!this.tabName && disabledTabCount === 3) {
            this.tabName = firstNotDisabledTab;
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

    selectTab(tab, keepVisible = false) {
        this.tabName = tab === this.tabName && !keepVisible ? "" : tab;
        this.isTabExpandable = this.tabName && this.tabName !== "topSites";

        if (this.tabs[this.tabName]) {
            this.tabs[this.tabName].new = false;
        }

        if (!this.isTabExpandable) {
            this.isSidebarExpanded = false;
            this.isResizingEnabled = false;
        }
        localStorage.setItem("active tab", this.tabName);
    }

    handleClickOnContainer() {
        this.zIndex = this.zIndexService.incIfLess(this.zIndex);
    }
}
