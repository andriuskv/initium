type MiddleTopItem = {
  id: "timers" | "clock" | "greeting";
  name: string;
};

type HSLColor = {
  hue: string;
  saturation: string;
  lightness: string;
};

export type WallpaperSettings = {
  provider: "unsplash" | "bing";
  url: string;
  type?: "blob" | "url";
  mimeType?: string;
  id?: string;
  x?: number;
  y?: number;
};

export type GeneralSettings = {
  locale: string;
  openLinkInNewTab: boolean;
  stickyNotesDisabled: boolean;
  shortcutsDisabled: boolean;
  calendarDisabled: boolean;
  greeting: {
    disabled: boolean;
    textSize: number;
  };
  middleTopOrder: MiddleTopItem[];
};

export type AppearanceSettings = {
  animationSpeed: number;
  accentColor: HSLColor;
  panelBackgroundOpacity: number;
  panelBackgroundBlur: number;
  panelBackgroundNoiseAmount: number;
  panelBackgroundNoiseOpacity: number;
  wallpaper: WallpaperSettings;
};

export type TimeDateSettings = {
  format: 12 | 24;
  clockDisabled: boolean;
  clockStyle: "default";
  clockScale: number;
  centerClock: boolean;
  clockFullscreenEnabled: boolean;
  dateHidden: boolean;
  dateScale: number;
  datePosition: "bottom";
  dateAlignment: "center";
  dateLocale: string;
  firstWeekday: 0 | 1;
  worldClocksHidden: boolean;
  reminderPreviewHidden: boolean;
  showTomorrowReminers: boolean;
};

export type MainPanelComponents = {
  topSites: {
    disabled: boolean;
    visibleItemCount: number;
    openInNewTab: boolean;
    addSiteButtonHidden: boolean;
    persistentSitesHidden: boolean;
  };
  notepad: {
    disabled: boolean;
    textSize: number;
  };
  rssFeed: {
    disabled: boolean;
  };
};

export type MainPanelSettings = {
  disabled?: boolean;
  navHidden: boolean;
  components: MainPanelComponents;
};

export type TasksSettings = {
  disabled: boolean;
  defaultGroupVisible: boolean;
  emptyGroupsHidden: boolean;
  countSubtasks: boolean;
  repeatHistoryHidden: boolean;
  showCompletedRepeatingTasks: boolean;
};

export type WeatherSettings = {
  disabled: boolean;
  useGeo: boolean;
  cityName: string;
  units: "C" | "F";
  speedUnits: "m/s" | "ft/s";
};

type TimersSettings = {
  disabled: boolean;
  volume: number;
  fullscreenTextScale: number;
  showMinimal: boolean;
  timer: {
    usePresetNameAsLabel: boolean;
  };
  pomodoro: {
    focus: number;
    short: number;
    long: number;
  };
};

export type Settings = {
  general: GeneralSettings;
  appearance: AppearanceSettings;
  timeDate: TimeDateSettings;
  mainPanel: MainPanelSettings;
  tasks: TasksSettings;
  weather: WeatherSettings;
  timers: TimersSettings;
};
