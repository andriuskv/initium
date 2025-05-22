import { expect, test, beforeEach, vi, type MockedFunction } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { LocalizationProvider, useLocalization } from "contexts/localization";
import ToggleBtn from "./ToggleBtn";
import locale from "lang/en.json" assert { type: "json" };

vi.mock("contexts/localization", () => ({
  useLocalization: vi.fn(),
  LocalizationProvider: ({ children }: { children: ReactNode }) => <>{children}</>
}));

const mockToggleDropdown = vi.fn();
const mockRef = { current: null };

beforeEach(() => {
  vi.clearAllMocks();
  (useLocalization as MockedFunction<typeof useLocalization>).mockReturnValue(locale);
});

test("renders with icon and text button", () => {
  render(
    <LocalizationProvider>
      <ToggleBtn
        params={{ isIconTextBtn: true, iconId: "test-icon", title: "Test Button" }}
        visible={false}
        ref={mockRef}
        toggleDropdown={mockToggleDropdown}
      />
    </LocalizationProvider>
  );

  const button = screen.getByRole("button", { name: "Test Button" });
  const textElement = button.querySelector("span");

  expect(button).toBeInTheDocument();
  expect(button).toHaveClass("btn", "icon-text-btn", "dropdown-toggle-btn");

  expect(textElement).toBeInTheDocument();
  expect(textElement).toHaveTextContent("Test Button");
});

test("renders with text button", () => {
  render(
    <LocalizationProvider>
      <ToggleBtn
        params={{ isTextBtn: true, title: "Test Text Button" }}
        visible={false}
        ref={mockRef}
        toggleDropdown={mockToggleDropdown}
      />
    </LocalizationProvider>
  );

  const button = screen.getByRole("button", { name: "Test Text Button" });

  expect(button).toBeInTheDocument();
  expect(button).toHaveClass("btn", "text-btn", "dropdown-toggle-btn");
  expect(button).toHaveTextContent("Test Text Button");
});

test("renders with icon button (default)", () => {
  render(
    <LocalizationProvider>
      <ToggleBtn
        params={{}}
        visible={false}
        ref={mockRef}
        toggleDropdown={mockToggleDropdown}
      />
    </LocalizationProvider>
  );

  const button = screen.getByRole("button", { name: "More" });

  expect(button).toBeInTheDocument();
  expect(button).toHaveClass("btn", "icon-btn", "dropdown-toggle-btn");
  expect(button.querySelector("svg")).toBeInTheDocument();
});


test("calls toggleDropdown on click", async () => {
  render(
    <LocalizationProvider>
      <ToggleBtn
        params={{}}
        visible={false}
        ref={mockRef}
        toggleDropdown={mockToggleDropdown}
      />
    </LocalizationProvider>
  );

  const button = screen.getByRole("button", { name: "More" });

  await userEvent.click(button);
  expect(mockToggleDropdown).toHaveBeenCalled();
});
