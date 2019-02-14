import { Component } from "@angular/core";

@Component({
    selector: "app",
    template: `
        <background></background>
        <time></time>
        <main-block (showViewer)="onShowViewer($event)"></main-block>
        <weather></weather>
        <tasks></tasks>
        <widget-menu (toggle)="onToggle($event)"
            (showBackgroundViewer)="onShowBackgroundViewer($event)"></widget-menu>
        <upper-block [visible]="toggle.upper" (hide)="onHide($event)"></upper-block>
        <tweet-image-viewer [data]="imageData"></tweet-image-viewer>
        <background-viewer *ngIf="backgroundData" [data]="backgroundData" (close)="hideBackgroundViewer($event)"></background-viewer>
    `
})
export class App {
    toggle: any = {};
    imageData: any;
    backgroundData: any;

    onToggle(whatToToggle) {
        this.toggle[whatToToggle] = !this.toggle[whatToToggle] || false;
    }

    onHide(component) {
        this.toggle[component] = false;
    }

    onShowViewer(data) {
        this.imageData = data;
    }

    onShowBackgroundViewer(data) {
        this.backgroundData = data;
    }

    hideBackgroundViewer() {
        this.backgroundData = null;
    }
}
