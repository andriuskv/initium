import { Component, Input } from "@angular/core";

@Component({
    selector: "main-block",
    template: `
        <div class="main-block" [class.is-item-bar-hidden]="isItemBarHidden">
            <main-block-nav (choice)="onChoice($event)"
                [setting]="mainBlockSetting"
                [newTweets]="tweetCount"
                [newEntries]="entryCount"
                [tabNameChange]="tabName">
            </main-block-nav>
            <main-block-content
                [choice]="item"
                [setting]="mainBlockSetting"
                (newTweets)="onNewTweets($event)"
                (newEntries)="onNewEntries($event)"
                (toggleTab)="onToggleTab($event)">
            </main-block-content>
        </div>
    `
})
export class MainBlock {
    @Input() setting;

    ngOnChanges(changes) {
        const setting = changes.setting.currentValue;

        if (setting) {
            this.mainBlockSetting = setting;

            if (typeof setting.hideItemBar === "boolean") {
                this.isItemBarHidden = setting.hideItemBar;
            }
        }
    }

    onChoice(choice) {
        this.item = choice;
    }

    onNewTweets(count) {
        this.tweetCount = count;
    }

    onNewEntries(count) {
        this.entryCount = count;
    }

    onToggleTab(name) {
        this.tabName = { name };
    }
}
