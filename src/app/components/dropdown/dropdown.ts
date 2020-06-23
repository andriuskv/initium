import { Component, ElementRef, Input } from "@angular/core";

@Component({
    selector: "dropdown",
    templateUrl: "./dropdown.html",
    styleUrls: ["./dropdown.scss"]
})
export class Dropdown {
    @Input() id;
    @Input() className = {};
    @Input() needWorkaround = false;

    visible = false;
    ref = null;
    boundWindowClickHandler = this.handleWindowClick.bind(this);

    constructor(ref: ElementRef) {
        this.ref = ref;
    }

    toggleDropdown(event) {
        this.visible = !this.visible;

        if (this.visible) {
            window.addEventListener("click", this.boundWindowClickHandler);

            // Workaround when dropdown is in element with overflow: auto
            if (this.needWorkaround) {
                const { top, height } = event.currentTarget.getBoundingClientRect();
                this.ref.nativeElement.style.setProperty("--top", `${top - 8 + height + 4}px`);
            }
        }
        else {
            window.removeEventListener("click", this.boundWindowClickHandler);
        }
    }

    handleWindowClick(event) {
        const container = event.target.closest(".dropdown-container");
        let hideDropdown = true;

        if (container?.id === this.id) {
            hideDropdown = !!event.target.closest(".dropdown-item");
        }

        if (hideDropdown) {
            this.visible = false;
            window.removeEventListener("click", this.boundWindowClickHandler);
        }
    }
}
