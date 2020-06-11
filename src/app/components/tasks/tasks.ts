import { Component, ViewChild } from "@angular/core";
import { moveItemInArray } from "@angular/cdk/drag-drop";
import { ChromeStorageService } from "../../services/chromeStorageService";
import { SettingService } from "../../services/settingService";
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
    @ViewChild("container") container;

    visible = false;
    makingEdit = false;
    willBeEmpty = false;
    dropdownVisible = false;
    settingsVisible = false;
    resizingEnabled = false;
    timeout = 0;
    zIndex = 0;
    removedTaskCount = 0;
    formColor = "";
    labelMessage = "";
    tasks: Task[] = [];
    tasksToRemove = [];
    temporaryTask = null;
    oldLabels: Label[] = JSON.parse(localStorage.getItem("old-task-labels")) || [];
    formLabels: Label[] = [];
    boundWindowClickHandler = this.handleWindowClick.bind(this);

    constructor(
        private chromeStorageService: ChromeStorageService,
        private settingService: SettingService,
        private zIndexService: ZIndexService
    ) {}

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

    ngAfterViewInit() {
        const { height } = this.settingService.getSetting("tasks") || {};

        if (typeof height === "number") {
            this.container.nativeElement.style.setProperty("--height", `${height}px`);
        }
    }

    toggle() {
        this.visible = !this.visible;

        if (this.visible) {
            this.zIndex = this.zIndexService.inc();
        }
        else if (this.temporaryTask) {
            this.hideForm();
        }
        else {
            this.settingsVisible = false;
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

    toggleDropdown() {
        this.dropdownVisible = !this.dropdownVisible;
        window.addEventListener("click", this.boundWindowClickHandler);
    }

    handleWindowClick(event) {
        if (event.target.closest(".abs")) {
            event.preventDefault();
            return;
        }
        this.dropdownVisible = false;
        window.removeEventListener("click", this.boundWindowClickHandler);
    }

    showSettings() {
        this.settingsVisible = true;
    }

    hideSettings() {
        this.settingsVisible = false;
    }

    toggleResizing() {
        this.resizingEnabled = !this.resizingEnabled;
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
                text: elements.value.trim()
            }];
        }
        else if (elements.length) {
            return Array.from(elements).reduce((tasks: Subtask[], { value }) => {
                const text = value.trim();

                if (text) {
                    tasks.push({ text });
                }
                return tasks;
            }, []);
        }
        return [];
    }

    handleFormSubmit(event) {
        const { elements } = event.target;
        const task: Task = {
            text: elements.text.value.trim(),
            subtasks: this.getSubtasks(elements.subtask) as Subtask[],
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
                delete label.flagged;
                labels.push(label);
            }
            return labels;
        }, []);

        return [...taskLabels, ...labels];
    }

    findLabel(labels: Label[], { title, color }): Label {
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

    getUniqueTaskLabels(taskIndex = -1): Label[] {
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
        }, [] as Label[]);
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
            if (this.oldLabels.length > 9) {
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

    saveHeight(height) {
        this.settingService.updateSetting({
            tasks: { height }
        });
    }

    drop({ currentIndex, previousIndex }) {
        moveItemInArray(this.tasks, previousIndex, currentIndex);
        this.saveTasks();
    }
}
