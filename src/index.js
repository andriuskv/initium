import "./styles/base.css";
import "./components/Dropdown/dropdown.css";

import { render } from "react-dom";
import { SettingsProvider } from "./contexts/settings-context";
import App from "./components/App";

render(
  <SettingsProvider>
    <App/>
  </SettingsProvider>,
  document.getElementById("root")
);

navigator.serviceWorker.register("sw.js");
