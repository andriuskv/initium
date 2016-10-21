import { Component, Output, EventEmitter, Input } from "@angular/core";

@Component({
    selector: "todo-edit",
    template: `
        <div class="container">
            <header class="todo-header todo-edit-header">
                <button class="btn" (click)="saveTodo(input.value)">Save</button>
                <button class="btn" (click)="saveTodo()">Cancel</button>
            </header>
            <textarea class="input todo-edit-input" #input [value]="todoText"></textarea>
        </div>
    `
})
export class TodoEdit {
    @Output() edited = new EventEmitter();
    @Input() todo;

    constructor() {
        this.todoText = "";
    }

    ngOnChanges(changes) {
        if (changes.todo.currentValue) {
            this.todoText = changes.todo.currentValue.text;
        }
    }

    saveTodo(editedTodotext = "") {
        this.edited.emit({
            visible: true,
            text: editedTodotext
        });
    }
}
