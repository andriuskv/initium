import { createContext, useState, use, useEffect, type PropsWithChildren } from "react";
import { useSettings } from "contexts/settings";
import * as localizationService from "services/localization";

type LocalizationContextType = any;

const LocalizationContext = createContext<LocalizationContextType>({} as LocalizationContextType);

function LocalizationProvider({ children }: PropsWithChildren) {
  const { settings } = useSettings();
  const [locale, setLocale] = useState<any>();

  useEffect(() => {
    document.documentElement.lang = settings.general.locale;
    init();
  }, [settings.general.locale]);

  async function init() {
    const module = await localizationService.fetchLocale(settings.general.locale);

    if (module) {
      setLocale(module.default);
      localizationService.setLocale(module.default);
    }
    else {
      const module = await localizationService.fetchLocale("en");

      setLocale(module.default);
      localizationService.setLocale(module.default);
    }
  }

  return <LocalizationContext value={locale}>{children}</LocalizationContext>;
}

function useLocalization() {
  return use(LocalizationContext);
}

export {
  LocalizationProvider,
  useLocalization
};
