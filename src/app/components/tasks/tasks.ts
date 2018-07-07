import { Component, ViewChild } from "@angular/core";
import { ChromeStorageService } from "../../services/chromeStorageService";
import { ZIndexService } from "../../services/zIndexService";

interface Task {
    text: string;
    completed?: boolean;
    pinned?: boolean;
    removing?: boolean;
    subtasks: Subtask[];
}

interface Subtask {
    text: string;
    completed?: boolean;
}

@Component({
    selector: "tasks",
    templateUrl: "./tasks.html"
})
export class Tasks {
    @ViewChild("subtaskList") subtaskList;

    visible: boolean = false;
    makingEdit: boolean = false;
    zIndex: number = 0;
    tasks: Task[] = [];
    temporaryTask: any = null;

    constructor(private chromeStorageService: ChromeStorageService, private zIndexService: ZIndexService) {}

    ngOnInit() {
        this.chromeStorageService.subscribeToChanges(({ tasks }) => {
            if (tasks) {
                this.tasks = [...tasks.newValue];
            }
        });
        this.chromeStorageService.get(["todos", "tasks"], storage => {
            const keys = Object.keys(storage);

            for (const key of keys) {
                const items = storage[key].map(item => {
                    if (!item.subtasks) {
                        item.subtasks = [];
                    }
                    return item;
                });
                this.tasks = [...this.tasks, ...items];

                if (key === "todos") {
                    this.chromeStorageService.remove("todos");
                    this.saveTasks();
                }
            }
        });
    }

    toggle() {
        this.visible = !this.visible;

        if (this.visible) {
            this.zIndex = this.zIndexService.inc();
        }
    }

    showForm() {
        this.temporaryTask = {
            text: "",
            subtasks: []
        };
    }

    hideForm() {
        this.temporaryTask = null;
        this.makingEdit = false;
    }

    addSubtask() {
        this.temporaryTask.subtasks.push({ text: "" } as Subtask);
    }

    removeTemporarySubtask(index) {
        this.temporaryTask.subtasks.splice(index, 1);
    }

    getSubtasks(subtasks) {
        if (!this.subtaskList) {
            return [];
        }
        const elements = this.subtaskList.nativeElement.querySelectorAll(".input");

        return subtasks.reduce((tasks, task, index) => {
            const text = elements[index].value;

            if (text) {
                task.text = text;
                tasks.push(task);
            }
            return tasks;
        }, []);
    }

    handleFormSubmit(event) {
        const task: Task = {
            text: event.target.elements.text.value,
            subtasks: this.getSubtasks(this.temporaryTask.subtasks)
        };

        if (this.makingEdit) {
            const { index } = this.temporaryTask;

            this.tasks[index] = { ...this.tasks[index], ...task };
        }
        else {
            const { length } = this.tasks.filter(task => task.pinned);

            this.tasks.splice(length, 0, task);
        }
        this.saveTasks();
        this.hideForm();
        event.preventDefault();
    }

    completeTask(index) {
        const task = this.tasks[index];
        task.completed = !task.completed;

        if (task.completed && task.pinned) {
            const newIndex = this.tasks.filter(task => task.pinned).length - 1;
            task.pinned = false;

            if (index !== newIndex) {
                this.tasks.splice(index, 1);
                this.tasks.splice(newIndex, 0, task);
            }
        }
        this.saveTasks();
    }

    pinTask(index) {
        const task = this.tasks[index];
        let { length } = this.tasks.filter(task => task.pinned);
        task.pinned = !task.pinned;

        if (!task.pinned) {
            length -= 1;
        }

        if (index !== length) {
            this.tasks.splice(index, 1);
            this.tasks.splice(length, 0, task);
        }
        this.saveTasks();
    }

    editTask(index) {
        const { text, subtasks } = this.tasks[index];

        this.makingEdit = true;
        this.temporaryTask = {
            index,
            text,
            subtasks: [...subtasks]
        };
    }

    removeTask(index) {
        this.tasks[index].removing = true;

        window.setTimeout(() => {
            this.tasks.splice(index, 1);
            this.saveTasks();
        }, 200);
    }

    comepleteSubtask(task) {
        task.completed = !task.completed;
    }

    handleClickOnContainer() {
        this.zIndex = this.zIndexService.incIfLess(this.zIndex);
    }

    saveTasks() {
        this.chromeStorageService.set({ tasks: this.tasks });
    }
}
