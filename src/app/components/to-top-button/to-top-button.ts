import { Component, ElementRef } from "@angular/core";

@Component({
    selector: "to-top-button",
    template: `
        <button class="btn to-top-button" (click)="handleButtonClick()" *ngIf="visible">
            <svg viewBox="0 0 24 24">
                <use href="#chevron-up"></use>
            </svg>
        </button>
    `,
    styles: [`
        :host {
            z-index: 1;
            position: absolute;
            right: 18px;
            bottom: 8px;
        }
        .to-top-button {
            padding: 4px;
            border-radius: 50%;
        }
    `]
})
export class ToTopButton {
    visible = false;
    ref = null;
    scrollElement = null;
    boundHandleScroll = this.handleScroll.bind(this);

    constructor(ref: ElementRef) {
        this.ref = ref;
    }

    ngAfterViewInit() {
        this.scrollElement = this.ref.nativeElement.previousElementSibling;

        if (this.scrollElement.clientHeight < this.scrollElement.scrollHeight) {
            this.scrollElement.addEventListener("scroll", this.boundHandleScroll);
        }
    }

    ngOnDestroy() {
        this.scrollElement.removeEventListener("scroll", this.boundHandleScroll);
    }

    handleScroll({ target }) {
        this.visible = target.scrollTop > 0;
    }

    handleButtonClick() {
        this.scrollElement.scrollTop = 0;
        this.visible = false;
    }
}
