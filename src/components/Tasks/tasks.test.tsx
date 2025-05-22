import { expect, test, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type TasksSettings, type GeneralSettings } from "types/settings";
import { Suspense } from "react";
import { handleZIndex } from "services/zIndex";
import { getSetting } from "services/settings";
import Tasks from "./Tasks";
import locale from "lang/en.json" assert { type: "json" };

vi.mock("services/zIndex", () => ({
  handleZIndex: vi.fn(),
}));

const renderComponent = (props = {}) => {
  return render(
    <Suspense fallback={null}>
      <Tasks
        settings={getSetting("tasks") as TasksSettings}
        generalSettings={getSetting("general") as GeneralSettings}
        corner="top-right"
        locale={locale}
        {...props}
      />
    </Suspense>
  );
};

test("renders Tasks component", async () => {
  renderComponent();
  expect(screen.getByRole("button", { name: locale.tasks.title })).toBeInTheDocument();
});

test("toggles visibility of the tasks container", async () => {
  const { container } = renderComponent();
  const toggleButton = screen.getByRole("button", { name: locale.tasks.title });

  await userEvent.click(toggleButton);
  expect(container.querySelector(".tasks-container")).toHaveClass("visible");

  await userEvent.click(toggleButton);
  expect(container.querySelector(".tasks-container")).not.toHaveClass("visible");
});

test("calls handleZIndex on container click", async () => {
  renderComponent();
  const tasksDiv = screen.getByRole("button", { name: locale.tasks.title }).parentElement;
  await userEvent.click(tasksDiv!);
  expect(handleZIndex).toHaveBeenCalledWith(expect.anything(), "tasks");
});
