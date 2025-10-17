import { expect, test, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import WindView from "./WindView";
import { type Hour } from "types/weather";

vi.mock("services/weather");

const mockHourlyDataC: Hour[] = [{
  id: "1",
  temperature: 1,
  tempC: 1,
  precipitation: 20,
  hour: 1,
  time: "13:00",
  wind: { speed: { raw: 5, value: 5 }, direction: { degrees: 90, name: "East" } }
},
{
  id: "2",
  temperature: 2,
  precipitation: 30,
  hour: 2,
  time: "14:00",
  tempC: 2,
  wind: { speed: { raw: 7, value: 7 }, direction: { degrees: 180, name: "South" } }
},
{
  id: "3",
  temperature: 3,
  precipitation: 40,
  hour: 3,
  time: "15:00",
  tempC: 3,
  wind: { speed: { raw: 6, value: 6 }, direction: { degrees: 270, name: "West" } }
},
{
  id: "4",
  temperature: 4,
  precipitation: 10,
  hour: 4,
  time: "16:00",
  tempC: 4,
  wind: { speed: { raw: 4, value: 4 }, direction: { degrees: 0, name: "North" } }
},
{
  id: "5",
  temperature: 5,
  precipitation: 25,
  hour: 5,
  time: "17:00",
  tempC: 5,
  wind: { speed: { raw: 8, value: 8 }, direction: { degrees: 45, name: "Northeast" } }
},
{
  id: "6",
  temperature: 6,
  tempC: 6,
  precipitation: 35,
  hour: 6,
  time: "18:00",
  wind: { speed: { raw: 9, value: 9 }, direction: { degrees: 135, name: "Southwest" } }
}];

beforeEach(() => {
  vi.clearAllMocks();
});

test("renders wind values and icons correctly in m/s", () => {
  render(<WindView hourly={mockHourlyDataC} speedUnits="m/s"/>);

  expect(screen.getAllByText(/m\/s/)).toHaveLength(2);
  expect(screen.getByText("7 m/s")).toBeInTheDocument();
  expect(screen.getByText("8 m/s")).toBeInTheDocument();

  expect(screen.getByTitle("South")).toBeInTheDocument();
  expect(screen.getByTitle("Northeast")).toBeInTheDocument();
});

test("renders wind values and icons correctly in ft/s", () => {
  render(<WindView hourly={mockHourlyDataC} speedUnits="ft/s" />);

  expect(screen.getAllByText(/ft\/s/)).toHaveLength(2);
  expect(screen.getByText("7 ft/s")).toBeInTheDocument();
  expect(screen.getByText("8 ft/s")).toBeInTheDocument();

  expect(screen.getByTitle("South")).toBeInTheDocument();
  expect(screen.getByTitle("Northeast")).toBeInTheDocument();
});
