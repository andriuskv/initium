import { expect, test, beforeEach, vi, type MockedFunction } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { useLocalization } from "contexts/localization";
import { useModal } from "hooks";
import Modal from "components/Modal";
import Groups from "./Groups";
import locale from "lang/en.json" assert { type: "json" };

vi.mock("hooks");
vi.mock("components/Modal");
vi.mock("contexts/localization", () => ({
  useLocalization: vi.fn(),
  LocalizationProvider: ({ children }: { children: ReactNode }) => <>{children}</>
}));

const mockGroups: any = [
  { id: "default", name: "Default", tasks: [], taskCount: 0, expanded: false },
  { id: "group1", name: "Group 1", tasks: [{ id: "task1" }], taskCount: 1, expanded: false},
  { id: "group2", name: "Group 2", tasks: [], taskCount: 0, expanded: false }
];

const mockUpdateGroups = vi.fn();
const mockCreateGroup = vi.fn();
const mockHide = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useLocalization as MockedFunction<typeof useLocalization>).mockReturnValue(locale);
  (useModal as any).mockReturnValue({
    modal: null,
    setModal: vi.fn(),
    hiding: undefined,
    hideModal: vi.fn(),
  });
  (Modal as any).mockImplementation(({ children, ...props }: { children: ReactNode }) => (
    <div data-testid="mock-modal" {...props}>{children}</div>
  ));
});

test("renders tasks group list", () => {
  render(
    <Groups
      groups={mockGroups}
      locale={locale}
      updateGroups={mockUpdateGroups}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );
  expect(screen.getByText("Default")).toBeInTheDocument();
  expect(screen.getByText("Group 1")).toBeInTheDocument();
  expect(screen.getByText("Group 2")).toBeInTheDocument();
});

test("calls hide when done button is clicked", async () => {
  render(
    <Groups
      groups={mockGroups}
      locale={locale}
      updateGroups={mockUpdateGroups}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );

  await userEvent.click(screen.getByText(locale.global.done));
  expect(mockHide).toHaveBeenCalledTimes(1);
});

test("should not be able to remove default group", () => {
  render(
    <Groups
      groups={mockGroups}
      locale={locale}
      updateGroups={mockUpdateGroups}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );

  expect(screen.getAllByRole("menu")[0]).not.toHaveTextContent("Remove");
});

test("handles group removal with empty tasks directly", async () => {
  const mockGroups: any = [
    { id: "default", name: "Default", tasks: [], taskCount: 0, expanded: false },
    { id: "group1", name: "Group 1", tasks: [{ id: "task1" }], taskCount: 1, expanded: false},
    { id: "group2", name: "Group 2", tasks: [], taskCount: 0, expanded: false }
  ];
  render(
    <Groups
      groups={mockGroups}
      locale={locale}
      updateGroups={mockUpdateGroups}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );
  const removeButtons = screen.getAllByRole("button",{ name: /remove/i, hidden: true });

  await userEvent.click(removeButtons[1]);

  expect(mockUpdateGroups).toHaveBeenCalledWith([
    { id: "default", name: "Default", tasks: [], taskCount: 0, expanded: false },
    { id: "group1", name: "Group 1", tasks: [{ id: "task1" }], taskCount: 1, expanded: false }
  ]);
});

test("displays modal for group removal with tasks", async () => {
  render(
    <Groups
      groups={mockGroups}
      locale={locale}
      updateGroups={mockUpdateGroups}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );

  const { setModal } = useModal() as any;
  const removeButtons = screen.getAllByRole("button",{ name: /remove/i, hidden: true });

  await userEvent.click(removeButtons[0]);

  expect(setModal).toHaveBeenCalledWith({ groupIndex: 1 });
});

test("confirms group removal from modal", async () => {
  const mockGroups: any = [
    { id: "default", name: "Default", tasks: [], taskCount: 0, expanded: false },
    { id: "group1", name: "Group 1", tasks: [{ id: "task1" }], taskCount: 1, expanded: false},
    { id: "group2", name: "Group 2", tasks: [], taskCount: 0, expanded: false }
  ];

  (useModal as any).mockReturnValue({
    modal: { groupIndex: 1 },
    setModal: vi.fn(),
    hiding: undefined,
    hideModal: vi.fn(),
  });

  const { hideModal } = useModal() as any;
  const { container } = render(
    <Groups
      groups={mockGroups}
      locale={locale}
      updateGroups={mockUpdateGroups}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );

  expect(screen.getByTestId("mock-modal")).toBeInTheDocument();

  await userEvent.click(container.querySelector(".modal-actions")!.children[1]);

  expect(hideModal).toHaveBeenCalled();
  expect(mockUpdateGroups).toBeCalledTimes(1);
  expect(mockUpdateGroups).toHaveBeenCalledWith([
    { id: "default", name: "Default", tasks: [], taskCount: 0, expanded: false },
    { id: "group2", name: "Group 2", tasks: [], taskCount: 0, expanded: false }
  ]);
});

test("cancels group removal from modal", async () => {
  (useModal as any).mockReturnValue({
    modal: { groupIndex: 1 },
    setModal: vi.fn(),
    hiding: undefined,
    hideModal: vi.fn(),
  });

  render(
    <Groups
      groups={mockGroups}
      locale={locale}
      updateGroups={mockUpdateGroups}
      createGroup={mockCreateGroup}
      hide={mockHide}
    />
  );

  await userEvent.click(screen.getByText(locale.global.cancel));

  const { hideModal } = useModal() as any;

  expect(hideModal).toHaveBeenCalled();
  expect(mockUpdateGroups).not.toHaveBeenCalled();
});
