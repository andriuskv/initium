import { expect, test, beforeEach, vi, type MockedFunction } from "vitest";
import { render, screen } from "@testing-library/react";
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
  tasks: [],
  expanded: false
};
const mockEnableGroupEdit = vi.fn();
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
        enableGroupEdit={mockEnableGroupEdit}
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
      enableGroupEdit={mockEnableGroupEdit}
      showRemoveModal={mockShowRemoveModal}
      allowRemoval={false}
    />
  );
  expect(screen.queryByText("Remove")).not.toBeInTheDocument();
});

test("calls enableGroupEdit when edit button is clicked", async () => {
  render(
    <GroupContent
      locale={locale}
      index={0}
      group={mockGroup}
      enableGroupEdit={mockEnableGroupEdit}
      showRemoveModal={mockShowRemoveModal}
    />
  );

  await userEvent.click(screen.getByText("Edit"));

  expect(mockEnableGroupEdit).toHaveBeenCalledTimes(1);
  expect(mockEnableGroupEdit).toHaveBeenCalledWith(mockGroup);
});

test("calls showRemoveModal when remove button is clicked", async () => {
  render(
    <GroupContent
      locale={locale}
      index={0}
      group={mockGroup}
      enableGroupEdit={mockEnableGroupEdit}
      showRemoveModal={mockShowRemoveModal}
    />
  );

  await userEvent.click(screen.getByText("Remove"));

  expect(mockShowRemoveModal).toHaveBeenCalledTimes(1);
  expect(mockShowRemoveModal).toHaveBeenCalledWith(0);
});
