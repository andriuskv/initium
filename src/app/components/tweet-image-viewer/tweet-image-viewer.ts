import { Component, Input } from "@angular/core";

@Component({
    selector: "tweet-image-viewer",
    template: `
        <div class="tweet-image-viewer" *ngIf="images.length" (click)="handleClick($event)">
            <button class="btn-icon viewer-direction-btn"
                *ngIf="images.length > 1"
                (click)="nextImage(-1)"
                title="Previous image">
                <svg viewBox="0 0 24 24">
                    <use href="#chevron-left"></use>
                </svg>
            </button>
            <img src="{{ images[index].url }}" class="viewer-image">
            <button class="btn-icon viewer-direction-btn"
                *ngIf="images.length > 1"
                (click)="nextImage(1)"
                title="Next image">
                <svg viewBox="0 0 24 24">
                    <use href="#chevron-right"></use>
                </svg>
            </button>
            <button class="btn-icon viewer-close-btn" (click)="closeViewer()" title="Close image viewer">
                <svg viewBox="0 0 24 24">
                    <use href="#cross"></use>
                </svg>
            </button>
        </div>
    `
})
export class TweetImageViewer {
    @Input() data;

    images: Array<any> = [];
    index: number;

    ngOnChanges(changes) {
        const data = changes.data;

        if (data.isFirstChange()) {
            return;
        }
        this.index = data.currentValue.startIndex;
        this.images = data.currentValue.images;
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
    }

    closeViewer() {
        this.images.length = 0;
    }
}
