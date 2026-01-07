import { expect, test, afterEach, beforeEach, vi, type MockedFunction } from "vitest";
import { render, screen } from "@testing-library/react";
import type { TimeDateSettings } from "types/settings";
import { getDisplayTime, formatDate } from "services/timeDate";
import Clock from "./Clock";

vi.mock("services/timeDate");
vi.mock("utils", async () => {
  return {
    ...(await vi.importActual("utils")),
    getLocalStorageItem: vi.fn(),
    toggleBehindElements: vi.fn()
  };
});

const mockedGetDisplayTime = getDisplayTime as MockedFunction<typeof getDisplayTime>;
const mockedFormatDate = formatDate as MockedFunction<typeof formatDate>;

const defaultSettings: TimeDateSettings = {
  format: 24,
  clockStyle: "default",
  clockDisabled: false,
  clockScale: 1,
  dateLocale: "en-US",
  datePosition: "bottom",
  dateHidden: false,
  dateAlignment: "center",
  dateScale: 1,
  firstWeekday: 0,
  worldClocksHidden: false,
  reminderPreviewHidden: false,
  showTomorrowReminers: false,
  centerClock: false
};

const mockTime24 = {
  hours: "22",
  minutes: "30",
  period: ""
};

const mockTime12 = {
  hours: "10",
  minutes: "30",
  period: "PM"
};

const mockDate = {
  day: 14,
  formatted: "Monday, April 14"
};

beforeEach(() => {
  vi.clearAllMocks();
  const mockTransision = vi.fn();

  document.startViewTransition = mockTransision;

  mockedGetDisplayTime.mockReturnValue(mockTime24);
  mockedFormatDate.mockReturnValue(mockDate.formatted);
  vi.spyOn(global.Date, "now").mockImplementation(() => new Date("2024-04-15T10:30:00").getTime());
});

afterEach(() => {
  vi.restoreAllMocks();
});

test("renders the clock time correctly in 24 hour format", () => {
  render(<Clock settings={defaultSettings} />);

  expect(screen.getByText("22:30")).toBeInTheDocument();
});

test("renders the clock time correctly in 12 hour format", () => {
  mockedGetDisplayTime.mockReturnValue(mockTime12);
  render(<Clock settings={({ ...defaultSettings, format: 12 })} />);

  expect(screen.getByText("10:30")).toBeInTheDocument();
  expect(screen.getByText("PM")).toBeInTheDocument();
});

test("renders the date correctly", () => {
  render(<Clock settings={defaultSettings} />);
  expect(screen.getByText("Monday, April 14")).toBeInTheDocument();
});

test("hides the date when dateHidden is true", () => {
  render(<Clock settings={{ ...defaultSettings, dateHidden: true }} />);
  expect(screen.queryByText("Monday, April 14")).not.toBeInTheDocument();
});
