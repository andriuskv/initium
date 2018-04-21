import { Component, ViewChild } from "@angular/core";
import { ChromeStorageService } from "../../services/chromeStorageService";
import { ZIndexService } from "../../services/zIndexService";

@Component({
    selector: "todo",
    templateUrl: "./todo.html"
})
export class Todo {
    @ViewChild("textarea") textarea;

    visible: boolean = false;
    hasDoneTodos: boolean = false;
    zIndex: number = 0;
    todos: Array<any> = [];
    todoBeingEdited: any = null;

    constructor(
        private chromeStorageService: ChromeStorageService,
        private zIndexService: ZIndexService
    ) {
        this.chromeStorageService = chromeStorageService;
        this.zIndexService = zIndexService;
    }

    ngOnInit() {
        this.chromeStorageService.subscribeToChanges(this.chromeStorageChangeHandler.bind(this));
        this.chromeStorageService.get("todos", storage => {
            this.todos = storage.todos || [];
            this.checkForDoneTodos();
        });
    }

    toggle() {
        this.visible = !this.visible;

        if (this.visible) {
            this.zIndex = this.zIndexService.inc();
        }
    }

    addTodo(event) {
        const todo = { text: event.target.elements.input.value };
        const index = this.todos.filter(todo => todo.pinned).length;

        this.todos.splice(index, 0, todo);
        this.saveTodos(this.todos);
        event.preventDefault();
        event.target.reset();
    }

    markTodoDone(todo, index) {
        todo.done = !todo.done;

        if (todo.done && todo.pinned) {
            const newIndex = this.todos.filter(todo => todo.pinned).length - 1;
            todo.pinned = false;

            this.todos.splice(index, 1);
            this.todos.splice(newIndex, 0, todo);
        }
        this.checkForDoneTodos();
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
        this.checkForDoneTodos();
        this.saveTodos(this.todos);
    }

    removeTodos() {
        this.todos = this.todos.filter(todo => !todo.done);
        this.checkForDoneTodos();
        this.saveTodos(this.todos);
    }

    saveTodos(todos) {
        this.chromeStorageService.set({ todos });
    }

    editTodo(text, index) {
        this.todoBeingEdited = { text, index };
    }

    saveTodoEdit() {
        const { value } = this.textarea.nativeElement;
        const { index } = this.todoBeingEdited;
        const todo = this.todos[index];

        if (value && value !== todo.text) {
            todo.text = value;
            this.saveTodos(this.todos);
        }
        this.cancelTodoEdit();
    }

    checkForDoneTodos() {
        this.hasDoneTodos = this.todos.some(todo => todo.done);
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
