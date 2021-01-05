import { Component, ViewChild, ViewContainerRef, ComponentFactoryResolver } from "@angular/core";

@Component({
    selector: "app",
    template: `
        <background></background>
        <time></time>
        <main-block (showViewer)="onShowViewer($event)"></main-block>
        <weather></weather>
        <tasks></tasks>
        <widget-menu [countdownIndicatorStatus]="countdownIndicatorStatus"
            (toggle)="onToggle($event)"
            (showBackgroundViewer)="onShowBackgroundViewer($event)"></widget-menu>
        <upper-block [visible]="toggle.upper" (hide)="onHide($event)"
            (indicatorStatus)="setIndicatorStatus($event)"></upper-block>
        <ng-template *ngIf="tweetImageViewerVisible" #tweetImageViewer></ng-template>
        <background-viewer [data]="backgroundViewerData" (close)="hideBackgroundViewer()" *ngIf="backgroundViewerData"></background-viewer>
    `
})
export class App {
    @ViewChild("tweetImageViewer", { read: ViewContainerRef }) private tweetImageViewerRef: ViewContainerRef;

    tweetImageViewerVisible = false;
    backgroundViewerData = null;
    toggle: any = {};
    countdownIndicatorStatus: any = {};

    constructor(private vcref: ViewContainerRef, private cfr: ComponentFactoryResolver) {}

    onToggle(whatToToggle) {
        this.toggle[whatToToggle] = !this.toggle[whatToToggle] || false;
    }

    onHide(component) {
        this.toggle[component] = false;
    }

    hideBackgroundViewer() {
        this.backgroundViewerData = null;
    }

    async onShowViewer(data) {
        this.tweetImageViewerVisible = true;
        this.vcref.clear();

        const { TweetImageViewer } = await import("./components/tweet-image-viewer/tweet-image-viewer");
        const viewer = this.tweetImageViewerRef.createComponent(this.cfr.resolveComponentFactory(TweetImageViewer));

        viewer.instance.data = data;
        viewer.instance.close.subscribe(() => {
            this.tweetImageViewerVisible = false;
            viewer.destroy();
        });
    }

    async onShowBackgroundViewer(data) {
        this.backgroundViewerData = data;
    }

    setIndicatorStatus(status) {
        this.countdownIndicatorStatus = status;
    }
}
