import { expect, test, beforeAll, afterAll, beforeEach, afterEach, vi, type MockedFunction } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import { useLocalization } from "contexts/localization";
import { useSettings } from "contexts/settings";
import { fetchWeather, fetchMoreWeather } from "services/weather";
import Weather from "./Weather";
import locale from "lang/en.json" assert { type: "json" };
import type { ReactNode } from "react";

vi.mock("contexts/localization", () => ({
  useLocalization: vi.fn(),
  LocalizationProvider: ({ children }: { children: ReactNode }) => <>{children}</>
}));

vi.mock("contexts/settings", () => ({
  useSettings: vi.fn(),
}));

vi.mock("services/weather", () => ({
  fetchWeather: vi.fn(),
  fetchMoreWeather: vi.fn(),
}));

vi.mock("services/zIndex", () => ({
  increaseZIndex: vi.fn().mockReturnValue(1),
  handleZIndex: vi.fn(),
}));

const mockCurrentWeather = {
  location: "Test Location",
  temperature: 25,
  description: "Test Description",
  icon: "test-icon.png",
  iconId: 100,
  precipitation: 10,
  humidity: 60,
  wind: { speed: { value: 5 }, direction: { name: "North" } },
  coords: { lat: 0, lon: 0 },
};

const mockMoreWeather = {
  hourly: [{ temperature: 20, wind: { speed: { value: 5 } }, time: "12:00", hour: 12 }],
  daily: [{ temperature: { min: 10, max: 20 } }],
};

const mockSettings = {
  appearance: { animationSpeed: 1 },
  timeDate: { dateLocale: "en-US" },
  weather: { units: "C", speedUnits: "m/s", cityName: "Test City", useGeo: false },
};

beforeAll(() => {
  vi.stubGlobal("jest", {
    advanceTimersByTime: vi.advanceTimersByTime.bind(vi),
  });
});

afterAll(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.clearAllMocks();
  (useLocalization as MockedFunction<typeof useLocalization>).mockReturnValue(locale);
  (useSettings as any).mockReturnValue({ settings: mockSettings });
  (fetchWeather as any).mockResolvedValue(mockCurrentWeather);
  (fetchMoreWeather as any).mockResolvedValue(mockMoreWeather);
});

afterEach(() => {
  vi.resetAllMocks();
});

test("renders current weather information on initial load", async () => {
  render(<Weather timeFormat={24} corner="top-right"/>);
  await waitFor(() => expect(screen.getByText("Test Location")).toBeInTheDocument());

  expect(screen.getByText("25")).toBeInTheDocument();
  expect(screen.getByText("°C")).toBeInTheDocument();
  expect(screen.getByAltText("")).toHaveAttribute("src", "test-icon.png");
});

test("shows more weather information when more button is clicked", async () => {
  render(<Weather timeFormat={24} corner="top-right"/>);

  await waitFor(() => expect(fetchWeather).toHaveBeenCalled());
  await waitFor(() => screen.getByText("Test Location"));

  await userEvent.click(screen.getByTitle(locale.global.more));

  await waitFor(() => expect(fetchMoreWeather).toHaveBeenCalled());
  await waitFor(() => expect(screen.getByText(mockCurrentWeather.description)).toBeInTheDocument());

  expect(await screen.findByText("10%")).toBeInTheDocument();
  expect(await screen.findByText("60%")).toBeInTheDocument();
  expect(await screen.findByText("5 m/s")).toBeInTheDocument();
});

test("updates weather information after a timeout", async () => {
  vi.useFakeTimers();
  render(<Weather timeFormat={24} corner="top-right"/>);
  await waitFor(() => screen.getByText("Test Location"));

  (fetchWeather as any).mockResolvedValue({ ...mockCurrentWeather, temperature: 26 });
  vi.advanceTimersByTime(1200000);

  await waitFor(() => expect(screen.getByText("26")).toBeInTheDocument());
  vi.useRealTimers();
});

test("handles errors when fetching weather", async () => {
  (fetchWeather as any).mockRejectedValue(new Error("Failed to fetch weather"));
  render(<Weather timeFormat={24} corner="top-right"/>);

  await waitFor(() => expect(fetchWeather).toHaveBeenCalled());
});

test("updates more weather information when visible", async () => {
  render(<Weather timeFormat={24} corner="top-right"/>);
  await waitFor(() => screen.getByText("Test Location"));

  await userEvent.click(screen.getByTitle(locale.global.more));
  await waitFor(() => expect(fetchMoreWeather).toHaveBeenCalled());
});

test("fetches weather with city name or geo location after settings change", async () => {
  const { rerender } = render(<Weather timeFormat={24} corner="top-right"/>);
  await waitFor(() => screen.getByText("Test Location"));

  (useSettings as any).mockReturnValue({
    settings: {
      ...mockSettings,
      weather: { ...mockSettings.weather, cityName: "New City" },
    },
  });

  rerender(<Weather timeFormat={24} corner="top-right"/>);
  await waitFor(() => expect(fetchWeather).toHaveBeenCalledTimes(2));
});

test("does not update more weather data within the 20-minute interval", async () => {
  vi.useFakeTimers();
  render(<Weather timeFormat={24} corner="top-right"/>);
  await waitFor(() => screen.getByText("Test Location"));

  const user = userEvent.setup({
    advanceTimers: vi.advanceTimersByTime.bind(vi),
  });

  await user.click(screen.getByTitle(locale.global.more));
  await waitFor(() => expect(fetchMoreWeather).toHaveBeenCalledTimes(1));
  await user.click(await screen.findByTitle(locale.global.close));

  vi.advanceTimersByTime(600000);
  await user.click(screen.getByTitle(locale.global.more));
  await waitFor(() => expect(fetchMoreWeather).toHaveBeenCalledTimes(1));
  vi.useRealTimers();
});

test("handles missing current weather data gracefully", async () => {
  (fetchWeather as any).mockResolvedValue(null);

  const { container } = render(<Weather timeFormat={24} corner="top-right"/>);
  await waitFor(() => expect(fetchWeather).toHaveBeenCalled());
  expect(container.firstChild).toBeNull();
});
