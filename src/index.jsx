import "./styles/base.css";

import "components/Dropdown/dropdown.css";
import "components/Modal/modal.css";
import "components/FullscreenModal/fullscreen-modal.css";

import { createRoot } from "react-dom/client";
import { SettingsProvider } from "contexts/settings";
import { StickyNotesProvider } from "contexts/stickyNotes";
import App from "components/App";

const root = createRoot(document.getElementById("root"));

root.render(
  <SettingsProvider>
    <StickyNotesProvider>
      <App/>
    </StickyNotesProvider>
  </SettingsProvider>
);
