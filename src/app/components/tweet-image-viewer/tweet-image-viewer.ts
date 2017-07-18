import { Component, Input } from "@angular/core";

@Component({
    selector: "tweet-image-viewer",
    template: `
        <div class="tweet-image-viewer" *ngIf="images.length" (click)="handleClick($event)">
            <div class="viewer-image-container">
                <button class="btn-icon viewer-direction-btn left"
                    *ngIf="images.length > 1"
                    (click)="nextImage(-1)"
                    aria-label="Previous image">
                    <svg class="viewer-direction-icon" viewBox="0 0 24 24">
                        <use href="#chevron-left"></use>
                    </svg>
                </button>
                <img src="{{ images[index].url }}" class="viewer-image"
                    (load)="handleLoad($event)" [class.hidden]="loading">
                <div class="viewer-bottom-bar">
                    <span *ngIf="images.length > 1">{{ this.index + 1 }}/{{ this.images.length }}</span>
                    <button class="btn-icon viewer-open-btn" (click)="openImage()" title="Open image in new tab">
                        <svg viewBox="0 0 24 24">
                            <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z" />
                        </svg>
                    </button>
                </div>
                <button class="btn-icon viewer-direction-btn right"
                    *ngIf="images.length > 1"
                     (click)="nextImage(1)"
                    aria-label="Next image">
                    <svg class="viewer-direction-icon" viewBox="0 0 24 24">
                        <use href="#chevron-right"></use>
                    </svg>
                </button>
            </div>
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
    loading: boolean = true;
    index: number;

    ngOnChanges(changes) {
        const data = changes.data;

        if (data.isFirstChange()) {
            return;
        }
        this.index = data.currentValue.startIndex;
        this.images = data.currentValue.images;
        this.loading = true;
    }

    handleLoad({ target }) {
        const maxWidth = target.parentElement.offsetWidth;
        const maxHeight = target.parentElement.offsetHeight - 20;

        target.style.maxWidth = `${maxWidth}px`;
        target.style.maxHeight = `${maxHeight}px`;

        this.loading = false;
        this.images[this.index].loaded = true;
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

    openImage() {
        window.open(this.images[this.index].url, '_blank');
    }

    closeViewer() {
        this.images.length = 0;
    }
}
