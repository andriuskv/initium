import "./styles/base.css";
import "./components/Dropdown/dropdown.css";
import "./components/Modal/modal.css";

import { createRoot } from "react-dom/client";
import { SettingsProvider } from "contexts/settings-context";
import App from "components/App";

const root = createRoot(document.getElementById("root"));

root.render(
  <SettingsProvider>
    <App/>
  </SettingsProvider>
);

navigator.serviceWorker.register("sw.js");
