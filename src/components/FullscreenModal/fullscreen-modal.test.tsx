import { expect, test, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import FullscreenModal from "./FullscreenModal";

vi.mock("services/focus");

const hideMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

test("renders children", () => {
  render(
    <FullscreenModal hide={hideMock}>
      <div>Test Content</div>
    </FullscreenModal>
  );
  expect(screen.getByText("Test Content")).toBeInTheDocument();
});

test("applies hiding class", () => {
  const { container } = render(
    <FullscreenModal hide={hideMock} hiding>
      <div>Test Content</div>
    </FullscreenModal>
  );
  const element = container.querySelector(".fullscreen-modal")!;

  expect(element.classList.contains("hiding")).toBe(true);
});

test("applies static class when noAnim is true", () => {
  const { container } = render(
    <FullscreenModal hide={hideMock} noAnim>
      <div>Test Content</div>
    </FullscreenModal>
  );
  const element = container.querySelector(".fullscreen-modal")!;

  expect(element.classList.contains("static")).toBe(true);
});

test("does not apply container class when transparent is true", () => {
  const { container } = render(
    <FullscreenModal hide={hideMock} transparent>
      <div>Test Content</div>
    </FullscreenModal>
  );
  const element = container.querySelector(".fullscreen-modal")!;

  expect(element.classList.contains("container")).toBe(false);
});

test("renders with mask", () => {
  const { container } = render(
    <FullscreenModal hide={hideMock} mask>
      <div>Test Content</div>
    </FullscreenModal>
  );
  const element = container.querySelector(".fullscreen-modal-mask")!;

  expect(element).toBeTruthy();
});

test("calls hide on outside click", () => {
  render(
    <FullscreenModal hide={hideMock}>
      <div>Test Content</div>
    </FullscreenModal>
  );

  fireEvent.pointerDown(document.body);
  fireEvent.pointerUp(document.body);

  expect(hideMock).toHaveBeenCalledTimes(1);
});

test("does not call hide on inside click", () => {
  const { container } = render(
    <FullscreenModal hide={hideMock}>
      <div className="fullscreen-modal">Inside Content</div>
    </FullscreenModal>
  );
  const insideElement = container.querySelector(".fullscreen-modal")!;

  fireEvent.pointerDown(insideElement);
  fireEvent.pointerUp(insideElement);

  expect(hideMock).not.toHaveBeenCalled();
});

test("calls hide on escape key press", () => {
  render(
    <FullscreenModal hide={hideMock}>
      <div>Test Content</div>
    </FullscreenModal>
  );

  fireEvent.keyDown(window, { key: "Escape" });

  expect(hideMock).toHaveBeenCalledTimes(1);
});

test("does not call hide on other key presses", () => {
  render(
    <FullscreenModal hide={hideMock}>
      <div>Test Content</div>
    </FullscreenModal>
  );
  fireEvent.keyDown(window, { key: "Enter" });
  expect(hideMock).not.toHaveBeenCalled();
});

test("adds and removes event listeners on mount and unmount", () => {
  const addEventListenerSpy = vi.spyOn(window, "addEventListener");
  const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
  const { unmount } = render(
    <FullscreenModal hide={hideMock}>
      <div>Test Content</div>
    </FullscreenModal>
  );
  expect(addEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  expect(addEventListenerSpy).toHaveBeenCalledWith("pointerdown", expect.any(Function));
  expect(addEventListenerSpy).toHaveBeenCalledWith("pointerup", expect.any(Function));

  unmount();
  expect(removeEventListenerSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  expect(removeEventListenerSpy).toHaveBeenCalledWith("pointerdown", expect.any(Function));
  expect(removeEventListenerSpy).toHaveBeenCalledWith("pointerup", expect.any(Function));
});

test("does not call hide when clicking a select element", () => {
  const { container } = render(
    <FullscreenModal hide={hideMock}>
      <select>
        <option>Option 1</option>
        <option>Option 2</option>
      </select>
    </FullscreenModal>
  );
  const selectElement = container.querySelector("select")!;

  fireEvent.pointerDown(selectElement);
  fireEvent.pointerUp(selectElement);

  expect(hideMock).not.toHaveBeenCalled();
});
