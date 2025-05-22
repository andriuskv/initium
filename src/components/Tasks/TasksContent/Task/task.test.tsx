import { expect, test, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getSettings } from "services/settings";
import { useSettings } from "contexts/settings";
import type { TaskType, Label, Subtask } from "components/Tasks/tasks.type";
import Task from "./Task";
import locale from "lang/en.json" assert { type: "json" };

vi.mock("contexts/settings", () => ({
  useSettings: vi.fn(),
}));

const mockRemoveTask = vi.fn();
const mockRemoveSubtask = vi.fn();
const mockEditTask = vi.fn();

const baseTask: TaskType = {
  id: "1",
  rawText: "Test Task",
  text: "Test Task",
  creationDate: Date.now(),
  subtasks: [],
  labels: [],
};

beforeEach(() => {
  vi.clearAllMocks();
  (useSettings as any).mockReturnValue({ settings: getSettings() });
});

test("renders task with text and complete button", () => {
  render(
    <Task
      locale={locale}
      task={baseTask}
      groupIndex={0}
      taskIndex={0}
      settings={getSettings().tasks}
      removeTask={mockRemoveTask}
      removeSubtask={mockRemoveSubtask}
      editTask={mockEditTask}
    />
  );

  expect(screen.getByText("Test Task")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Complete" })).toBeInTheDocument();
});

test("calls removeTask when complete button is clicked", async () => {
  render(
    <Task
      locale={locale}
      task={baseTask}
      groupIndex={0}
      taskIndex={0}
      settings={getSettings().tasks}
      removeTask={mockRemoveTask}
      removeSubtask={mockRemoveSubtask}
      editTask={mockEditTask}
    />
  );

  await userEvent.click(screen.getByRole("button", { name: "Complete" }));
  expect(mockRemoveTask).toHaveBeenCalledWith(0, 0);
});

test("calls removeSubtask when subtask complete button is clicked", async () => {
  const subtasks: Subtask[] = [{ id: "sub1", rawText: "Subtask 1", text: "Subtask 1" }];
  const taskWithSubtasks: TaskType = { ...baseTask, subtasks };

  render(
    <Task
      locale={locale}
      task={taskWithSubtasks}
      groupIndex={0}
      taskIndex={0}
      settings={getSettings().tasks}
      removeTask={mockRemoveTask}
      removeSubtask={mockRemoveSubtask}
      editTask={mockEditTask}
    />
  );

  expect(screen.getByText("Subtask 1")).toBeInTheDocument();
  await userEvent.click(screen.getAllByRole("button", { name: "Complete" })[1]);
  expect(mockRemoveSubtask).toHaveBeenCalledWith(0, 0, 0);
});

test("renders labels", () => {
  const labels: Label[] = [{ id: "1", name: "Label 1", color: "red" }];
  const taskWithLabels: TaskType = { ...baseTask, labels };

  render(
    <Task
      locale={locale}
      task={taskWithLabels}
      groupIndex={0}
      taskIndex={0}
      settings={getSettings().tasks}
      removeTask={mockRemoveTask}
      removeSubtask={mockRemoveSubtask}
      editTask={mockEditTask}
    />
  );

  expect(screen.getByText("Label 1")).toBeInTheDocument();
});

test("calls editTask when clicked", async () => {
  render(
    <Task
      locale={locale}
      task={baseTask}
      groupIndex={0}
      taskIndex={0}
      settings={getSettings().tasks}
      removeTask={mockRemoveTask}
      removeSubtask={mockRemoveSubtask}
      editTask={mockEditTask}
    />
  );

  await userEvent.click(screen.getByRole("button", { name: "Edit" }));
  expect(mockEditTask).toHaveBeenCalledWith(0, 0);
});

test("renders expiration indicator if expirationDate is present", () => {
  const expirationDate = Date.now() + 86400000;
  const taskWithExpiration: TaskType = { ...baseTask, expirationDate, expirationDateString: "Tomorrow" };

  render(
    <Task
      locale={locale}
      task={taskWithExpiration}
      groupIndex={0}
      taskIndex={0}
      settings={getSettings().tasks}
      removeTask={mockRemoveTask}
      removeSubtask={mockRemoveSubtask}
      editTask={mockEditTask}
    />
  );

  expect(screen.getByTitle(`Expires on Tomorrow`)).toBeInTheDocument();
});

test("renders task as removed if task.removed is true", () => {
  const removedTask: TaskType = { ...baseTask, removed: true };

  const { container } = render(
    <Task
      locale={locale}
      task={removedTask}
      groupIndex={0}
      taskIndex={0}
      settings={getSettings().tasks}
      removeTask={mockRemoveTask}
      removeSubtask={mockRemoveSubtask}
      editTask={mockEditTask}
    />
  );

  expect(container.firstChild).toHaveClass("removed");
});

test("renders subtask as removed if subtask.removed is true", () => {
  const subtasks: Subtask[] = [{ id: "sub1", rawText: "Subtask 1", text: "Subtask 1", removed: true }];
  const taskWithRemovedSubtask: TaskType = { ...baseTask, subtasks };

  const { container } = render(
    <Task
      locale={locale}
      task={taskWithRemovedSubtask}
      groupIndex={0}
      taskIndex={0}
      settings={getSettings().tasks}
      removeTask={mockRemoveTask}
      removeSubtask={mockRemoveSubtask}
      editTask={mockEditTask}
    />
  );

  expect(container.querySelector(".subtask")).toHaveClass("removed");
});

test("renders optional subtask indicator", () => {
  const subtasks: Subtask[] = [{ id: "sub1", rawText: "Subtask 1", text: "Subtask 1", optional: true }];
  const taskWithOptionalSubtask: TaskType = { ...baseTask, subtasks, completeWithSubtasks: true };

  render(
    <Task
      locale={locale}
      task={taskWithOptionalSubtask}
      groupIndex={0}
      taskIndex={0}
      settings={getSettings().tasks}
      removeTask={mockRemoveTask}
      removeSubtask={mockRemoveSubtask}
      editTask={mockEditTask}
    />
  );

  expect(screen.getByText("*")).toBeInTheDocument();
});

test("renders repeat history", () => {
  const taskWithRepeatHistory: TaskType = {
    ...baseTask,
    // @ts-ignore
    repeat: {
      history: [{ id: "1", status: 3 }]
    }
  };

  const { container } = render(
    <Task
      locale={locale}
      task={taskWithRepeatHistory}
      groupIndex={0}
      taskIndex={0}
      settings={getSettings().tasks}
      removeTask={mockRemoveTask}
      removeSubtask={mockRemoveSubtask}
      editTask={mockEditTask}
    />
  );

  expect(container.querySelector(".task-repeat-history")).toBeInTheDocument();
});

test("doesn't render repeat history if repeatHistoryHidden is true", () => {
  const taskWithRepeatHistory: TaskType = {
    ...baseTask,
    // @ts-ignore
    repeat: {
      history: [{ id: "1", status: 3 }]
    }
  };

  const { container } = render(
    <Task
      locale={locale}
      task={taskWithRepeatHistory}
      groupIndex={0}
      taskIndex={0}
      settings={{ ...getSettings().tasks, repeatHistoryHidden: true }}
      removeTask={mockRemoveTask}
      removeSubtask={mockRemoveSubtask}
      editTask={mockEditTask}
    />
  );

  expect(container.querySelector(".task-repeat-history")).not.toBeInTheDocument();
});
