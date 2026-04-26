import type { Subtask as SubtaskType, TaskType } from "./tasks.type";

type TraversedSubtaskCB = (params: {
  parentTask: SubtaskType,
  subtask: SubtaskType,
  index: number
}) => SubtaskType | SubtaskType[] | undefined;

function traverseSubtasks(parentTask: SubtaskType, targetTaskId: string, cb: TraversedSubtaskCB): SubtaskType[] {
  const nestedSubtasks: SubtaskType[] = [];

  if (targetTaskId === parentTask.id) {
    return parentTask.subtasks ?? [];
  }

  if (targetTaskId === "") {
    for (const [index, subtask] of (parentTask.subtasks ?? []).entries()) {
      const updatedSubtask = cb({
        parentTask,
        subtask,
        index
      }) as SubtaskType | undefined;

      if (Array.isArray(updatedSubtask)) {
        throw new Error("Callback must return a subtask or undefined");
      }

      if (updatedSubtask) {
        nestedSubtasks.push(updatedSubtask);
      }
    }
  }
  else {
    for (const [index, subtask] of (parentTask.subtasks ?? []).entries()) {
      if (subtask.id === targetTaskId) {
        const result = cb({
          parentTask,
          subtask,
          index
        }) as SubtaskType[];

        if (!Array.isArray(result)) {
          throw new Error("Callback must return an array of subtasks");
        }
        return result;
      }
      else {
        nestedSubtasks.push(subtask);
      }
    }
  }

  for (const subtask of nestedSubtasks) {
    if (subtask.subtasks) {
      subtask.subtasks = traverseSubtasks(subtask, targetTaskId, cb);
    }
  }
  return nestedSubtasks;
}

type FindSubtaskResult = {
  parentTask: SubtaskType,
  subtask: SubtaskType,
  index: number
} | undefined

function findSubtask(task: SubtaskType | TaskType, targetTaskId: string): FindSubtaskResult {
  if (!targetTaskId) {
    throw new Error("Target task ID is required");
  }

  if (task.id === targetTaskId) {
    throw new Error("You already found a task with this ID, idiot.");
  }

  if (!task.subtasks) {
    return;
  }

  for (const [index, subtask] of task.subtasks.entries()) {
    if (subtask.id === targetTaskId) {
      return {
        parentTask: task,
        subtask,
        index
      };
    }
    const result = findSubtask(subtask, targetTaskId);

    if (result) {
      return result;
    }
  }
}

export {
  traverseSubtasks,
  findSubtask
};
