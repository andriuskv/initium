import { Component, Output, EventEmitter } from "@angular/core";
import { SettingService } from "../../services/settingService";

@Component({
    selector: "settings",
    templateUrl: "./settings.html"
})
export class Settings {
    @Output() showBackgroundViewer = new EventEmitter();

    backgroundUrlInvalid: boolean = false;
    active: string = "general";
    settingMessages: any = {};
    settings: any;

    constructor(private settingService: SettingService) {
        this.settings = this.settingService.getSettings();
    }

    ngOnInit() {
        this.settingService.subscribeToMessageChanges(message => {
            this.settingMessages = { ...this.settingMessages, ...message };
        });
    }

    setActiveTab(tab) {
        this.active = tab;
    }

    setSetting(setting) {
        this.settings = this.settingService.updateSetting({
            [this.active]: setting
        });
    }

    resetSetting(setting) {
        this.settingService.announceSettingChange({
            [this.active]: setting
        });
    }

    toggleSettingCheckbox(settingName) {
        this.setSetting({
            [settingName]: !this.settings[this.active][settingName]
        });
    }

    toggleTimeFormat() {
        const { format } = this.settings[this.active];

        this.setSetting({ format: format === 24 ? 12 : 24 });
    }

    toggleTemperatureUnits() {
        const { units } = this.settings[this.active];

        this.setSetting({ units: units === "C" ? "F" : "C" });
    }

    setPomodoroDuration({ target }, settingName) {
        let value = parseInt(target.value, 10);

        if (!value || value <= 0) {
            value = 1;
            target.value = value;
        }
        this.setSetting({
            [settingName]: value
        });
    }

    openBackgroundViewer() {
        this.showBackgroundViewer.emit(this.settings.background);
    }

    updateBackground(url = "") {
        this.setSetting({
            url,
            x: 50,
            y: 50
        });
    }

    showBackgroundForm() {
        if (this.backgroundUrlInvalid) {
            this.backgroundUrlInvalid = false;
        }
        this.setActiveTab("background-form");
    }

    handleBackgroundFormSubmit(event) {
        const [input] = event.target.elements;
        const image = new Image();

        if (this.backgroundUrlInvalid) {
            this.backgroundUrlInvalid = false;
        }
        event.preventDefault();

        if (!input.value) {
            this.setActiveTab("background");
            this.updateBackground();
        }

        image.onload = () => {
            this.setActiveTab("background");
            this.updateBackground(input.value);
        };

        image.onerror = () => {
            this.backgroundUrlInvalid = true;
        };

        image.src = input.value;
    }
}
