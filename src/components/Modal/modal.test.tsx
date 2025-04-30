import { expect, test, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Modal from "./Modal";

const hideMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

test("renders children", () => {
  render(
    <Modal hide={hideMock}>
      <div>Test Content</div>
    </Modal>
  );
  expect(screen.getByText("Test Content")).toBeInTheDocument();
});

test("applies transparent class", () => {
  const { container } = render(
    <Modal hide={hideMock} transparent>
      <div>Test Content</div>
    </Modal>
  );
  expect(container.querySelector(".modal-mask")!.classList.contains("transparent")).toBe(true);
});

test("applies hiding class", () => {
  const { container } = render(
    <Modal hide={hideMock} hiding>
      <div>Test Content</div>
    </Modal>
  );
  expect(container.querySelector(".modal-mask")!.classList.contains("hiding")).toBe(true);
});

test("applies custom class", () => {
  const { container } = render(
    <Modal hide={hideMock} className="custom-class">
      <div>Test Content</div>
    </Modal>
  );
  expect(container.querySelector(".modal")!.classList.contains("custom-class")).toBe(true);
});

test("calls hide on mask click", () => {
  const { container } = render(
    <Modal hide={hideMock}>
      <div>Test Content</div>
    </Modal>
  );
  const mask = container.querySelector(".modal-mask")!;

  fireEvent.pointerDown(mask, { target: mask });
  fireEvent.pointerUp(mask, { target: mask });

  expect(hideMock).toHaveBeenCalledTimes(1);
});

test("does not call hide on inner container click", () => {
  const { container } = render(
    <Modal hide={hideMock}>
      <div>Test Content</div>
    </Modal>
  );
  const mask = container.querySelector(".modal-mask")!;
  const modal = mask.firstElementChild;

  fireEvent.pointerDown(modal as Element, { target: container });
  fireEvent.pointerUp(modal as Element, { target: modal });

  expect(hideMock).not.toHaveBeenCalled();
});

test("calls hide on escape key press", () => {
  render(
    <Modal hide={hideMock}>
      <div>Test Content</div>
    </Modal>
  );
  fireEvent.keyDown(window, { key: "Escape" });
  expect(hideMock).toHaveBeenCalledTimes(1);
});
