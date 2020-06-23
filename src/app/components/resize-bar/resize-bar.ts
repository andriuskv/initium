import { Component, ElementRef, Output, EventEmitter } from "@angular/core";

@Component({
    selector: "resize-bar",
    styles: [`
        :host {
            display: block;
            height: 8px;
            padding-top: 6px;
            pointer-events: auto;
            cursor: row-resize;
        }

        :host::before {
            content: "";
            position: relative;
            display: block;
            width: calc(100% - 16px);
            height: 2px;
            margin: 0 8px;
            background-color: #359ee9;
        }
    `],
})
export class ResizeBar {
    @Output() pointerUp = new EventEmitter();

    startY = 0;
    initialHeight = 0;
    height = 0;
    ref = null;
    boundHandlePointerDown = this.handlePointerDown.bind(this);
    boundHandlePointerMove = this.handlePointerMove.bind(this);
    boundHandlePointerUp = this.handlePointerUp.bind(this);

    constructor(ref: ElementRef) {
        this.ref = ref;
        ref.nativeElement.addEventListener("pointerdown", this.boundHandlePointerDown);
    }

    handlePointerDown({ which, clientY }) {
        if (which !== 1) {
            return;
        }
        this.startY = clientY;
        this.initialHeight = this.ref.nativeElement.parentElement.offsetHeight;
        document.body.style.userSelect = "none";
        window.addEventListener("pointermove", this.boundHandlePointerMove);
        window.addEventListener("pointerup", this.boundHandlePointerUp);
    }

    handlePointerMove({ clientY }) {
        this.height = clientY - this.startY + this.initialHeight;

        if (this.height < 240) {
            this.height = 240;
        }
        this.ref.nativeElement.parentElement.style.setProperty("--height", `${this.height}px`);
    }

    handlePointerUp() {
        this.pointerUp.emit(this.height);
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", this.boundHandlePointerMove);
        window.removeEventListener("pointerup", this.boundHandlePointerUp);
    }
}
