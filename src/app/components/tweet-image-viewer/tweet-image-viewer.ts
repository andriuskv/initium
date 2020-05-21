import { Component, Input, Output, EventEmitter } from "@angular/core";

@Component({
    selector: "tweet-image-viewer",
    templateUrl: "./tweet-image-viewer.html",
    styleUrls: ["./tweet-image-viewer.scss"]
})
export class TweetImageViewer {
    @Output() close = new EventEmitter();
    @Input() data;

    images = [];
    loading = true;
    index: number;

    ngOnInit() {
        this.index = this.data.startIndex;
        this.images = this.data.images;
    }

    handleLoad({ target }) {
        target.style.maxWidth = `${window.innerWidth - 96}px`;
        target.style.maxHeight = `${window.innerHeight - 54}px`;
        this.images[this.index].loaded = true;

        setTimeout(() => {
            this.loading = false;
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

        if (!this.images[this.index].loaded) {
            this.loading = true;
        }
    }

    closeViewer() {
        this.close.emit();
    }
}
