import { beforeEach, expect, test } from "vitest";
import { increaseZIndex, resetIndexes } from "services/zIndex";

beforeEach(() => {
  resetIndexes();
});

test("should increase z-index", () => {
  const index = increaseZIndex("test");

  expect(index).toBe(2);
});

test("should not increase z-index for the same component", () => {
  let index = increaseZIndex("test");
  expect(index).toBe(2);

  index = increaseZIndex("test");
  expect(index).toBe(2);
});

test("should increase z-index for a different component", () => {
  const index1 = increaseZIndex("test1");

  expect(index1).toBe(2);

  const index2 = increaseZIndex("test2");
  expect(index2).toBe(3);
});
