/* global chrome */

import { Component } from "@angular/core";
import { ZIndexService } from "../../services/zIndexService";

@Component({
    selector: "todo",
    templateUrl: "./todo.html"
})
export class Todo {
    visible: boolean = false;
    todos: Array<any> = [];
    todoBeingEdited: any;
    zIndex: number = 0;

    constructor(private zIndexService: ZIndexService) {
        this.zIndexService = zIndexService;
    }

    ngOnInit() {
        chrome.storage.sync.get("todos", storage => {
            this.todos = storage.todos || [];
        });
    }

    toggle() {
        this.visible = !this.visible;

        if (this.visible) {
            this.zIndex = this.zIndexService.inc();
        }
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
        todo.done = done.checked;

        if (todo.done && todo.pinned) {
            const newIndex = this.todos.filter(todo => todo.pinned).length - 1;
            todo.pinned = false;

            this.todos.splice(index, 1);
            this.todos.splice(newIndex, 0, todo);
        }
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
