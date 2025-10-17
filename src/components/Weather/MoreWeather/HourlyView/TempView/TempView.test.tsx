import { expect, test, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import TempView from "./TempView";
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
}
];
const mockHourlyDataF: Hour[] = [{
  id: "1",
  temperature: 10,
  tempC: (10 - 32) / 1.8,
  precipitation: 20,
  hour: 1,
  time: "13:00",
  wind: { speed: { raw: 5, value: 5 }, direction: { degrees: 90, name: "E" } }
},
{
  id: "2",
  temperature: 20,
  tempC: (20 - 32) / 1.8,
  precipitation: 30,
  hour: 2,
  time: "14:00",
  wind: { speed: { raw: 7, value: 7 }, direction: { degrees: 180, name: "S" } }
},
{
  id: "3",
  temperature: 30,
  tempC: (30 - 32) / 1.8,
  precipitation: 40,
  hour: 3,
  time: "15:00",
  wind: { speed: { raw: 6, value: 6 }, direction: { degrees: 270, name: "W" } }
},
{
  id: "4",
  temperature: 40,
  tempC: (40 - 32) / 1.8,
  precipitation: 10,
  hour: 4,
  time: "16:00",
  wind: { speed: { raw: 4, value: 4 }, direction: { degrees: 0, name: "N" } }
},
{
  id: "5",
  temperature: 50,
  tempC: (50 - 32) / 1.8,
  precipitation: 25,
  hour: 5,
  time: "17:00",
  wind: { speed: { raw: 8, value: 8 }, direction: { degrees: 45, name: "NE" } }
},
{
  id: "6",
  temperature: 60,
  tempC: (60 - 32) / 1.8,
  precipitation: 35,
  hour: 6,
  time: "18:00",
  wind: { speed: { raw: 9, value: 9 }, direction: { degrees: 135, name: "SE" } }
}
];

beforeEach(() => {
  vi.clearAllMocks();
});

test("renders temperature values and graph correctly in C", () => {
  render(<TempView hourly={mockHourlyDataC}/>);

  // Every 3 item is rendered starting from index 1
  expect(screen.getAllByText(/°/)).toHaveLength(2);
  expect(screen.getByText("2°")).toBeInTheDocument();
  expect(screen.getByText("5°")).toBeInTheDocument();
});

test("renders temperature values and graph correctly in F", () => {
  render(<TempView hourly={mockHourlyDataF}/>);

  expect(screen.getByText("20°")).toBeInTheDocument();
  expect(screen.getByText("50°")).toBeInTheDocument();

});
