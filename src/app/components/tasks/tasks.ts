import { Component } from "@angular/core";
import { ChromeStorageService } from "../../services/chromeStorageService";
import { ZIndexService } from "../../services/zIndexService";
import { getRandomHexColor } from "../../utils/utils";

interface Task {
    text: string;
    completed?: boolean;
    pinned?: boolean;
    removing?: boolean;
    subtasks: Subtask[];
    labels?: Label[];
}

interface Subtask {
    text: string;
    completed?: boolean;
}

interface Label {
    color: string;
    title: string;
    flagged?: boolean;
}

@Component({
    selector: "tasks",
    templateUrl: "./tasks.html"
})
export class Tasks {
    visible: boolean = false;
    makingEdit: boolean = false;
    zIndex: number = 0;
    tasks: Task[] = [];
    temporaryTask: any = null;
    formColor: string = "";
    labelMessage: string = "";

    constructor(private chromeStorageService: ChromeStorageService, private zIndexService: ZIndexService) {}

    ngOnInit() {
        this.chromeStorageService.subscribeToChanges(({ tasks }) => {
            if (tasks) {
                this.tasks = [...tasks.newValue];
            }
        });
        this.chromeStorageService.get("tasks", storage => {
            this.tasks = storage.tasks || [];
        });
    }

    toggle() {
        this.visible = !this.visible;

        if (this.visible) {
            this.zIndex = this.zIndexService.inc();
        }
    }

    showForm() {
        this.formColor = getRandomHexColor();
        this.temporaryTask = {
            labels: this.getUniqueLabels(),
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

    getSubtasks(elements) {
        if (!elements) {
            return [];
        }
        else if (elements.value) {
            return [{
                text: elements.value
            }];
        }
        else if (elements.length) {
            return Array.from(elements).reduce((tasks, { value }) => {
                if (value) {
                    tasks.push({ text: value } as Subtask);
                }
                return tasks;
            }, [] as any);
        }
    }

    handleFormSubmit(event) {
        const { elements } = event.target;
        const task: Task = {
            text: elements.text.value,
            subtasks: this.getSubtasks(elements.subtask),
            labels: this.getFlaggedLabels()
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
        task.subtasks = this.completeSubtasks(task.subtasks, task.completed);

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
        this.formColor = getRandomHexColor();
        this.temporaryTask = {
            index,
            labels: this.getUniqueLabels(index),
            text,
            subtasks: [...subtasks]
        };
    }

    removeTask(index) {
        this.tasks[index].removing = true;

        window.setTimeout(() => {
            this.tasks.splice(index, 1);
            this.saveTasks();
        }, 400);
    }

    completeSubtasks(tasks, completed) {
        return tasks.map(task => {
            task.completed = completed;
            return task;
        });
    }

    comepleteSubtask(task) {
        task.completed = !task.completed;
        this.saveTasks();
    }

    findLabel(labels, { title, color }) {
        return labels.find(label => label.title === title && label.color === color);
    }

    getFlaggedLabels() {
        return this.temporaryTask.labels.reduce((labels, label) => {
            if (label.flagged) {
                delete label.flagged;
                labels.push(label);
            }
            return labels;
        }, []);
    }

    getUniqueLabels(taskIndex = -1) {
        return this.tasks.reduce((labels, task, index) => {
            if (task.labels) {
                task.labels.forEach(label => {
                    const foundLabel = this.findLabel(labels, label);

                    if (!foundLabel) {
                        labels.push({ ...label, flagged: taskIndex === index });
                    }
                    else if (taskIndex === index) {
                        foundLabel.flagged = true;
                    }
                });
            }
            return labels;
        }, []);
    }

    createLabel(event) {
        const { elements } = event.target;
        const title = elements.title.value;
        const color = elements.color.value;
        const label = this.findLabel(this.temporaryTask.labels, { title, color });

        if (label) {
            this.labelMessage = "Label with current title and color combination already exists";

            setTimeout(() => {
                this.labelMessage = "";
            }, 4000);
        }
        else if (title && color) {
            this.temporaryTask.labels.push({ title, color, flagged: true });
            this.formColor = getRandomHexColor();
            elements.title.value = "";
        }
        event.preventDefault();
    }

    flagLabel(label) {
        label.flagged = !label.flagged;
    }

    updateLabelColor({ target }) {
        this.formColor = target.value;
    }

    handleClickOnContainer() {
        this.zIndex = this.zIndexService.incIfLess(this.zIndex);
    }

    saveTasks() {
        this.chromeStorageService.set({ tasks: this.tasks });
    }
}
