import { Component, Inject } from "@angular/core";
import { DOCUMENT } from "@angular/platform-browser";
import { ChromeStorageService } from "../../services/chromeStorageService";
import { ZIndexService } from "../../services/zIndexService";

@Component({
    selector: "todo",
    templateUrl: "./todo.html"
})
export class Todo {
    visible: boolean = false;
    zIndex: number = 0;
    todos: Array<any> = [];
    todoBeingEdited: any = null;

    constructor(
        @Inject(DOCUMENT) private document,
        private chromeStorageService: ChromeStorageService,
        private zIndexService: ZIndexService
    ) {
        this.document = document;
        this.chromeStorageService = chromeStorageService;
        this.zIndexService = zIndexService;
    }

    ngOnInit() {
        this.chromeStorageService.subscribeToChanges(this.chromeStorageChangeHandler.bind(this));
        this.chromeStorageService.get("todos", storage => {
            this.todos = storage.todos || [];
        });
    }

    toggle() {
        this.visible = !this.visible;

        if (this.visible) {
            this.zIndex = this.zIndexService.inc();
        }
    }

    addTodo(event) {
        event.preventDefault();

        if (!event.target.checkValidity()) {
            return;
        }
        const todo = { text: event.target.elements.input.value };
        const index = this.todos.filter(todo => todo.pinned).length;

        this.todos.splice(index, 0, todo);
        this.saveTodos(this.todos);
        event.target.reset();
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
        this.chromeStorageService.set({ todos });
    }

    enableTodoEdit(text, index) {
        this.todoBeingEdited = { text, index };
    }

    saveTodoEdit() {
        const { value } = this.document.querySelector(".todo-edit-input");
        const { index } = this.todoBeingEdited;
        const todo = this.todos[index];

        if (value && value !== todo.text) {
            todo.text = value;
            this.saveTodos(this.todos);
        }
        this.cancelTodoEdit();
    }

    cancelTodoEdit() {
        this.todoBeingEdited = null;
    }

    handleClickOnContainer() {
        this.zIndex = this.zIndexService.incIfLess(this.zIndex);
    }

    chromeStorageChangeHandler({ todos }) {
        if (todos) {
            this.todos = [...todos.newValue];
        }
    }
}
