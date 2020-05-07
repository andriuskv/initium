import { Component, Output, EventEmitter } from "@angular/core";
import { SettingService } from "../../services/settingService";
import { BackgroundService } from "../../services/backgroundService";

@Component({
    selector: "settings",
    template: require("raw-loader!./settings.html").default,
    styleUrls: ["./settings.scss"]
})
export class Settings {
    @Output() showBackgroundViewer = new EventEmitter();

    backgroundUrlInvalid = false;
    active = "general";
    settingMessages: any = {};
    settings = this.settingService.getSettings();
    backgroundInfo = this.backgroundService.getBackgroundInfo();

    constructor(
        private settingService: SettingService,
        private backgroundService: BackgroundService
    ) {}

    ngOnInit() {
        this.settingService.subscribeToMessageChanges(message => {
            this.settingMessages = { ...this.settingMessages, ...message };
        });

        this.backgroundService.subscribeToChanges(info => {
            this.backgroundInfo = info;
        });
    }

    setActiveTab(tab) {
        this.active = tab;
    }

    updateSetting(setting) {
        this.settings = this.settingService.updateSetting({
            [this.active]: setting
        });
    }

    setSetting(setting) {
        this.settings = this.settingService.setSetting({
            [this.active]: setting
        });
    }

    resetSetting(setting) {
        this.settingService.announceSettingChange({
            [this.active]: setting
        });
    }

    toggleSettingCheckbox(settingName) {
        this.updateSetting({
            [settingName]: !this.settings[this.active][settingName]
        });
    }

    toggleTimeFormat() {
        const { format } = this.settings[this.active];

        this.updateSetting({ format: format === 24 ? 12 : 24 });
    }

    toggleTemperatureUnits() {
        const { units } = this.settings[this.active];

        this.updateSetting({ units: units === "C" ? "F" : "C" });
    }

    setPomodoroDuration({ target }, settingName) {
        let value = parseInt(target.value, 10);

        if (!value || value <= 0) {
            value = 1;
            target.value = value;
        }
        this.updateSetting({
            [settingName]: value
        });
    }

    openBackgroundViewer() {
        this.showBackgroundViewer.emit(this.settings.background);
    }

    resetBackground() {
        this.setSetting({ url: "" });
    }

    showBackgroundForm() {
        if (this.backgroundUrlInvalid) {
            this.backgroundUrlInvalid = false;
        }
        this.setActiveTab("background-form");
    }

    setBackground(url = "") {
        this.setActiveTab("background");
        this.setSetting({ url });
    }

    handleBackgroundFormSubmit(event) {
        const [input] = event.target.elements;
        const image = new Image();

        if (this.backgroundUrlInvalid) {
            this.backgroundUrlInvalid = false;
        }
        event.preventDefault();

        if (!input.value) {
            this.setBackground();
        }

        image.onload = () => {
            this.setBackground(input.value);
        };

        image.onerror = () => {
            this.backgroundUrlInvalid = true;
        };

        image.src = input.value;
    }

    async selectFile() {
        const image = await this.getImageFile() as File;

        this.backgroundService.setIDBBackground(image);
        this.setSetting({
            type: "blob",
            id: image.name
        });
    }

    getImageFile() {
        return new Promise(resolve => {
            const input = document.createElement("input");

            input.setAttribute("type", "file");
            input.setAttribute("accept", "image/*");
            input.onchange = ({ target }: any) => {
                resolve(target.files[0]);
                target = "";
                input.onchange = null;
            };
            input.click();
        });
    }
}
