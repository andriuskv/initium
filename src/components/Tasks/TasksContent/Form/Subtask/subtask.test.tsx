import { expect, test, beforeEach, vi, type MockedFunction } from "vitest";
import { render, screen } from "@testing-library/react";
import { type ReactNode } from "react";
import type { Subtask as SubtaskType } from "../../../tasks.type";
import Subtask from "./Subtask";
import { useLocalization } from "contexts/localization";
import locale from "lang/en.json" assert { type: "json" };
import userEvent from "@testing-library/user-event";

vi.mock("contexts/localization", () => ({
  useLocalization: vi.fn(),
  LocalizationProvider: ({ children }: { children: ReactNode }) => <>{children}</>
}));

beforeEach(() => {
  vi.clearAllMocks();
  (useLocalization as MockedFunction<typeof useLocalization>).mockReturnValue(locale);
});

const mockToggleSubtaskReq = vi.fn();
const mockRemoveFormSubtask = vi.fn();

const mockSubtask: SubtaskType = {
  id: "1",
  rawText: "Test Subtask",
  optional: false
};

const renderComponent = (props = {}) => {
  return render(
    <Subtask
      index={0}
      subtask={mockSubtask}
      locale={locale}
      completeWithSubtasks={true}
      toggleSubtaskReq={mockToggleSubtaskReq}
      removeFormSubtask={mockRemoveFormSubtask}
      {...props}
    >
      <button title="Drag"></button>
    </Subtask>
  );
};

test("renders correctly with required subtask", () => {
  renderComponent();
  expect(screen.getByDisplayValue("Test Subtask")).toBeInTheDocument();
  expect(screen.getByTitle("Drag")).toBeInTheDocument();
  expect(screen.getByText("Make optional")).toBeInTheDocument();
  expect(screen.getByText("Remove")).toBeInTheDocument();
});

test("input field has correct default value", () => {
  renderComponent();

  const input = screen.getByRole("textbox") as HTMLInputElement;

  expect(input.value).toEqual("Test Subtask");
});

test("renders correctly with optional subtask", () => {
  renderComponent({ subtask: { ...mockSubtask, optional: true } });
  expect(screen.getByText("1*")).toBeInTheDocument();
  expect(screen.getByText("Make required")).toBeInTheDocument();
});

test("renders correctly without completeWithSubtasks", () => {
  const { container } = renderComponent({ completeWithSubtasks: false });

  expect(container.querySelector(".dropdown")).not.toBeInTheDocument();
  expect(screen.getByTitle("Remove")).toBeInTheDocument();
});

test("calls toggleSubtaskReq when 'Make optional' button is clicked", async () => {
  renderComponent();

  await userEvent.click(screen.getByText("Make optional"));

  expect(mockToggleSubtaskReq).toHaveBeenCalledTimes(1);
  expect(mockToggleSubtaskReq).toHaveBeenCalledWith(0);
});

test("calls toggleSubtaskReq when 'Make required' button is clicked", async () => {
  renderComponent({ subtask: { ...mockSubtask, optional: true } });

  await userEvent.click(screen.getByText("Make required"));
  expect(mockToggleSubtaskReq).toHaveBeenCalledTimes(1);
  expect(mockToggleSubtaskReq).toHaveBeenCalledWith(0);
});

test("calls removeFormSubtask when 'Remove' button is clicked within dropdown", async () => {
  renderComponent();

  await userEvent.click(screen.getByText("Remove"));

  expect(mockRemoveFormSubtask).toHaveBeenCalledTimes(1);
  expect(mockRemoveFormSubtask).toHaveBeenCalledWith(0);
});

test("calls removeFormSubtask when 'Remove' button is clicked (without dropdown)", async () => {
  renderComponent({ completeWithSubtasks: false });

  await userEvent.click(screen.getByTitle("Remove"));

  expect(mockRemoveFormSubtask).toHaveBeenCalledTimes(1);
  expect(mockRemoveFormSubtask).toHaveBeenCalledWith(0);
});
