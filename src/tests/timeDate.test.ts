import { expect, test } from "vitest";
import { adjustTime, getOffsettedCurrentTime, getHoursOffset, padTime, parseDateInputValue } from "services/timeDate";
import { updateSetting, resetSettings } from "services/settings";
import locale from "lang/en.json" assert { type: "json" };

test("should adjust time to 12 hour format", () => {
  const time1 = adjustTime({ hours: 13, minutes: 30 }, 12);
  const time2 = adjustTime({ hours: 0, minutes: 30 }, 12);
  const time3 = adjustTime({ hours: 12, minutes: 30 }, 12);
  const time4 = adjustTime({ hours: 6, minutes: 30 }, 12);

  expect(time1).toEqual({ hours: "1", minutes: "30", period: "PM" });
  expect(time2).toEqual({ hours: "12", minutes: "30", period: "AM" });
  expect(time3).toEqual({ hours: "12", minutes: "30", period: "PM" });
  expect(time4).toEqual({ hours: "6", minutes: "30", period: "AM" });
});

test("should get offsetted current time", () => {
  const currentDate = new Date();
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();

  const offset1 = getOffsettedCurrentTime(0);
  const offset2 = getOffsettedCurrentTime(1000 * 60 * 60 * 2);
  const offset3 = getOffsettedCurrentTime(-1000 * 60 * 60 * 2);

  expect(offset1).toBe(`${hours}:${padTime(minutes)}`);

  expect(offset1).toMatch(/^\d{2}:\d{2}$/);
  expect(offset2).toMatch(/^\d{2}:\d{2}$/);
  expect(offset3).toMatch(/^\d{2}:\d{2}$/);
});

test("should get hours offset", () => {
  const offset1 = getHoursOffset(0, locale);
  const offset2 = getHoursOffset(1000 * 60 * 60 * 2, locale);
  const offset3 = getHoursOffset(-1000 * 60 * 60 * 2, locale);

  const offset6 = getHoursOffset(0, locale, true);
  const offset7 = getHoursOffset(1000 * 60 * 60 * 2, locale, true);
  const offset8 = getHoursOffset(-1000 * 60 * 60 * 2, locale, true);

  expect(offset1).toBe("Current timezone");
  expect(offset2.join("")).toBe("2 hours ahead");
  expect(offset3.join("")).toBe("2 hours behind");
  expect(offset6).toBe("0");
  expect(offset7).toBe("+2");
  expect(offset8).toBe("-2");
});

test("should parse date input", () => {
  resetSettings();

  const date1 = parseDateInputValue("2025-03-20");
  const date2 = parseDateInputValue("2025-03-20T13:30", true);
  const date3 = parseDateInputValue("2025-03-20T00:00", true);
  const date4 = parseDateInputValue("2025-03-20T12:00", true);

  expect(date1).toEqual({ year: 2025, month: 2, day: 20 });
  expect(date2).toEqual({ year: 2025, month: 2, day: 20, hours: 13, minutes: 30, period: "" });
  expect(date3).toEqual({ year: 2025, month: 2, day: 20, hours: 0, minutes: 0, period: "" });
  expect(date4).toEqual({ year: 2025, month: 2, day: 20, hours: 12, minutes: 0, period: "" });

  updateSetting("timeDate", { format: 12 });

  const date5 = parseDateInputValue("2025-03-20T13:30", true);
  const date6 = parseDateInputValue("2025-03-20T00:00", true);
  const date7 = parseDateInputValue("2025-03-20T12:00", true);

  expect(date5).toEqual({ year: 2025, month: 2, day: 20, hours: 1, minutes: 30, period: "PM" });
  expect(date6).toEqual({ year: 2025, month: 2, day: 20, hours: 12, minutes: 0, period: "AM" });
  expect(date7).toEqual({ year: 2025, month: 2, day: 20, hours: 12, minutes: 0, period: "PM" });
});
