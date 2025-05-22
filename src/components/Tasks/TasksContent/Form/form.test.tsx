import { expect, test, vi, beforeEach, type MockedFunction } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { useModal, useMessage } from "hooks";
import { getSettings } from "services/settings";
import { useSettings } from "contexts/settings";
import { useLocalization } from "contexts/localization";
import type { Group, TaskForm } from "components/Tasks/tasks.type";
import Form from "./Form";
import locale from "lang/en.json" assert { type: "json" };

vi.mock("contexts/settings", () => ({
  useSettings: vi.fn(),
}));

vi.mock("contexts/localization", () => ({
  useLocalization: vi.fn(),
  LocalizationProvider: ({ children }: { children: ReactNode }) => <>{children}</>
}));

vi.mock("hooks");
vi.mock("utils", async () => ({
  ...(await vi.importActual("utils")),
  getLocalStorageItem: vi.fn(),
}));

const mockGroups: Group[] = [
  { id: "default", name: "Default", tasks: [{
    id: "task1",
    rawText: "Existing Task",
    subtasks: [],
    creationDate: Date.now(),
    expirationDate: Date.now() + 86400000,
    labels: [],
  }], taskCount: 0, expanded: false },
  { id: "group1", name: "Group 1", tasks: [], taskCount: 0, expanded: false },
];

const mockReplaceGroups = vi.fn();
const mockRemoveTask = vi.fn();
const mockCreateGroup = vi.fn();
const mockHide = vi.fn();

const mockTaskForm: TaskForm = {
  updating: true,
  groupIndex: 0,
  taskIndex: 0,
  groupId: "default",
  selectedGroupId: "default",
  completeWithSubtasks: true,
  task: {
    id: "task1",
    rawText: "Existing Task",
    subtasks: [],
    creationDate: Date.now(),
    expirationDate: Date.now() + 86400000
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  (useSettings as any).mockReturnValue({ settings: getSettings() });
  (useLocalization as MockedFunction<typeof useLocalization>).mockReturnValue(locale);
  (useMessage as any).mockReturnValue({
    message: "",
    showMessage: vi.fn(),
    dismissMessage: vi.fn(),
  });
  (useModal as any).mockReturnValue({
    modal: null,
    setModal: vi.fn(),
    hiding: false,
    hideModal: vi.fn(),
  });
});

test("renders form in create mode", () => {
  render(
    <Form
      form={{} as TaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );
  expect(screen.getByPlaceholderText("Details")).toBeInTheDocument();
  expect(screen.getByText("Create")).toBeInTheDocument();
});

test("renders form in update mode with existing data", () => {
  render(
    <Form
      form={mockTaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );
  expect(screen.getByDisplayValue("Existing Task")).toBeInTheDocument();
  expect(screen.getByText("Update")).toBeInTheDocument();
  expect(screen.getByText("Delete")).toBeInTheDocument();
});

test("hides form when cancel button is clicked", async () => {
  render(
    <Form
      form={{} as TaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );
  await userEvent.click(screen.getByText("Cancel"));

  expect(mockHide).toHaveBeenCalledTimes(1);
});

test("doesn't submit form when details are empty", async () => {
  render(
    <Form
      form={{} as TaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );

  const textarea = screen.getByPlaceholderText("Details");
  await userEvent.clear(textarea);

  const submitButton = screen.getByText("Create");
  await userEvent.click(submitButton);

  expect(mockReplaceGroups).not.toHaveBeenCalledTimes(1);
  expect(mockHide).not.toHaveBeenCalledTimes(1);
});

test("handles form submission for creating a new task", async () => {
  render(
    <Form
      form={{} as TaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );

  const textarea = screen.getByPlaceholderText("Details");
  await userEvent.type(textarea, "New Task");

  const submitButton = screen.getByText("Create");
  await userEvent.click(submitButton);

  expect(mockReplaceGroups).toHaveBeenCalledTimes(1);
  expect(mockHide).toHaveBeenCalledTimes(1);
});

test("handles form submission for updating an existing task", async () => {
  render(
    <Form
      form={mockTaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );

  const textarea = screen.getByDisplayValue("Existing Task");
  await userEvent.clear(textarea);
  await userEvent.type(textarea, "Updated Task");

  const submitButton = screen.getByText("Update");
  await userEvent.click(submitButton);

  expect(mockReplaceGroups).toHaveBeenCalledTimes(1);
  expect(mockHide).toHaveBeenCalledTimes(1);
});

test("removes task when delete button is clicked in update mode", async () => {
  render(
    <Form
      form={mockTaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );
  const deleteButton = screen.getByText("Delete");
  await userEvent.click(deleteButton);

  expect(mockRemoveTask).toHaveBeenCalledTimes(1);
});

test("adds subtask", async () => {
  const { container } = render(
    <Form
      form={{} as TaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );
  const addSubtaskButton = screen.getByTitle(locale.tasks.add_subtask_title);

  // Initially, two empty subtask inputs should be present.
  expect(container.querySelectorAll(".task-form-subtask").length).toBe(2);

  await userEvent.click(addSubtaskButton);
  expect(container.querySelectorAll(".task-form-subtask").length).toBe(3);
});

test("removes subtask", async () => {
  const { container } = render(
    <Form
      form={{} as TaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );

  const removeButtons = screen.getAllByRole("button", { name: /remove/i });
  await userEvent.click(removeButtons[0]);

  expect(container.querySelectorAll(".task-form-subtask").length).toBe(1);
});

test("should show subtask preferences", async () => {
  render(
    <Form
      form={{} as TaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );

  const expandButton = screen.getByRole("button", { name: /expand/i });
  await userEvent.click(expandButton);

  expect(screen.getByRole("checkbox")).toBeInTheDocument();
});

test("should replace remove button with a dropdown when complete with subtasks settting is checked", async () => {
  render(
    <Form
      form={{} as TaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );

  const expandButton = screen.getByRole("button", { name: /expand/i });
  await userEvent.click(expandButton);
  await userEvent.click(screen.getByRole("checkbox"));

  expect(screen.getAllByRole("menu")).toHaveLength(2);
});

test("should make subtask optional", async () => {
  render(
    <Form
      form={{} as TaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );
  const expandButton = screen.getByRole("button", { name: /expand/i });
  await userEvent.click(expandButton);
  await userEvent.click(screen.getByRole("checkbox"));

  const optionalButtons = screen.getAllByRole("button", { name: /make optional/i, hidden: true });
  await userEvent.click(optionalButtons[0]);

  expect(screen.getByText("1*")).toBeInTheDocument();
});


test("displays label form modal", async () => {
  (useModal as any).mockReturnValue({
    modal: { type: "label" },
    setModal: vi.fn(),
    hiding: false,
    hideModal: vi.fn(),
  });
  const { setModal } = useModal();

  render(
    <Form
      form={{} as TaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );

  const labelButton = screen.getByTitle(locale.tasks.create_label_title);
  await userEvent.click(labelButton);

  expect(setModal).toHaveBeenCalledWith({ type: "label" });
  expect(screen.getByText("New label")).toBeInTheDocument();
});

test("displays group form modal", async () => {
  (useModal as any).mockReturnValue({
    modal: { type: "group" },
    setModal: vi.fn(),
    hiding: false,
    hideModal: vi.fn(),
  });
  const { setModal } = useModal();

  render(
    <Form
      form={{} as TaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );

  const groupFormButton = screen.getByTitle(locale.tasks.create_group_title);
  await userEvent.click(groupFormButton);

  expect(setModal).toHaveBeenCalledWith({ type: "group" });
  expect(screen.getByText("New group")).toBeInTheDocument();
});

test("adds label", async () => {
  (useModal as any).mockReturnValue({
    modal: { type: "label" },
    setModal: vi.fn(),
    hiding: false,
    hideModal: vi.fn(),
  });

  const { setModal, hideModal } = useModal();
  const { container } = render(
    <Form
      form={{} as TaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );

  const labelButton = screen.getByTitle(locale.tasks.create_label_title);
  await userEvent.click(labelButton);
  expect(setModal).toHaveBeenCalledWith({ type: "label" });
  expect(screen.getByText("New label")).toBeInTheDocument();

  await userEvent.type(container.querySelector(".task-label-form-input")!, "label 1");
  expect(container.querySelector(".task-label-form-input")).toHaveValue("label 1");


  const createButton = container.querySelector(".modal-actions")!.children[1];
  await userEvent.click(createButton);
  expect(hideModal).toBeCalled();
  expect(screen.getByText("label 1")).toBeInTheDocument();
});

test("shows expiration date input when more options are visible", async () => {
  render(
    <Form
      form={{} as TaskForm}
      groups={mockGroups}
      locale={locale}
      replaceGroups={mockReplaceGroups}
      removeTask={mockRemoveTask}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );

  const moreOptionsButton = screen.getByTitle(locale.tasks.more_options_title);
  await userEvent.click(moreOptionsButton);

  const dateTimeInput = screen.getByText(locale.tasks.expiration_date_label);
  expect(dateTimeInput).toBeVisible();
});
