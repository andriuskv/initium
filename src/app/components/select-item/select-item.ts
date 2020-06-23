import { Component, ElementRef, Input, Output, EventEmitter } from "@angular/core";

@Component({
    selector: "select-item",
    templateUrl: "./select-item.html",
    styleUrls: ["./select-item.scss"]
})
export class SelectItem {
    @Output() onSelectedItem = new EventEmitter();
    @Input() selected = "";

    listVisible = false;
    selectedItem = "";
    ref = null;
    boundWindowClickHandler = this.handleWindowClick.bind(this);

    constructor(ref: ElementRef) {
        this.ref = ref;
    }

    ngAfterViewInit() {
        window.addEventListener("click", this.boundWindowClickHandler);

        requestAnimationFrame(() => {
            for (const element of this.ref.nativeElement.querySelectorAll(".select-item-list-item")) {
                const id = element.getAttribute("data-id");

                if (id === this.selected) {
                    this.selectedItem = element.textContent;
                    break;
                }
            }
        });
    }

    ngOnDestroy() {
        window.removeEventListener("click", this.boundWindowClickHandler);
    }

    toggleList() {
        this.listVisible = !this.listVisible;
    }

    selectItem({ target }) {
        const element = target.closest(".select-item-list-item");

        if (!element) {
            return;
        }
        const id = element.getAttribute("data-id");

        this.onSelectedItem.emit(id);
        this.selectedItem = element.textContent;
        this.listVisible = false;
    }

    handleWindowClick({ target }) {
        const container = target.closest(".select-item-container");

        if (!container) {
            this.listVisible = false;
        }
    }
}
