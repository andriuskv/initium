import { Component, Input } from "@angular/core";

@Component({
    selector: "todo-pin",
    template: `
        <ul class="panel">
            <li class="todo-text panel-item" *ngFor="let todo of todos; let i = index">{{todo.text}}</li>
        </ul>
    `
})
export class TodoPin {
    @Input() todos = [];
}
