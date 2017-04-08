/* global chrome */

import { Component } from "@angular/core";

@Component({
    selector: "todo",
    templateUrl: "app/components/todo/todo.html"
})
export class Todo {
    constructor() {
        this.visible = false;
        this.todos = [];
        this.todosToPin = [];

        chrome.storage.sync.get("todos", storage => {
            this.todos = storage.todos || JSON.parse(localStorage.getItem("todos")) || [];
            this.todosToPin = this.getPinnedTodos();
        });
    }

    toggle() {
        this.visible = !this.visible;

        if (!this.visible) {
            this.todosToPin = this.getPinnedTodos();
        }
    }

    getPinnedTodos() {
        return this.todos.filter(todo => todo.pinned);
    }

    addTodo(input) {
        const value = input.value.trim();

        if (!value) {
            return;
        }
        this.todos.unshift({ text: value, done: false });
        input.value = "";
        this.saveTodos(this.todos);
    }

    markTodoDone(index, done) {
        const todo = this.todos[index];

        todo.done = done.checked;

        if (todo.done && todo.pinned) {
            todo.pinned = false;
        }
        this.saveTodos(this.todos);
    }

    pinTodo(index) {
        this.todos[index].pinned = !this.todos[index].pinned;
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
