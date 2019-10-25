import { Component, Input, Output, EventEmitter, Inject, ViewChild } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { ZIndexService } from "../../services/zIndexService";

@Component({
    selector: "upper-block",
    templateUrl: require("raw-loader!./upper-block.html").default
})
export class UpperBlock {
    @ViewChild("fullscreenTarget", { static: true }) fullscreenTarget;
    @Output() indicatorStatus = new EventEmitter();
    @Output() hide = new EventEmitter();
    @Input() visible;

    inFullscreen: boolean = false;
    expanded: boolean = false;
    active: string = "timer";
    zIndex: number = 0;

    constructor(@Inject(DOCUMENT) private document, private zIndexService: ZIndexService) {}

    ngOnInit() {
        this.document.addEventListener("webkitfullscreenchange", () => {
            this.inFullscreen = this.document.webkitIsFullScreen;
        });
    }

    ngOnChanges() {
        if (this.visible) {
            this.zIndex = this.zIndexService.inc();
        }
    }

    hideComp() {
        if (this.inFullscreen) {
            this.document.webkitExitFullscreen();
        }
        else if (this.expanded) {
            this.expanded = false;
        }
        else {
            this.hide.emit("upper");
        }
    }

    toggleTab(tab) {
        this.active = tab;
    }

    toggleFullscreen(fullscreen) {
        if (fullscreen) {
            this.fullscreenTarget.nativeElement.webkitRequestFullScreen();
        }
        else {
            this.document.webkitExitFullscreen();
        }
    }

    toggleSize(expand) {
        this.expanded = expand;
    }

    handleClickOnContainer() {
        this.zIndex = this.zIndexService.incIfLess(this.zIndex);
    }

    emitIndicatorStatus(status) {
        this.indicatorStatus.emit(status);
    }
}
