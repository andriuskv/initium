import { expect, test, beforeEach, vi, type MockedFunction } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import * as chromeStorage from "services/chromeStorage";
import GreetingEditor from "./GreetingEditor";
import locale from "lang/en.json" assert { type: "json" };

vi.mock("services/chromeStorage");
vi.mock("utils", async () => {
  return {
    ...(await vi.importActual("utils")),
    timeout: vi.fn().mockImplementation((cb) => cb())
  };
});

vi.mock("components/Toast", () => ({
  __esModule: true,
  default: ({ message }: { message: string }) => <div data-testid="mock-toast">{message}</div>,
}));

beforeEach(() => {
  vi.clearAllMocks();

  (chromeStorage.getBytesInUse as MockedFunction<typeof chromeStorage.getBytesInUse>).mockResolvedValue({
    usedFormated: "0 B",
    maxFormated: "1 KB",
    used: 500,
    usedRatio: 0.5,
    max: 1000
  });
});

test("Should get the greetings on init", async () => {
  (chromeStorage.get as MockedFunction<typeof chromeStorage.get>).mockResolvedValue(["Hello", "World"]);

  render(<GreetingEditor locale={locale} hide={() => {}}/>);

  expect(await screen.findByRole("textbox")).toHaveValue("Hello\nWorld");
});

test("Should call set greetings", async () => {
  (chromeStorage.set as MockedFunction<typeof chromeStorage.set>).mockResolvedValue({} as any);
  render(<GreetingEditor locale={locale} hide={() => {}}/>);

  const textArea = screen.getByRole("textbox");
  await userEvent.type(textArea, "newGreeting");

  await waitFor(() => expect(chromeStorage.set).toHaveBeenCalled());
});

test("should display space usage", async () => {
  (chromeStorage.getBytesInUse as MockedFunction<typeof chromeStorage.getBytesInUse>).mockResolvedValue({
    usedFormated: "1 KB", maxFormated: "5 KB",
    used: 0,
    usedRatio: 0,
    max: 0
  });

  render(<GreetingEditor locale={locale} hide={() => {}}/>);

  await waitFor(() => expect(screen.getByText("1 KB / 5 KB")).toBeInTheDocument());
});

test("should call hide when close button is clicked", async () => {
  const hideMock = vi.fn();

  render(<GreetingEditor locale={locale} hide={hideMock}/>);

  await userEvent.click(screen.getByTitle(locale.global.close));
  expect(hideMock).toHaveBeenCalled();
});

test("should show warning message when data is full", async () => {
  (chromeStorage.get as MockedFunction<typeof chromeStorage.get>).mockResolvedValue([]);
  (chromeStorage.getBytesInUse as MockedFunction<typeof chromeStorage.getBytesInUse>).mockResolvedValue({
    usedFormated: "1 KB", maxFormated: "5 KB",
    used: 0,
    usedRatio: 0,
    max: 0
  });
  (chromeStorage.set as MockedFunction<typeof chromeStorage.set>).mockResolvedValue({ usedRatio: 1, message: "Warning" });

  render(<GreetingEditor locale={locale} hide={() => {}} />);

  const textArea = screen.getByRole("textbox");
  await userEvent.type(textArea, "newGreeting");

  expect(await screen.findByTestId("mock-toast")).toBeInTheDocument();
  expect(await screen.findByText("Warning")).toBeInTheDocument();
});
