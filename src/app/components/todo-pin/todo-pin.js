import { Component, Input } from "@angular/core";

@Component({
    selector: "todo-pin",
    template: `
        <ul>
            <li class="todo-text pinned-todo" *ngFor="let todo of todos; let i = index">{{todo.text}}</li>
        </ul>
    `
})
export class TodoPin {
    @Input() todos = [];
}
