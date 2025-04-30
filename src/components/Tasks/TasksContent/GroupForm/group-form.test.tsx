import { expect, test, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GroupForm from "./GroupForm";
import locale from "lang/en.json" assert { type: "json" };

const createGroupMock = vi.fn();
const hideMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
});

test("renders inline", () => {
  render(
    <GroupForm
      locale={locale}
      createGroup={createGroupMock}
      hide={hideMock}
    />
  );
  expect(screen.getByPlaceholderText(locale.tasks.group_input_placeholder)).toBeInTheDocument();
});

test("renders as a modal", () => {
  const { container } = render(
    <GroupForm
      locale={locale}
      createGroup={createGroupMock}
      modal={true}
      hide={hideMock}
    />
  );
  expect(container.querySelector(".modal")).toBeInTheDocument();
});

test("calls createGroup on form submit", async () => {
  render(
    <GroupForm
      locale={locale}
      createGroup={createGroupMock}
      hide={hideMock}
    />
  );

  const input = screen.getByPlaceholderText(locale.tasks.group_input_placeholder);
  const button = screen.getByText(locale.global.create);

  fireEvent.change(input, { target: { value: "Test Group" } });
  fireEvent.click(button);

  await waitFor(() => {
    expect(createGroupMock).toHaveBeenCalledTimes(1);
  });
  expect(input).toHaveValue("");
});

test("calls createGroup on form submit and hides modal", async () => {
  render(
    <GroupForm
      locale={locale}
      createGroup={createGroupMock}
      modal={true}
      hide={hideMock}
    />
  );

  const input = screen.getByPlaceholderText(locale.tasks.group_input_placeholder);
  const button = screen.getByText(locale.global.create);

  fireEvent.change(input, { target: { value: "Modal Group" } });
  fireEvent.click(button);

  await waitFor(() => {
    expect(createGroupMock).toHaveBeenCalledTimes(1);
    expect(hideMock).toHaveBeenCalledTimes(1);
  });
});

test("hides modal when cancel button is clicked", async () => {
  render(
    <GroupForm
      locale={locale}
      createGroup={createGroupMock}
      modal={true}
      hide={hideMock}
    />
  );

  fireEvent.click(screen.getByText(locale.global.cancel));

  await waitFor(() => {
    expect(hideMock).toHaveBeenCalledTimes(1);
    expect(createGroupMock).not.toHaveBeenCalled();
  });
});
