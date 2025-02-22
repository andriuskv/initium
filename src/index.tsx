import "./styles/base.css";

import "components/Dropdown/dropdown.css";
import "components/Modal/modal.css";
import "components/FullscreenModal/fullscreen-modal.css";
import "components/CreateButton/create-button.css";
import "components/TabsContainer/tabs-container.css";

import { createRoot } from "react-dom/client";
import { SettingsProvider } from "contexts/settings";
import { LocalizationProvider } from "contexts/localization";
import { NotificationProvider } from "contexts/notification";
import { StickyNotesProvider } from "contexts/stickyNotes";
import { PlacementProvider } from "contexts/placement";
import App from "components/App";

const root = createRoot(document.getElementById("root") as HTMLElement);

root.render(
  <SettingsProvider>
    <LocalizationProvider>
      <NotificationProvider>
        <StickyNotesProvider>
          <PlacementProvider>
            <App/>
          </PlacementProvider>
        </StickyNotesProvider>
      </NotificationProvider>
    </LocalizationProvider>
  </SettingsProvider>
);
