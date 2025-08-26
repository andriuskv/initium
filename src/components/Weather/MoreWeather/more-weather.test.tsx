import type { WeatherSettings } from "types/settings";
import { expect, test, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useSettings } from "contexts/settings";
import MoreWeather from "./MoreWeather";
import locale from "lang/en.json" assert { type: "json" };
import userEvent from "@testing-library/user-event";

vi.mock("services/widget-pos", () => ({
  handleMoveInit: vi.fn()
}));

vi.mock("contexts/settings", () => ({
  useSettings: vi.fn(),
}));

const localStorageMock = (() => {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    })
  };
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

const mockCurrent = {
  location: "Test Location",
  temperature: 25,
  icon: "test-icon.png",
  iconId: 100,
  precipitation: 10,
  humidity: 60,
  wind: {
    speed: { value: 5 },
    direction: { name: "North", degrees: 0 },
  },
  description: "Clear sky",
};

const mockMore = {
  hourly: [
    { id: 1, time: "12:00", temp: 26 },
    { id: 2, time: "15:00", temp: 27 },
    { id: 3, time: "18:00", temp: 28 },
    { id: 4, time: "21:00", temp: 27 },
  ],
  daily: [
    { id: 1, weekday: "Mon", icon: "day1.png", iconId: 200, description: "Sunny", temperature: { min: 20, max: 30 } },
    { id: 2, weekday: "Tue", icon: "day2.png", iconId: 201, description: "Cloudy", temperature: { min: 22, max: 28 } },
  ],
};

const mockSettings = {
  general: { rememberWidgetState: false },
  appearance: { animationSpeed: 1 },
  timeDate: { dateLocale: "en-US" },
  weather: { units: "C", speedUnits: "m/s", cityName: "Test City", useGeo: false } as WeatherSettings,
};

const mockHide = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  (useSettings as any).mockReturnValue({
    settings: { weather: { units: "C", speedUnits: "m/s" } },
    updateContextSetting: vi.fn(),
  });
});

test("renders correctly with minimal props", () => {
  render(
    <MoreWeather
      current={mockCurrent as any}
      more={mockMore as any}
      settings={mockSettings.weather}
      units="C"
      speedUnits="m/s"
      locale={locale}
      hide={mockHide}
    />
  );

  expect(screen.getByText("Test Location")).toBeInTheDocument();
  expect(screen.getByText("25")).toBeInTheDocument();
  expect(screen.getByText("10%")).toBeInTheDocument();
  expect(screen.getByText("60%")).toBeInTheDocument();
  expect(screen.getByText("5 m/s")).toBeInTheDocument();
  expect(screen.getByText("Clear sky")).toBeInTheDocument();
});

test("renders message when more data is null and message is present", () => {
  render(
    <MoreWeather
      current={mockCurrent as any}
      more={null}
      settings={mockSettings.weather}
      units="C"
      speedUnits="m/s"
      message="Error fetching data"
      locale={locale}
      hide={mockHide}
    />
  );

  expect(screen.getByText("Error fetching data")).toBeInTheDocument();
});

test("renders spinner when more data is null and message is empty", () => {
  const { container } = render(
    <MoreWeather
      current={mockCurrent as any}
      more={null}
      settings={mockSettings.weather}
      units="C"
      speedUnits="m/s"
      locale={locale}
      hide={mockHide}
    />
  );

  expect(container.querySelector("svg")).toBeInTheDocument();
});


test("calls hide function when close button is clicked", async () => {
  render(
    <MoreWeather
      current={mockCurrent as any}
      more={mockMore as any}
      settings={mockSettings.weather}
      units="C"
      speedUnits="m/s"
      locale={locale}
      hide={mockHide}
    />
  );

  await userEvent.click(screen.getByTitle("Close"));

  expect(mockHide).toHaveBeenCalledTimes(1);
});

test("toggles temperature units correctly", async () => {
  const { updateContextSetting } = useSettings();

  const { container, rerender } = render(
    <MoreWeather
      current={mockCurrent as any}
      more={mockMore as any}
      settings={mockSettings.weather}
      units="C"
      speedUnits="m/s"
      locale={locale as any}
      hide={mockHide}
    />
  );

  const tempToggle = screen.getByText(locale.weather.temp_setting_label).nextElementSibling!;

  await userEvent.click(tempToggle);

  expect(updateContextSetting).toHaveBeenCalledWith("weather", { units: "F" });

  (useSettings as any).mockReturnValue({
    settings: { weather: { units: "F", speedUnits: "m/s" } },
    updateContextSetting: vi.fn(),
  });

  rerender(
    <MoreWeather
      current={mockCurrent as any}
      more={mockMore as any}
      settings={mockSettings.weather}
      units="F"
      speedUnits="m/s"
      locale={locale as any}
      hide={mockHide}
    />
  );

  expect(container.querySelector(".weather-more-current-temperature-units")?.textContent).toBe("°F");

});

test("toggles wind speed units correctly", async () => {
  const { updateContextSetting } = useSettings();

  const { container, rerender } = render(
    <MoreWeather
      current={mockCurrent as any}
      more={mockMore as any}
      settings={mockSettings.weather}
      units="C"
      speedUnits="m/s"
      locale={locale as any}
      hide={mockHide}
    />
  );

  const windToggle = screen.getByText(locale.weather.wind_setting_label).nextElementSibling!;

  await userEvent.click(windToggle);

  expect(updateContextSetting).toHaveBeenCalledWith("weather", { speedUnits: "ft/s" });

  rerender(
    <MoreWeather
      current={mockCurrent as any}
      more={mockMore as any}
      settings={mockSettings.weather}
      units="C"
      speedUnits="ft/s"
      locale={locale as any}
      hide={mockHide}
    />
  );

  expect(container.querySelector(".weather-more-current-wind")?.textContent).toContain("ft/s");


});

test("selects and saves the active tab view", async () => {
  render(
    <MoreWeather
      current={mockCurrent as any}
      more={mockMore as any}
      settings={mockSettings.weather}
      units="C"
      speedUnits="m/s"
      locale={locale as any}
      hide={mockHide}
    />
  );

  await userEvent.click(screen.getByText("Precipitation"));
  await waitFor(() => expect(localStorage.setItem).toHaveBeenCalledWith("active-weather-tab", "prec"));
  expect(screen.getByText("Precipitation").closest("button")).toHaveClass("active");
});
