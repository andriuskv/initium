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
        <ng-template *ngIf="backgroundViewerVisible" #backgroundViewer></ng-template>
    `
})
export class App {
    @ViewChild("backgroundViewer", { read: ViewContainerRef }) private backgroundViewerRef: ViewContainerRef;
    @ViewChild("tweetImageViewer", { read: ViewContainerRef }) private tweetImageViewerRef: ViewContainerRef;

    backgroundViewerVisible = false;
    tweetImageViewerVisible = false;
    toggle: any = {};
    countdownIndicatorStatus: any = {};

    constructor(private vcref: ViewContainerRef, private cfr: ComponentFactoryResolver) {}

    onToggle(whatToToggle) {
        this.toggle[whatToToggle] = !this.toggle[whatToToggle] || false;
    }

    onHide(component) {
        this.toggle[component] = false;
    }

    async onShowViewer(data) {
        this.tweetImageViewerVisible = true;
        this.vcref.clear();

        const { TweetImageViewer } = await import("./components/tweet-image-viewer/tweet-image-viewer");
        const viewer = this.tweetImageViewerRef.createComponent(this.cfr.resolveComponentFactory(TweetImageViewer));

        viewer.instance.data = data;
        viewer.instance.close.subscribe(() => {
            this.tweetImageViewerVisible = false;
        });
    }

    async onShowBackgroundViewer(data) {
        this.backgroundViewerVisible = true;
        this.vcref.clear();

        const { BackgroundViewer } = await import("./components/background-viewer/background-viewer");
        const viewer = this.backgroundViewerRef.createComponent(this.cfr.resolveComponentFactory(BackgroundViewer));

        viewer.instance.data = data;
        viewer.instance.close.subscribe(() => {
            this.backgroundViewerVisible = false;
        });
    }

    setIndicatorStatus(status) {
        this.countdownIndicatorStatus = status;
    }
}
