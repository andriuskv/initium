import { Directive, ElementRef } from "@angular/core";
import { SettingService } from "../services/settingService";

@Directive({
    selector: "resize-bar"
})
export class ResizeDirective {
    startY = 0;
    initialHeight = 0;
    height = 0;
    ref = null;
    boundHandlePointerDown = this.handlePointerDown.bind(this);
    boundHandlePointerMove = this.handlePointerMove.bind(this);
    boundHandlePointerUp = this.handlePointerUp.bind(this);

    constructor(ref: ElementRef, private settingService: SettingService) {
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
        this.settingService.updateSetting({
            mainBlock: {
                height: this.height
            }
        });
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", this.boundHandlePointerMove);
        window.removeEventListener("pointerup", this.boundHandlePointerUp);
    }
}
