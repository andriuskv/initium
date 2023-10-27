import { createContext, useState, useContext, useEffect } from "react";
import { useSettings } from "contexts/settings";

const LocalizationContext = createContext();

function LocalizationProvider({ children }) {
  const { settings } = useSettings();
  const [locale, setLocale] = useState(null);

  useEffect(() => {
    init();
  }, [settings.general.locale]);

  async function init() {
    const module = await import(`../lang/${settings.general.locale}.json`, { assert: { type: "json" } });

    if (module) {
      setLocale(module.default);
    }
    else {
      const module = await import("../lang/en.json", { assert: { type: "json" } });

      setLocale(module.default);
    }
  }

  return <LocalizationContext.Provider value={locale}>{children}</LocalizationContext.Provider>;
}

function useLocalization() {
  return useContext(LocalizationContext);
}

export {
  LocalizationProvider,
  useLocalization
};
