import { NgModule, Component, Input, Output, EventEmitter } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

@Component({
    selector: "tweet-image-viewer",
    templateUrl: "./tweet-image-viewer.html",
    styleUrls: ["./tweet-image-viewer.scss"]
})
export class TweetImageViewer {
    @Output() close = new EventEmitter();
    @Input() data;

    loaded = false;
    index: number;
    images = [];

    ngOnInit() {
        this.index = this.data.startIndex;
        this.images = this.data.images;
    }

    handleLoad({ target }) {
        target.style.maxWidth = `${window.innerWidth - 96}px`;
        target.style.maxHeight = `${window.innerHeight - 54}px`;
        this.images[this.index].loaded = true;

        setTimeout(() => {
            this.loaded = true;
        }, 200);
    }

    handleClick({ currentTarget, target }) {
        if (target === currentTarget) {
            this.closeViewer();
        }
    }

    nextImage(direction) {
        this.index += direction;

        if (this.index < 0) {
            this.index = this.images.length - 1;
        }
        else if (this.index === this.images.length) {
            this.index = 0;
        }
        this.loaded = this.images[this.index].loaded;
    }

    closeViewer() {
        this.close.emit();
    }
}

@NgModule({
    declarations: [TweetImageViewer],
    imports: [BrowserModule]
})
class TweetImageViewerModule {}
