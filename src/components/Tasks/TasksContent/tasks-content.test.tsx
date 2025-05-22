import { expect, test, beforeEach, vi, type MockedFunction } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TasksContent from "./TasksContent";
import * as chromeStorage from "services/chromeStorage";
import { getSetting } from "services/settings";
import { useLocalization } from "contexts/localization";
import { timeout, replaceLink } from "utils";
import type { TasksSettings, GeneralSettings } from "types/settings";
import type { Group, TaskType } from "../tasks.type";
import locale from "lang/en.json" assert { type: "json" };
import type { ReactNode } from "react";

vi.mock("services/chromeStorage");
vi.mock("utils", async () => {
  return {
    ...(await vi.importActual("utils")),
    getRandomString: vi.fn(),
    timeout: vi.fn(),
    replaceLink: vi.fn()
  };
});

vi.mock("contexts/localization", () => ({
  useLocalization: vi.fn(),
  LocalizationProvider: ({ children }: { children: ReactNode }) => <>{children}</>
}));

const mockTasksSettings: TasksSettings = {
  disabled: false,
  showCompletedRepeatingTasks: false,
  defaultGroupVisible: true,
  emptyGroupsHidden: false,
  countSubtasks: false,
  repeatHistoryHidden: false
};

const generalSettings = getSetting("general") as GeneralSettings;

const baseTask: TaskType = {
  id: "1",
  rawText: "Test Task",
  text: "Test Task",
  creationDate: Date.now(),
  subtasks: [],
  labels: [],
};

const defaultGroup: Group = {
  id: "default",
  name: "Default",
  expanded: true,
  taskCount: 1,
  tasks: [baseTask]
};


beforeEach(() => {
  vi.clearAllMocks();
  (useLocalization as MockedFunction<typeof useLocalization>).mockReturnValue(locale);
  (chromeStorage.get as MockedFunction<typeof chromeStorage.get>).mockResolvedValue([defaultGroup]);
  (timeout as MockedFunction<typeof timeout>).mockImplementation(fn => { fn(); return 0; });
  (replaceLink as MockedFunction<typeof replaceLink>).mockImplementation((text: string) => text);
});

test("displays tasks", async () => {
  render(
    <TasksContent
      settings={mockTasksSettings}
      generalSettings={generalSettings}
      locale={locale}
      expanded={false}
      toggleSize={vi.fn()}
    />
  );

  await waitFor(() => expect(screen.getByText("Test Task")).toBeInTheDocument());
});

test("displays 'No tasks' message when no tasks are present", async () => {
  (chromeStorage.get as MockedFunction<typeof chromeStorage.get>).mockResolvedValue([]);

  render(
    <TasksContent
      settings={mockTasksSettings}
      generalSettings={generalSettings}
      locale={locale}
      expanded={false}
      toggleSize={vi.fn()}
    />
  );

  await waitFor(() => expect(screen.getByText("No tasks.")).toBeInTheDocument());
});

test("opens task form when create button is clicked", async () => {
  render(
    <TasksContent
      settings={mockTasksSettings}
      generalSettings={generalSettings}
      locale={locale}
      expanded={false}
      toggleSize={vi.fn()}
    />
  );

  const createButton = await screen.findByRole("button", { name: "Create" });
  await userEvent.click(createButton);

  await waitFor(() => expect(screen.getByPlaceholderText(/details/i)).toBeInTheDocument());
});

test("toggles group visibility when group toggle button is clicked", async () => {
  render(
    <TasksContent
      settings={mockTasksSettings}
      generalSettings={generalSettings}
      locale={locale}
      expanded={false}
      toggleSize={vi.fn()}
    />
  );

  const groupToggleButton = await screen.findByRole("button", { name: /default/i });
  await userEvent.click(groupToggleButton);

  expect(screen.getByTitle("Expand")).toBeInTheDocument();

  await userEvent.click(groupToggleButton);

  expect(screen.queryByTitle("Collapse")).toBeInTheDocument();
});

test("updates tasks when chrome storage changes", async () => {
  render(
    <TasksContent
      settings={mockTasksSettings}
      generalSettings={generalSettings}
      locale={locale}
      expanded={false}
      toggleSize={vi.fn()}
    />
  );

  await waitFor(() => expect(screen.getByText("Test Task")).toBeInTheDocument());

  const newTask = { ...baseTask, rawText: "New Task", text: "New Task" };
  (chromeStorage.subscribeToChanges as MockedFunction<typeof chromeStorage.subscribeToChanges>).mock.calls[0][0]({ tasks: { newValue: [{ ...defaultGroup, tasks: [newTask] }] } });

  await waitFor(() => expect(screen.getByText("New Task")).toBeInTheDocument());
  expect(screen.queryByText("Test Task")).toBeNull();
});

test("shows and hides groups component", async () => {
  render(
    <TasksContent
      settings={mockTasksSettings}
      generalSettings={generalSettings}
      locale={locale}
      expanded={false}
      toggleSize={vi.fn()}
    />
  );

  const showGroupsButton = await screen.findByRole("button", { name: "Groups" });
  await userEvent.click(showGroupsButton);

  await waitFor(() => expect(screen.getByText("Done")).toBeInTheDocument());
});
