import { expect, test, beforeEach, vi, type MockedFunction } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Shortcuts from "./Shortcuts";
import * as chromeStorage from "services/chromeStorage";
import { getSettings } from "services/settings";
import { useSettings } from "contexts/settings";
import locale from "lang/en.json" assert { type: "json" };

vi.mock("utils", async () => {
  return {
    ...(await vi.importActual("utils")),
    getFaviconURL: vi.fn(() => "https://example.com/favicon.ico")
  };
});


vi.mock("services/chromeStorage", () => ({
  get: vi.fn() as MockedFunction<typeof chromeStorage.get>,
  set: vi.fn() as MockedFunction<typeof chromeStorage.set>,
}));

vi.mock("contexts/settings", () => ({
  useSettings: vi.fn(),
}));

const mockItems = [
  { id: "1", title: "Google", url: "https://www.google.com", iconPath: "google.png", hidden: false, custom: false },
  { id: "2", title: "Facebook", url: "https://www.facebook.com", iconPath: "facebook.png", hidden: true, custom: false },
];

beforeEach(() => {
  vi.clearAllMocks();
  (useSettings as any).mockReturnValue({ settings: getSettings() });
});

test("renders shortcuts", async () => {
  (chromeStorage.get as MockedFunction<typeof chromeStorage.get>).mockResolvedValue(mockItems);
  render(<Shortcuts locale={locale}/>);

  const items = await screen.findAllByRole("link");

  expect(items.length).toBe(1);
  expect(items[0]).toHaveTextContent("Google");
  expect(screen.queryByText("Facebook")).not.toBeInTheDocument();
});

test("displays shortcuts when items are available", async () => {
  (chromeStorage.get as MockedFunction<typeof chromeStorage.get>).mockResolvedValue(mockItems);
  render(<Shortcuts locale={locale}/>);

  await waitFor(() => {
    expect(screen.getByText("Google")).toBeInTheDocument();
  });
  expect(screen.queryByText("Facebook")).not.toBeInTheDocument();
});

test("fetches and displays default shortcuts if none are in storage", async () => {
  (chromeStorage.get as MockedFunction<typeof chromeStorage.get>).mockResolvedValue(null);
  render(<Shortcuts locale={locale}/>);

  await waitFor(() => {
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByText("Docs")).toBeInTheDocument();
  });
});

test("toggles edit mode", async () => {
  (chromeStorage.get as MockedFunction<typeof chromeStorage.get>).mockResolvedValue(mockItems);
  render(<Shortcuts locale={locale}/>);

  const editButton = await screen.findByTitle(locale.global.edit);
  await userEvent.click(editButton);

  expect(screen.getByTitle(locale.global.hide)).toBeInTheDocument();
  expect(screen.queryByTitle(locale.global.remove)).toBeNull();

  await userEvent.click(editButton);

  await waitFor(() => {
    expect(screen.queryByTitle(locale.global.hide)).toBeNull();
  });
});

test("toggles item visibility in edit mode", async () => {
  (chromeStorage.get as MockedFunction<typeof chromeStorage.get>).mockResolvedValue(mockItems);
  render(<Shortcuts locale={locale}/>);

  await userEvent.click(await screen.findByTitle(locale.global.edit));

  const toggleButton = screen.getAllByTitle(locale.global.hide)[0];
  await userEvent.click(toggleButton);

  expect(chromeStorage.set).toHaveBeenCalledTimes(1);
  const updatedItems = (chromeStorage.set as MockedFunction<typeof chromeStorage.set>).mock.calls[0][0].shortcuts as any[];
  expect(updatedItems[0].hidden).toBe(true);
});

test("shows and hides the form", async () => {
  (chromeStorage.get as MockedFunction<typeof chromeStorage.get>).mockResolvedValue(mockItems);
  render(<Shortcuts locale={locale}/>);

  await userEvent.click(await screen.findByTitle(locale.global.add));
  expect(screen.getByLabelText("Title")).toBeInTheDocument();

  const hideButton = screen.getByText("Cancel");
  await userEvent.click(hideButton);
  await waitFor(() => {
    expect(screen.queryByLabelText("Title")).toBeNull();
  });
});

test("adds a new item", async () => {
  (chromeStorage.get as MockedFunction<typeof chromeStorage.get>).mockResolvedValue(mockItems);
  render(<Shortcuts locale={locale}/>);

  await userEvent.click(await screen.findByTitle(locale.global.add));
  expect(screen.getByLabelText("Title")).toBeInTheDocument();

  const title = screen.getByPlaceholderText("Google");
  await userEvent.type(title, "Test 1");

  const url = screen.getByPlaceholderText("https://google.com");
  await userEvent.type(url, "https://example.com");

  const addButton = screen.getByText("Add");
  await userEvent.click(addButton);

  expect(chromeStorage.set).toHaveBeenCalledTimes(1);
  const updatedItems = (chromeStorage.set as MockedFunction<typeof chromeStorage.set>).mock.calls[0][0].shortcuts as any[];
  expect(updatedItems.length).toBe(3);
  await waitFor(() => {
    expect(screen.queryByLabelText("Title")).toBeNull();
  });
});

test("removes a custom item", async () => {
  (chromeStorage.get as MockedFunction<typeof chromeStorage.get>).mockResolvedValue([
    ...mockItems,
    {
      id: "123",
      title: "New Item",
      iconPath: "new-item.png",
      url: "https://example.com",
      custom: true
    }
  ]);
  render(<Shortcuts locale={locale}/>);

  const editButton = await screen.findByTitle(locale.global.edit);
  await userEvent.click(editButton);

  const removeButton = screen.getAllByTitle(locale.global.remove)[0];
  await userEvent.click(removeButton);

  expect(chromeStorage.set).toHaveBeenCalledTimes(1);
  const updatedItems = (chromeStorage.set as MockedFunction<typeof chromeStorage.set>).mock.calls[0][0].shortcuts as any[];
  expect(updatedItems.length).toBe(2);
});
