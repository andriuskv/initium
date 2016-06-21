import { Component, Input } from "@angular/core";
import { MainBlockNav } from "app/components/main-block-nav/main-block-nav";
import { MainBlockContent } from "app/components/main-block-content/main-block-content";

@Component({
    selector: "main-block",
    directives: [MainBlockNav, MainBlockContent],
    template: `
        <div class="main-block">
            <main-block-nav (choice)="onChoice($event)"
                [newTweets]="tweetCount"
                [newEntries]="entryCount"
                [tabNameChange]="tabName">
            </main-block-nav>
            <main-block-content
                [choice]="item"
                [setting]="contentSetting"
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
        if (changes.setting.currentValue) {
            this.contentSetting = changes.setting.currentValue;
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
