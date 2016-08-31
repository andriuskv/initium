import { Component } from "@angular/core";

@Component({
    selector: "todo",
    templateUrl: "app/components/todo/todo.html"
})
export class Todo {
    visible = false;

    ngOnInit() {
        this.todos = JSON.parse(localStorage.getItem("todos")) || this.populateWithEmptyTodos();
        this.hasTodo = this.todos.some(todo => todo.text);
    }

    toggle() {
        this.visible = !this.visible;

        if (this.visible) {
            this.editedTodo = false;
        }
    }

    populateWithEmptyTodos(num = 0) {
        const todos = [];
        let toAdd = 10 - num;

        while (toAdd--) {
            todos.push({ text: "", done: false });
        }
        return todos;
    }

    hasEmptyTodo() {
        return this.todos.some(todo => !todo.text);
    }

    addTodo(todo) {
        if (todo.value) {
            this.todos.unshift({ text: todo.value, done: false });
            todo.value = "";

            if (this.hasEmptyTodo()) {
                this.todos.pop();
            }
            this.hasTodo = this.todos.some(todo => todo.text);
            this.saveTodos(this.todos);
        }
    }

    markTodoDone(i, done) {
        this.todos[i].done = done.checked;
        this.saveTodos(this.todos);
    }

    removeTodo(i) {
        this.todos.splice(i, 1);

        if (this.todos.length < 10) {
            this.todos.push({ text: "", done: false });
        }
        this.hasTodo = this.todos.some(todo => todo.text);
        this.saveTodos(this.todos);
    }

    removeTodos() {
        this.todos = this.todos.filter(todo => !todo.done);

        if (this.todos.length < 10) {
            this.todos = this.todos.concat(this.populateWithEmptyTodos(this.todos.length));
        }
        this.hasTodo = this.todos.some(todo => todo.text);
        this.saveTodos(this.todos);
    }

    saveTodos(todos) {
        localStorage.setItem("todos", JSON.stringify(todos));
    }

    enableTodoEdit(todo, i) {
        if (!todo.text) {
            return;
        }
        this.editedTodo = {
            text: todo.text,
            index: i
        };
        this.visible = false;
    }

    onEdit(edit) {
        this.visible = edit.visible;

        if (!edit.text || edit.text === this.todos[this.editedTodo.index].text) {
            return;
        }
        this.todos[this.editedTodo.index].text = edit.text;
        this.saveTodos(this.todos);
    }
}
