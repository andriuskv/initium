import { Component } from "@angular/core";
import { moveItemInArray } from "@angular/cdk/drag-drop";
import { ChromeStorageService } from "../../services/chromeStorageService";
import { ZIndexService } from "../../services/zIndexService";
import { getRandomHexColor } from "../../utils/utils";

interface Task {
    text: string;
    removing?: boolean;
    subtasks: Subtask[];
    labels?: Label[];
}

interface Subtask {
    text: string;
    removing?: boolean;
}

interface Label {
    color: string;
    title: string;
    flagged?: boolean;
}

@Component({
    selector: "tasks",
    templateUrl: "./tasks.html",
    styleUrls: ["./tasks.scss"]
})
export class Tasks {
    visible: boolean = false;
    makingEdit: boolean = false;
    willBeEmpty: boolean = false;
    timeout: number = 0;
    zIndex: number = 0;
    removedTaskCount: number = 0;
    formColor: string = "";
    labelMessage: string = "";
    tasks: Task[] = [];
    tasksToRemove: any[] = [];
    temporaryTask: any = null;
    oldLabels: Label[] = JSON.parse(localStorage.getItem("old-task-labels")) || [];
    formLabels: Label[] = [];

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
        this.formLabels = this.getFormLabels();
        this.temporaryTask = {
            text: "",
            subtasks: []
        };
    }

    hideForm() {
        this.temporaryTask = null;
        this.makingEdit = false;
        this.formLabels.length = 0;
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
            this.tasks.unshift(task);
        }
        this.saveTasks();
        this.hideForm();
        event.preventDefault();
    }

    editTask(index) {
        const { text, subtasks } = this.tasks[index];

        this.makingEdit = true;
        this.formColor = getRandomHexColor();
        this.formLabels = this.getFormLabels(index);
        this.temporaryTask = {
            index,
            text,
            subtasks: [...subtasks]
        };
    }

    removeTask(index) {
        this.tasks[index].removing = true;

        window.setTimeout(() => {
            this.scheduleTaskRemoval(index);
            this.willBeEmpty = this.tasks.filter(task => !task.removing).length < 1;
        }, 400);
    }

    removeSubtask(taskIndex, subtaskIndex) {
        this.tasks[taskIndex].subtasks[subtaskIndex].removing = true;

        window.setTimeout(() => {
            this.scheduleTaskRemoval(taskIndex, subtaskIndex);
        }, 400);
    }

    scheduleTaskRemoval(taskIndex, subtaskIndex = -1) {
        this.removedTaskCount += 1;
        this.tasksToRemove.push({ taskIndex, subtaskIndex });
        clearTimeout(this.timeout);

        this.timeout = window.setTimeout(() => {
            this.removeCompletedTasks();
        }, 8000);
    }

    removeCompletedTasks() {
        this.willBeEmpty = false;
        this.tasksToRemove.length = 0;
        this.tasks = this.tasks.filter(task => {
            task.subtasks = task.subtasks.filter(subtask => !subtask.removing);
            return !task.removing;
        });
        this.saveTasks();
        window.setTimeout(() => {
            this.removedTaskCount = 0;
        }, 200);
    }

    undoTaskRemoval() {
        clearTimeout(this.timeout);

        for (const { taskIndex, subtaskIndex } of this.tasksToRemove) {
            const task = this.tasks[taskIndex];

            if (subtaskIndex >= 0) {
                delete task.subtasks[subtaskIndex].removing;
            }
            else {
                delete task.removing;
            }
        }
        this.willBeEmpty = false;
        this.tasksToRemove.length = 0;
        window.setTimeout(() => {
            this.removedTaskCount = 0;
        }, 200);
    }

    getFormLabels(index = -1) {
        const taskLabels = this.getUniqueTaskLabels(index);
        const labels = this.oldLabels.reduce((labels, label) => {
            if (!this.findLabel(taskLabels, label)) {
                labels.push(label);
            }
            return labels;
        }, []);

        return [...taskLabels, ...labels];
    }

    findLabel(labels, { title, color }) {
        return labels.find(label => label.title === title && label.color === color);
    }

    getFlaggedLabels() {
        return this.formLabels.reduce((labels, label) => {
            if (label.flagged) {
                delete label.flagged;
                labels.push(label);
            }
            return labels;
        }, []);
    }

    getUniqueTaskLabels(taskIndex = -1) {
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
        const label = this.findLabel(this.formLabels, { title, color });

        if (label) {
            this.labelMessage = "Label with current title and color combination already exists";

            setTimeout(() => {
                this.labelMessage = "";
            }, 4000);
        }
        else if (title && color) {
            if (this.oldLabels.length > 4) {
                this.oldLabels.shift();
            }
            this.oldLabels.push({ title, color });
            this.formLabels.push({ title, color, flagged: true });
            this.formColor = getRandomHexColor();
            elements.title.value = "";
            localStorage.setItem("old-task-labels", JSON.stringify(this.oldLabels));
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

    drop({ currentIndex, previousIndex }) {
        moveItemInArray(this.tasks, previousIndex, currentIndex);
    }
}
