import { expect, afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import * as matchers from "@testing-library/jest-dom/matchers";

expect.extend(matchers);

interface ChromeStorage {
  get: (keys: string | string[] | object | null) => Promise<any>;
  set: (items: { [key: string]: any }) => Promise<void>;
  getBytesInUse: (id: string) => Promise<number>;
}

const mockChromeStorage: ChromeStorage = {
  get: vi.fn(() => Promise.resolve({})),
  set: vi.fn(),
  getBytesInUse: vi.fn(() => Promise.resolve(500)),
};

Object.defineProperty(window, "chrome", { value: {
  storage: {
    onChanged: {
      addListener: vi.fn(),
    },
    sync: mockChromeStorage,
  },
} });

afterEach(() => {
  cleanup();
});
