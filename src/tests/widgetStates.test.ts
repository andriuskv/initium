import { beforeEach, expect, test } from "vitest";
import { increaseZIndex, resetIndexes } from "services/widgetStates";

beforeEach(() => {
  resetIndexes();
});

test("should increase z-index", () => {
  const index = increaseZIndex("tasks");

  expect(index).toBe(2);
});

test("should not increase z-index for the same component", () => {
  let index = increaseZIndex("tasks");
  expect(index).toBe(1);

  index = increaseZIndex("tasks");
  expect(index).toBe(1);
});

test("should increase z-index for a different component", () => {
  const index1 = increaseZIndex("tasks");

  expect(index1).toBe(1);

  const index2 = increaseZIndex("weather");
  expect(index2).toBe(2);
});
