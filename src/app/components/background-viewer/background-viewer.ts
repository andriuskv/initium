import { Component, Input, Output, EventEmitter, ViewChild } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";
import { SettingService } from "../../services/settingService";
import { BackgroundService } from "../../services/backgroundService";

@Component({
    selector: "background-viewer",
    templateUrl: "./background-viewer.html",
    styleUrls: ["./background-viewer.scss"]
})
export class BackgroundViewer {
    @ViewChild("containerElement", { static: true }) containerElement;
    @Output() close = new EventEmitter();
    @Input() data;

    url = "";
    loading = true;
    boundMouseMoveHandler: any;
    viewport: any = {
        width: 0,
        height: 0
    };
    image: any = {
        width: 0,
        height: 0
    };
    startingMousePosition: any = {
        x: 0,
        y: 0
    };
    area: any = {
        width: 0,
        height: 0,
        x: 0,
        y: 0
    };

    constructor(
        private settingService: SettingService,
        private backgroundService: BackgroundService,
        private sanitizer: DomSanitizer
    ) {}

    async ngOnInit() {
        if (this.data.id) {
            const image = await this.backgroundService.getIDBBackground(this.data.id);
            const blobUrl = URL.createObjectURL(image);

            this.url = this.sanitizer.bypassSecurityTrustUrl(blobUrl) as string;
            this.data = {
                ...this.data,
                blobUrl
            };
        }
        else {
            this.url = this.data.url;
        }
    }

    handleLoad({ target }) {
        const { naturalWidth, naturalHeight } = target;
        const { innerWidth, innerHeight } = window;

        target.style.maxWidth = `${innerWidth - 96}px`;
        target.style.maxHeight = `${innerHeight - 64}px`;

        this.viewport = {
            width: innerWidth,
            height: innerHeight
        };

        setTimeout(() => {
            const { width, height } = target;
            this.loading = false;
            this.image = {
                naturalWidth,
                naturalHeight,
                width,
                height
            };
            this.initArea();
        }, 200);
    }

    handleMouseDown(event) {
        if (event.which === 1) {
            this.startingMousePosition = this.getMousePosition(event, event.currentTarget);
            this.boundMouseMoveHandler = this.handleMouseMove.bind(this);

            window.addEventListener("mousemove", this.boundMouseMoveHandler);
            window.addEventListener("mouseup", this.handleMouseUp.bind(this), { once: true });
        }
    }

    handleMouseMove(event) {
        const { x, y } = this.getMousePosition(event, this.containerElement.nativeElement);
        this.area.x = this.normalizeSelectionAreaPosition(x - this.startingMousePosition.x, "width");
        this.area.y = this.normalizeSelectionAreaPosition(y - this.startingMousePosition.y, "height");
    }

    handleMouseUp() {
        window.removeEventListener("mousemove", this.boundMouseMoveHandler);
        this.boundMouseMoveHandler = null;
    }

    updateBackgroundPosition() {
        this.settingService.updateSetting({
            background: {
                x: this.getBackgroundPosition(this.area.x, "width"),
                y: this.getBackgroundPosition(this.area.y, "height")
            }
        }, { type: "position" });
        this.closeViewer();
    }

    resetAreaPosition() {
        this.area.x = (this.image.width / 2) - (this.area.width / 2);
        this.area.y = (this.image.height / 2) - (this.area.height / 2);
    }

    getBackgroundPosition(value, dimensionName) {
        const areaDimension = this.area[dimensionName];
        const imageDimension = this.image[dimensionName];
        const diff = imageDimension - areaDimension;

        if (diff === 0) {
            return 0;
        }
        return value / (imageDimension - areaDimension) * 100;
    }

    normalizeSelectionAreaPosition(value, dimensionName) {
        const areaDimension = this.area[dimensionName];
        const imageDimension = this.image[dimensionName];

        if (value < 0) {
            value = 0;
        }
        else if (value + areaDimension > imageDimension) {
            value = imageDimension - areaDimension;
        }
        return value;
    }

    getAreaSize() {
        const { width: viewportWidth, height: viewportHeight } = this.viewport;
        const { width: containerWidth, height: containerHeight } = this.image;
        const dimension = this.getLeastScaledDimension();
        let width = 0;
        let height = 0;

        if (dimension === "height") {
            height = containerHeight;
            width = viewportWidth / viewportHeight * height;

            if (width > containerWidth) {
                width = containerWidth;
                height = viewportHeight / viewportWidth * width;
            }
        }
        else {
            width = containerWidth;
            height = viewportHeight / viewportWidth * width;
        }
        return { width, height };
    }

    getLeastScaledDimension() {
        const { naturalWidth, naturalHeight } = this.image;
        const { width: viewportWidth, height: viewportHeight } = this.viewport;
        const widthDiff = Math.abs(naturalWidth - viewportWidth);
        const heightDiff = Math.abs(naturalHeight - viewportHeight);

        if (naturalWidth > viewportWidth || naturalHeight > viewportHeight) {
            return widthDiff > heightDiff ? "height" : "width";
        }
        return widthDiff > heightDiff ? "width" : "height";
    }

    getInitialAreaPosition(value, dimensionName) {
        const areaDimension = this.area[dimensionName];
        const imageDimension = this.image[dimensionName];

        if (typeof value === "number") {
            return value * (imageDimension - areaDimension) / 100;
        }
        return (imageDimension / 2) - (areaDimension / 2);
    }

    initArea() {
        const { x, y } = this.data;
        const { width, height } = this.getAreaSize();

        this.area.width = width;
        this.area.height = height;
        this.area.x = this.getInitialAreaPosition(x, "width");
        this.area.y = this.getInitialAreaPosition(y, "height");
    }

    getMousePosition({ clientX, clientY }, target) {
        const { left, top } = target.getBoundingClientRect();

        return {
            x: clientX - left,
            y: clientY - top
        };
    }

    closeViewer() {
        URL.revokeObjectURL(this.data.blobUrl);
        this.close.emit();
    }
}
