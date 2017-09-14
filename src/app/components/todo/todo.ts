/* global chrome */

import { Component } from "@angular/core";

@Component({
    selector: "todo",
    templateUrl: "./todo.html"
})
export class Todo {
    visible: boolean = false;
    todos: Array<any> = [];
    todoBeingEdited: any;

    ngOnInit() {
        chrome.storage.sync.get("todos", storage => {
            this.todos = storage.todos || [];
        });
    }

    toggle() {
        this.visible = !this.visible;
    }

    addTodo({ target }) {
        if (!target.checkValidity()) {
            return;
        }
        const todo = { text: target.elements.input.value };
        const index = this.todos.filter(todo => todo.pinned).length;

        this.todos.splice(index, 0, todo);
        this.saveTodos(this.todos);
        target.reset();
    }

    markTodoDone(index, done) {
        const todo = this.todos[index];
        let firstDoneTodoIndex = this.todos.findIndex(todo => todo.done);
        todo.done = done.checked;
        todo.pinned = false;

        if (todo.done) {
            if (firstDoneTodoIndex === -1) {
                firstDoneTodoIndex = this.todos.length;
            }
            firstDoneTodoIndex -= 1;
        }
        this.todos.splice(index, 1);
        this.todos.splice(firstDoneTodoIndex, 0, todo);
        this.saveTodos(this.todos);
    }

    pinTodo(index) {
        const todo = this.todos[index];
        let lastPinnedTodoIndex = this.todos.filter(todo => todo.pinned).length;
        todo.pinned = !todo.pinned;

        if (!todo.pinned) {
            lastPinnedTodoIndex -= 1;
        }
        this.todos.splice(index, 1);
        this.todos.splice(lastPinnedTodoIndex, 0, todo);
        this.saveTodos(this.todos);
    }

    removeTodo(index) {
        this.todos.splice(index, 1);
        this.saveTodos(this.todos);
    }

    removeTodos() {
        this.todos = this.todos.filter(todo => !todo.done);
        this.saveTodos(this.todos);
    }

    saveTodos(todos) {
        chrome.storage.sync.set({ todos });
    }

    enableTodoEdit(text, index) {
        this.todoBeingEdited = { text, index };
    }

    saveTodoEdit() {
        const { text, index } = this.todoBeingEdited;

        if (text && text !== this.todos[index].text) {
            this.todos[index].text = text;
            this.saveTodos(this.todos);
        }
        this.cancelTodoEdit();
    }

    cancelTodoEdit() {
        this.todoBeingEdited = null;
    }
}
