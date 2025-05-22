import { expect, test, afterEach, afterAll, vi } from "vitest";
import { render, waitFor } from "@testing-library/react";
import type { WallpaperSettings } from "types/settings";
import { getIDBWallpaper, resetIDBWallpaper } from "services/wallpaper";
import Wallpaper from "./Wallpaper";

vi.mock("services/wallpaper", () => ({
  getIDBWallpaper: vi.fn(),
  resetIDBWallpaper: vi.fn(),
  fetchWallpaperInfo: vi.fn(() => Promise.resolve({ url: "fetch-test-url" })),
}));

afterEach(() => {
  vi.resetAllMocks();
});

afterAll(() => {
  vi.unstubAllGlobals();
});

const defaultSettings: WallpaperSettings = {
  provider: "unsplash",
  type: "url",
  url: "test-url",
  mimeType: "image/png",
  x: 50,
  y: 50,
};

test("renders without crashing", () => {
  const { container } = render(<Wallpaper settings={defaultSettings}/>);

  expect(container.querySelector(".wallpaper")).toBeInTheDocument();
});

test("renders image wallpaper with correct styles when type is url", async () => {
  const { container } = render(<Wallpaper settings={defaultSettings}/>);

  const wallpaperElement = container.querySelector(".wallpaper");

  expect(wallpaperElement).toHaveStyle("background-image: url(test-url)");
  expect(wallpaperElement).toHaveStyle("background-position: 50% 50%");
});

test("renders video wallpaper", async () => {
  const mockFile = new File(["test"], "test.mp4", { type: "video/mp4" });
  vi.mocked(getIDBWallpaper).mockResolvedValue(mockFile);
  vi.stubGlobal("URL", {
    createObjectURL: vi.fn().mockReturnValue("test-video-url"),
  });

  const settings: WallpaperSettings = {
    provider: "unsplash",
    type: "blob",
    id: "test-id",
    mimeType: "video/mp4",
    x: 50,
    y: 50,
  };

  const { container } = render(<Wallpaper settings={settings}/>);

  await waitFor(() => {
    expect(container.querySelector(".wallpaper-video")).toBeInTheDocument();
    expect((container.querySelector(".wallpaper-video") as HTMLVideoElement).src).toContain("test-video-url");
  });
});

test("fetches wallpaper info", async () => {
  const settings: WallpaperSettings = {
    provider: "unsplash",
    id: "test-id",
    mimeType: "image/png",
    x: 50,
    y: 50,
  };

  const { container } = render(<Wallpaper settings={settings}/>);

  await waitFor(() => {
    const wallpaperElement = container.querySelector(".wallpaper");
    expect(wallpaperElement).toHaveStyle("background-image: url(fetch-test-url)");
  });
});

test("fetches wallpaper info and renders default image if getIDBWallpaper fails", async () => {
  const settings: WallpaperSettings = {
    provider: "unsplash",
    type: "blob",
    id: "test-id",
    mimeType: "image/png",
    x: 50,
    y: 50,
  };

  vi.mocked(getIDBWallpaper).mockRejectedValue(new Error("test-error"));

  const { container } = render(<Wallpaper settings={settings}/>);

  await waitFor(() => {
    const wallpaperElement = container.querySelector(".wallpaper");
    expect(wallpaperElement).toHaveStyle("background-image: url(fetch-test-url)");
  });
  expect(resetIDBWallpaper).toHaveBeenCalledTimes(1);
});

test("removes downscaled wallpaper after a delay", async () => {
  const settings: WallpaperSettings = {
    provider: "unsplash",
    type: "url",
    url: "downscaled-test-url",
    mimeType: "image/png",
    x: 50,
    y: 50,
  };

  const mockedOnload = vi.fn();

  global.Image = vi.fn(() => ({
    onload: () => {},
    set src(string: string) {
      mockedOnload();
      this.onload();
    },
  })) as unknown as typeof Image;

  document.body.innerHTML = `
    <div id="downscaled-wallpaper">Downscaled Wallpaper</div>
  `;

  render(<Wallpaper settings={settings}/>);

  await waitFor(async () => {
    const element = document.getElementById("downscaled-wallpaper");

    expect(mockedOnload).toHaveBeenCalled();
    expect(element).toBeNull();
  });
});

test("updates wallpaper position when settings change", async () => {
  const { container, rerender } = render(<Wallpaper settings={defaultSettings}/>);

  await waitFor(() => {
    const wallpaperElement = container.querySelector(".wallpaper");
    expect(wallpaperElement).toHaveStyle("background-position: 50% 50%");
  });

  const newSettings: WallpaperSettings = {
    ...defaultSettings,
    x: 25,
    y: 75,
  };
  rerender(<Wallpaper settings={newSettings}/>);

  await waitFor(() => {
    const wallpaperElement = container.querySelector(".wallpaper");
    expect(wallpaperElement).toHaveStyle("background-position: 25% 75%");
  });
});
