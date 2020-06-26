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

    ngOnChanges() {
        this.updateSelectedItem();
    }

    ngAfterViewInit() {
        window.addEventListener("click", this.boundWindowClickHandler);

        requestAnimationFrame(() => {
            this.updateSelectedItem();
        });
    }

    ngOnDestroy() {
        window.removeEventListener("click", this.boundWindowClickHandler);
    }

    toggleList() {
        this.listVisible = !this.listVisible;
    }

    updateSelectedItem() {
        for (const element of this.ref.nativeElement.querySelectorAll(".select-item-list-item")) {
            const id = element.getAttribute("data-id");

            if (id === this.selected) {
                this.selectedItem = element.textContent;
                break;
            }
        }
    }

    selectItem({ target }) {
        const element = target.closest(".select-item-list-item");

        if (!element) {
            return;
        }
        const id = element.getAttribute("data-id");
        this.listVisible = false;

        if (!id) {
            return;
        }
        this.onSelectedItem.emit(id);
        this.selectedItem = element.textContent;
    }

    handleWindowClick({ target }) {
        const container = target.closest(".select-item-container");

        if (!container) {
            this.listVisible = false;
        }
    }
}
