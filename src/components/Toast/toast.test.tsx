import { expect, test, beforeAll, afterAll, afterEach, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import Toast from "./Toast";
import locale from "lang/en.json" assert { type: "json" };

const mockDismiss = vi.fn();

beforeAll(() => {
  // https://vitest.dev/api/vi.html#vi-stubglobal
  vi.stubGlobal("jest", {
    advanceTimersByTime: vi.advanceTimersByTime.bind(vi),
  });
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  // Ensures all pending timers are flushed before switching to real timers
  // Reference: https://testing-library.com/docs/using-fake-timers/
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.resetAllMocks();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

test("renders the toast message", () => {
  render(
    <Toast
      message="Test Message"
      locale={locale}
      dismiss={mockDismiss}
    />
  );
  expect(screen.getByText("Test Message")).toBeInTheDocument();
});

test("renders the dismiss button with the correct title", () => {
  render(
    <Toast
      message="Test Message"
      locale={locale}
      dismiss={mockDismiss}
    />
  );

  expect(screen.getByTitle(locale.global.dismiss)).toBeInTheDocument();
});

test("calls dismiss when the dismiss button is clicked", async () => {
  render(
    <Toast
      message="Test Message"
      locale={locale}
      dismiss={mockDismiss}
    />
  );

  const user = userEvent.setup({
    advanceTimers: vi.advanceTimersByTime.bind(vi),
  });
  const dismissButton = screen.getByTitle(locale.global.dismiss);

  await user.click(dismissButton);

  expect(mockDismiss).toHaveBeenCalledTimes(1);
});

test("calls dismiss after the specified duration", async () => {
  render(
    <Toast
      message="Test Message"
      duration={1000}
      locale={locale}
      dismiss={mockDismiss}
    />
  );
  expect(mockDismiss).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1000);
  await waitFor(() => expect(mockDismiss).toHaveBeenCalledTimes(1));
});

test("clears the timeout on unmount", () => {
  const { unmount } = render(
    <Toast
      message="Test Message"
      duration={1000}
      locale={locale}
      dismiss={mockDismiss}
    />
  );
  unmount();
  vi.advanceTimersByTime(2000);
  expect(mockDismiss).not.toHaveBeenCalled();
});

test("does not call dismiss if duration is 0", async () => {
  render(
    <Toast
      message="Test Message"
      duration={0}
      locale={locale}
      dismiss={mockDismiss}
    />
  );
  vi.advanceTimersByTime(2000);
  await waitFor(() => expect(mockDismiss).not.toHaveBeenCalled());
});
