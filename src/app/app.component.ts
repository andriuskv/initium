import { Component } from "@angular/core";

@Component({
    selector: "app",
    template: `
        <background></background>
        <time></time>
        <main-block (showViewer)="onShowViewer($event)"></main-block>
        <weather></weather>
        <todo></todo>
        <widget-menu (toggle)="onToggle($event)"></widget-menu>
        <upper-block [visible]="toggle.upper" (hide)="onHide($event)"></upper-block>
        <tweet-image-viewer [data]="imageData"></tweet-image-viewer>
    `
})
export class App {
    toggle: any = {};
    imageData: any;

    onToggle(whatToToggle) {
        this.toggle[whatToToggle] = !this.toggle[whatToToggle] || false;
    }

    onHide(component) {
        this.toggle[component] = false;
    }

    onShowViewer(data) {
        this.imageData = data;
    }
}
