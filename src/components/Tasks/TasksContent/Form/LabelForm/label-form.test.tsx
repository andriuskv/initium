import { expect, test, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LabelForm from "./LabelForm";
import { getLocalStorageItem } from "utils";
import locale from "lang/en.json" assert { type: "json" };

vi.mock("utils", () => {
  return {
    findFocusableElements: vi.fn().mockReturnValue([]),
    getRandomString: vi.fn(() => "mocked-id"),
    getRandomHexColor: vi.fn(() => "#FFFFFF"),
    getLocalStorageItem: vi.fn()
  };
});

const addUniqueLabelMock = vi.fn();
const removeTaskLabelMock = vi.fn();
const hideMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

test("renders the modal", () => {
  render(
    <LabelForm
      locale={locale}
      addUniqueLabel={addUniqueLabelMock}
      removeTaskLabel={removeTaskLabelMock}
      hide={hideMock}
    />
  );

  expect(screen.getByText(locale.tasks.label_modal_title)).toBeInTheDocument();
});

test("calls hide when cancel button is clicked", async () => {
  render(
    <LabelForm
      locale={locale}
      addUniqueLabel={addUniqueLabelMock}
      removeTaskLabel={removeTaskLabelMock}
      hide={hideMock}
    />
  );

  await userEvent.click(screen.getByText(locale.global.cancel));

  expect(hideMock).toHaveBeenCalledTimes(1);
});

test("calls addUniqueLabel and hide when form is submitted", async () => {
  addUniqueLabelMock.mockReturnValue(true);
  render(
    <LabelForm
      locale={locale}
      addUniqueLabel={addUniqueLabelMock}
      removeTaskLabel={removeTaskLabelMock}
      hide={hideMock}
    />
  );

  const input = screen.getByRole("textbox");
  const button = screen.getByText(locale.global.create);

  fireEvent.input(input, { target: { value: "Test Label" } });
  fireEvent.click(button);

  await waitFor(() => {
    expect(addUniqueLabelMock).toHaveBeenCalledTimes(1);
    expect(hideMock).toHaveBeenCalledTimes(1);
  });
});

test("updates color when color input changes", async () => {
  const { container } = render(
    <LabelForm
      locale={locale}
      addUniqueLabel={addUniqueLabelMock}
      removeTaskLabel={removeTaskLabelMock}
      hide={hideMock}
    />
  );

  const colorInput = screen.getByTitle(locale.global.color_input_title);
  const newColor = "#FFFFFF";

  fireEvent.input(colorInput, { target: { value: newColor } });

  await waitFor(() => {
    const colorPickerContainer = container.querySelector(".task-form-color-picker-container") as HTMLElement;
    expect(colorPickerContainer.style.backgroundColor).toBe("rgb(255, 255, 255)");
  });
});

test("renders existing labels from localStorage", async () => {
  const storedLabels = [
    { name: "Label 1", color: "#FF0000" },
    { name: "Label 2", color: "#00FF00" }
  ];
  (getLocalStorageItem as any).mockReturnValue(storedLabels);

  render(
    <LabelForm
      locale={locale}
      addUniqueLabel={addUniqueLabelMock}
      removeTaskLabel={removeTaskLabelMock}
      hide={hideMock}
    />
  );

  await waitFor(() => {
    expect(screen.getByText("Label 1")).toBeInTheDocument();
    expect(screen.getByText("Label 2")).toBeInTheDocument();
  });
});

test("removes a label when remove button is clicked", async () => {
  const storedLabels = [
    { name: "Label 1", color: "#FF0000" },
    { name: "Label 2", color: "#00FF00" }
  ];
  (getLocalStorageItem as any).mockReturnValue(storedLabels);

  render(
    <LabelForm
      locale={locale}
      addUniqueLabel={addUniqueLabelMock}
      removeTaskLabel={removeTaskLabelMock}
      hide={hideMock}
    />
  );

  const label1Button = screen.getByText("Label 1").closest("button")!;

  await userEvent.click(label1Button);

  expect(removeTaskLabelMock).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("Label 1")).not.toBeInTheDocument();
});
