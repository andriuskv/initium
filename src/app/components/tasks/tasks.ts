import { Component, ViewChild } from "@angular/core";
import { moveItemInArray } from "@angular/cdk/drag-drop";
import { ChromeStorageService } from "../../services/chromeStorageService";
import { SettingService } from "../../services/settingService";
import { ZIndexService } from "../../services/zIndexService";
import { getRandomString, getRandomHexColor } from "../../utils/utils";

interface Group {
    id: string;
    name: string;
    expanded: boolean;
    removing?: boolean;
    tasks: Task[];
}

interface Task {
    text: string;
    displayText: string;
    removing?: boolean;
    subtasks: Subtask[];
    labels?: Label[];
}

interface Subtask {
    text: string;
    displayText: string;
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
    @ViewChild("groupNameInput") groupNameInput;

    visible = false;
    willBeEmpty = false;
    resizingEnabled = false;
    defaultGroupVisible = false;
    visibleItem = "list";
    taskSaveTimeout = 0;
    itemRemoveTimeout = 0;
    zIndex = 0;
    removingItems = this.resetRemovingItems();
    formColor = "";
    labelMessage = "";
    groups: Group[] = [{
        id: "unorganized",
        name: "Unorganized",
        expanded: true,
        tasks: []
    }];
    formTask = null;
    oldLabels: Label[] = JSON.parse(localStorage.getItem("old-task-labels")) || [];
    formLabels: Label[] = [];

    constructor(
        private chromeStorageService: ChromeStorageService,
        private settingService: SettingService,
        private zIndexService: ZIndexService
    ) {}

    ngOnInit() {
        this.chromeStorageService.subscribeToChanges(({ tasks }) => {
            if (tasks) {
                this.groups = [...this.addDisplayText(tasks.newValue)];
            }
        });
        this.chromeStorageService.get("tasks", storage => {
            const tasks = storage.tasks || [];

            // Migration to new format
            if (tasks[0]?.text) {
                this.groups[0] = {
                    id: "unorganized",
                    name: "Unorganized",
                    expanded: true,
                    tasks
                };
                this.groups = this.addDisplayText(this.groups);
                this.saveTasks();
            }
            else {
                this.groups = this.addDisplayText(tasks);
            }
        });
    }

    ngAfterViewInit() {
        const { height, defaultGroupVisible } = this.settingService.getSetting("tasks") || {};

        if (typeof height === "number") {
            this.container.nativeElement.style.setProperty("--height", `${height}px`);
        }

        if (typeof defaultGroupVisible === "boolean") {
            this.defaultGroupVisible = defaultGroupVisible;
        }
    }

    toggle() {
        this.visible = !this.visible;

        if (this.visible) {
            this.zIndex = this.zIndexService.inc();
        }
        else {
            this.hideItem();
        }
    }

    showForm() {
        this.formColor = getRandomHexColor();
        this.formLabels = this.getFormLabels();
        this.formTask = {
            text: "",
            subtasks: []
        };

        this.showItem("form");
    }

    hideForm() {
        this.formTask = null;
        this.formLabels.length = 0;

        this.hideItem();
    }

    addDisplayText(groups) {
        return groups.map(group => {
            group.tasks.map(task => {
                task.displayText = this.replaceLink(task.text);
                task.subtasks = task.subtasks.map(subtask => {
                    subtask.displayText = this.replaceLink(subtask.text);
                    return subtask;
                });
                return task;
            });
            return group;
        });
    }

    showItem(item) {
        this.visibleItem = item;
    }

    hideItem() {
        this.visibleItem = "list";
    }

    toggleGroupVisibility(group) {
        group.expanded = !group.expanded;

        clearTimeout(this.taskSaveTimeout);
        this.taskSaveTimeout = window.setTimeout(() => {
            this.saveTasks();
        }, 1000);
    }

    toggleResizing() {
        this.resizingEnabled = !this.resizingEnabled;
    }

    toggleDefaultGroupVisibility() {
        this.defaultGroupVisible = !this.defaultGroupVisible;

        if (!this.groups[0].expanded) {
            this.groups[0].expanded = true;
            this.saveTasks();
        }
        this.settingService.updateSetting({
            tasks: {
                defaultGroupVisible: this.defaultGroupVisible
            }
        });
    }

    addSubtask() {
        this.formTask.subtasks.push({ text: "" } as Subtask);
    }

    removeTemporarySubtask(index) {
        this.formTask.subtasks.splice(index, 1);
    }

    getSubtasks(elements) {
        if (!elements) {
            return [];
        }
        else if (elements.value) {
            const text = elements.value.trim();

            return [{
                text,
                displayText: this.replaceLink(text),
            } as Subtask];
        }
        else if (elements.length) {
            return Array.from(elements).reduce((tasks: Subtask[], { value }) => {
                const text = value.trim();

                if (text) {
                    tasks.push({
                        text,
                        displayText: this.replaceLink(text),
                    });
                }
                return tasks;
            }, []) as Subtask[];
        }
        return [];
    }

    replaceLink(text) {
        const regex = /(http|https):\/\/[a-zA-Z0-9\-.]+\.[a-zA-Z]{2,}(\/\S*)?/g;
        return text.replace(regex, href => `<a href="${href}" class="task-link" target="_blank">${href}</a>`);
    }

    selectFormGroup(groupId) {
        this.formTask.selectedGroupId = groupId;
    }

    handleFormSubmit(event) {
        const { elements } = event.target;
        const text = elements.text.value.trim();
        const groupId = this.formTask.selectedGroupId || "unorganized";
        const { tasks } = this.groups.find(({ id }) => id === groupId);
        const task: Task = {
            text,
            displayText: this.replaceLink(text),
            subtasks: this.getSubtasks(elements.subtask) as Subtask[],
            labels: this.getFlaggedLabels()
        };

        if (this.formTask.makingEdit) {
            const { index } = this.formTask;

            if (groupId !== this.formTask.groupId) {
                const group = this.groups.find(({ id }) => id === this.formTask.groupId);

                group.tasks.splice(index, 1);
                tasks.unshift(task);
            }
            else {
                tasks[index] = { ...tasks[index], ...task };
            }
        }
        else {
            tasks.unshift(task);
        }
        this.saveTasks();
        this.hideForm();
        event.preventDefault();
    }

    editTask(group, index) {
        const { text, subtasks } = group.tasks[index];

        this.formColor = getRandomHexColor();
        this.formLabels = this.getFormLabels(index);
        this.formTask = {
            index,
            text,
            groupId: group.id,
            makingEdit: true,
            subtasks: [...subtasks]
        };

        this.showItem("form");
    }

    resetRemovingItems() {
        return {
            groups: {
                items: [],
                willBeEmpty: false
            },
            tasks: {
                items: [],
                willBeEmpty: false
            }
        };
    }

    getItemsNotBeingRemoved(items) {
        return items.filter(item => !item.removing);
    }

    removeGroup(index) {
        this.groups[index].removing = true;
        this.removingItems.groups.willBeEmpty = this.getItemsNotBeingRemoved(this.groups).length === 1;
        this.removingItems.groups.items.push(index);
        this.scheduleTaskRemoval();
    }

    removeTask(groupIndex, taskIndex) {
        this.groups[groupIndex].tasks[taskIndex].removing = true;
        this.removingItems.tasks.items.push({ groupIndex, taskIndex });

        for (const group of this.groups) {
            this.removingItems.tasks.willBeEmpty = !this.getItemsNotBeingRemoved(group.tasks).length;

            if (!this.removingItems.tasks.willBeEmpty) {
                break;
            }
        }
        this.scheduleTaskRemoval();
    }

    removeSubtask(groupIndex, taskIndex, subtaskIndex) {
        this.groups[groupIndex].tasks[taskIndex].subtasks[subtaskIndex].removing = true;
        this.removingItems.tasks.items.push({ groupIndex, taskIndex, subtaskIndex });

        this.scheduleTaskRemoval();
    }

    scheduleTaskRemoval() {
        clearTimeout(this.itemRemoveTimeout);
        this.itemRemoveTimeout = window.setTimeout(() => {
            this.removeCompletedTasks();
        }, 8000);
    }

    removeCompletedTasks() {
        this.removingItems = this.resetRemovingItems();
        this.groups = this.getItemsNotBeingRemoved(this.groups);

        for (const group of this.groups) {
            group.tasks = group.tasks.filter(task => {
                task.subtasks = this.getItemsNotBeingRemoved(task.subtasks);
                return !task.removing;
            });
        }
        this.saveTasks();
    }

    undoTaskRemoval() {
        clearTimeout(this.itemRemoveTimeout);

        for (const index of this.removingItems.groups.items) {
            delete this.groups[index].removing;
        }

        for (const { groupIndex, taskIndex, subtaskIndex } of this.removingItems.tasks.items) {
            const task = this.groups[groupIndex].tasks[taskIndex];

            if (subtaskIndex >= 0) {
                delete task.subtasks[subtaskIndex].removing;
            }
            else {
                delete task.removing;
            }
        }
        this.removingItems = this.resetRemovingItems();
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

    getUniqueTaskLabels(taskIndex = -1) {
        let labels: Label[] = [];

        for (const group of this.groups) {
            const groupLabels = group.tasks.reduce((labels, task, index) => {
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

            labels = labels.concat(groupLabels);
        }
        return labels;
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

    createGroup(event) {
        const name = event.target.elements.name.value;
        const id = getRandomString();

        this.groups.push({
            id,
            name,
            expanded: true,
            tasks: []
        });
        event.preventDefault();
        event.target.reset();
        this.saveTasks();
    }

    enableGroupRename(group) {
        group.renameEnabled = true;

        requestAnimationFrame(() => {
            this.groupNameInput.nativeElement.focus();
        });
    }

    renameGroup(group) {
        const oldName = group.name;
        group.name = this.groupNameInput.nativeElement.value || oldName;
        group.renameEnabled = false;

        if (group.name !== oldName) {
            this.saveTasks();
        }
    }

    renameGroupOnEnter(event) {
        event.target.blur();
    }

    handleClickOnContainer() {
        this.zIndex = this.zIndexService.incIfLess(this.zIndex);
    }

    cleanUpTask(task) {
        delete task.removing;
        delete task.displayText;
        return task;
    }

    async saveTasks() {
        const { default: cloneDeep } = await import("lodash.clonedeep");
        const groups = cloneDeep(this.groups);

        this.chromeStorageService.set({ tasks: groups.map(group => {
            delete group.removing;
            group.tasks = group.tasks.map(task => {
                task = this.cleanUpTask(task);
                task.subtasks = task.subtasks.map(this.cleanUpTask);
                return task;
            });
            return group;
        }) });
    }

    saveHeight(height) {
        this.settingService.updateSetting({
            tasks: { height }
        });
    }

    handleTaskDrop({ currentIndex, previousIndex }, { tasks }) {
        moveItemInArray(tasks, previousIndex, currentIndex);
        this.saveTasks();
    }

    handleGroupDrop({ currentIndex, previousIndex }) {
        // Add 1 to the index because first group is hidden and cannot be reordered.
        moveItemInArray(this.groups, previousIndex + 1, currentIndex + 1);
        this.saveTasks();
    }
}
