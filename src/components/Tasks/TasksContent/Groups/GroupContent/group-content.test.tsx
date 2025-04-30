import { expect, test, beforeEach, vi, type MockedFunction } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import GroupContent from "./GroupContent";
import type { Group } from "../../../tasks.type";
import { LocalizationProvider, useLocalization } from "contexts/localization";
import locale from "lang/en.json" assert { type: "json" };

vi.mock("contexts/localization", () => ({
  useLocalization: vi.fn(),
  LocalizationProvider: ({ children }: { children: ReactNode }) => <>{children}</>
}));

const mockGroup: Group = {
  id: "1",
  name: "Test Group",
  taskCount: 5,
  renameEnabled: false,
  tasks: [],
  expanded: false
};
const mockRenameGroup = vi.fn();
const mockEnableGroupRename = vi.fn();
const mockShowRemoveModal = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useLocalization as MockedFunction<typeof useLocalization>).mockReturnValue({ global: { more: "More" } });
});

test("renders group name and task count", () => {
  render(
    <LocalizationProvider>
      <GroupContent
        locale={locale}
        index={0}
        group={mockGroup}
        renameGroup={mockRenameGroup}
        enableGroupRename={mockEnableGroupRename}
        showRemoveModal={mockShowRemoveModal}
      />
    </LocalizationProvider>
  );
  expect(screen.getByText("Test Group")).toBeInTheDocument();
  expect(screen.getByText("5")).toBeInTheDocument();
});

test("does not render remove button when allowRemoval is false", () => {
  render(
    <GroupContent
      locale={locale}
      index={0}
      group={mockGroup}
      renameGroup={mockRenameGroup}
      enableGroupRename={mockEnableGroupRename}
      showRemoveModal={mockShowRemoveModal}
      allowRemoval={false}
    />
  );
  expect(screen.queryByText("Remove")).not.toBeInTheDocument();
});

test("calls enableGroupRename when rename button is clicked", async () => {
  render(
    <GroupContent
      locale={locale}
      index={0}
      group={mockGroup}
      renameGroup={mockRenameGroup}
      enableGroupRename={mockEnableGroupRename}
      showRemoveModal={mockShowRemoveModal}
    />
  );

  await userEvent.click(screen.getByText("Rename"));

  expect(mockEnableGroupRename).toHaveBeenCalledTimes(1);
  expect(mockEnableGroupRename).toHaveBeenCalledWith(mockGroup);
});

test("calls showRemoveModal when remove button is clicked", async () => {
  render(
    <GroupContent
      locale={locale}
      index={0}
      group={mockGroup}
      renameGroup={mockRenameGroup}
      enableGroupRename={mockEnableGroupRename}
      showRemoveModal={mockShowRemoveModal}
    />
  );

  await userEvent.click(screen.getByText("Remove"));

  expect(mockShowRemoveModal).toHaveBeenCalledTimes(1);
  expect(mockShowRemoveModal).toHaveBeenCalledWith(0);
});

test("renders input when renameEnabled is true", () => {
  const renameEnabledGroup: Group = {
    ...mockGroup,
    renameEnabled: true
  };

  render(
    <GroupContent
      locale={locale}
      index={0}
      group={renameEnabledGroup}
      renameGroup={mockRenameGroup}
      enableGroupRename={mockEnableGroupRename}
      showRemoveModal={mockShowRemoveModal}
    />
  );
  const inputElement = screen.getByRole("textbox") as HTMLInputElement;

  expect(inputElement).toBeInTheDocument();
  expect(inputElement.defaultValue).toBe(renameEnabledGroup.name);
  expect(inputElement).toHaveClass("input tasks-group-input");
  expect(inputElement).toHaveFocus();
});

test("calls renameGroup when input is blurred", () => {
  const renameEnabledGroup: Group = {
    ...mockGroup,
    renameEnabled: true
  };
  render(
    <GroupContent
      locale={locale}
      index={0}
      group={renameEnabledGroup}
      renameGroup={mockRenameGroup}
      enableGroupRename={mockEnableGroupRename}
      showRemoveModal={mockShowRemoveModal}
    />
  );
  const inputElement = screen.getByRole("textbox");

  fireEvent.blur(inputElement);

  expect(mockRenameGroup).toHaveBeenCalledTimes(1);
});

test("should blur input on enter", () => {
  const renameEnabledGroup: Group = {
    ...mockGroup,
    renameEnabled: true
  };
  render(
    <GroupContent
      locale={locale}
      index={0}
      group={renameEnabledGroup}
      renameGroup={mockRenameGroup}
      enableGroupRename={mockEnableGroupRename}
      showRemoveModal={mockShowRemoveModal}
    />
  );
  const inputElement = screen.getByRole("textbox") as HTMLInputElement;
  const blurSpy = vi.spyOn(inputElement, "blur");

  fireEvent.keyUp(inputElement, { key: "Enter" });

  expect(blurSpy).toHaveBeenCalledTimes(1);
});
