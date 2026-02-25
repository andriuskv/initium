import type { AppearanceSettings, GeneralSettings } from "types/settings";
import { useState, useEffect, type CSSProperties, useRef } from "react";
import * as chromeStorage from "services/chromeStorage";
import * as timeDate from "services/timeDate";
import "./greeting.css";
import { getLocalStorageItem } from "utils";
import { getSetting } from "services/settings";
import { useLocalization } from "contexts/localization";

function getDayPart() {
  const { hours } = timeDate.getTimeObj();

  if (hours >= 5 && hours < 12) {
    return "morning";
  }
  else if (hours >= 12 && hours < 17) {
    return "afternoon";
  }
  else if (hours >= 17 && hours < 21) {
    return "evening";
  }
  return "night";
}

function getDayPartGreeting(name: string, locale: any) {
  const part = getDayPart();
  const greetings = locale.greeting[part];
  const greeting = greetings[0][Math.floor(Math.random() * greetings[0].length)];
  const message = greetings[1][Math.floor(Math.random() * greetings[1].length)];

  return {
    message: `${greeting}${name ? ` ${name}${locale.locale === "ja" ? "さん" : ""}` : ""},\n${message}`,
    part
  };
}

type PartGreeting = {
  alwaysVisible?: boolean;
  shown?: boolean;
  message?: string;
  hidding?: boolean;
};

export default function Greeting({ settings }: { settings: GeneralSettings["greeting"] }) {
  const locale = useLocalization();
  const [greeting, setGreeting] = useState("");
  const [partGreeting, setPartGreeting] = useState<PartGreeting>({
    alwaysVisible: false,
    shown: false,
    message: ""
  });
  const timeoutId = useRef(0);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      init();
    }
    else {
      initPartGreeting({ ...partGreeting, name: settings.name });
    }

    return () => {
      clearTimeout(timeoutId.current);
    };
  }, [settings.name, partGreeting.alwaysVisible, locale.locale]);

  useEffect(() => {
    chromeStorage.subscribeToChanges(({ greetings }) => {
      if (!greetings) {
        return;
      }
      const values = greetings.newValue as string[] | undefined;

      if (values?.length) {
        setRandomGreeting(values);
        initPartGreeting({ alwaysVisible: false, shown: true });
      }
      else {
        setGreeting("");
        initPartGreeting({ alwaysVisible: true });
      }
    }, { id: "greeting", listenToLocal: true });
  }, [partGreeting]);

  async function init() {
    const greetings = await chromeStorage.get("greetings") as string[];
    let partGreetingVisibility = true;

    if (greetings?.length) {
      setRandomGreeting(greetings);
      partGreetingVisibility = false;
    }
    initPartGreeting({ alwaysVisible: partGreetingVisibility });
  }

  function initPartGreeting(data: { alwaysVisible?: boolean, shown?: boolean, name?: string }) {
    const local = getLocalStorageItem<{ message: string, part: string, name: string, locale: string }>("part-greeting") || { message: "", part: -1, name: "", locale: "" };
    const greetingName = data.name || settings.name;
    let { message, part } = getDayPartGreeting(greetingName, locale);

    if (local.part === part && local.name === greetingName && local.locale === locale.locale) {
      message = local.message;
    }
    else {
      localStorage.setItem("part-greeting", JSON.stringify({ message, part, name: greetingName, locale: locale.locale }));
    }
    setPartGreeting({ alwaysVisible: false, shown: false, ...data, message });

    if (!data.alwaysVisible) {
      clearTimeout(timeoutId.current);
      timeoutId.current = window.setTimeout(() => {
        const { animationSpeed } = getSetting("appearance") as AppearanceSettings;

        setPartGreeting({ alwaysVisible: false, shown: false, message, ...data, hidding: true });

        setTimeout(() => {
          setPartGreeting({ alwaysVisible: false, shown: true, message, ...data });
        }, 200 * animationSpeed);
      }, 5000);
    }
  }

  async function setRandomGreeting(greetings: string[]) {
    const marked = await import("marked");
    const index = Math.floor(Math.random() * greetings.length);
    const greeting = await marked.parse(greetings[index]);

    setGreeting(greeting);
  }

  if (partGreeting.shown && !partGreeting.alwaysVisible) {
    return (
      <div className="greeting"
        style={{ "--text-size-scale": settings.textSize } as CSSProperties}
        dangerouslySetInnerHTML={{ __html: greeting }}>
      </div>
    );
  }
  return (
    <div className={`greeting part-greeting ${partGreeting.hidding ? "hidding" : ""}`}
      style={{ "--text-size-scale": settings.textSize } as CSSProperties}
      dangerouslySetInnerHTML={{ __html: partGreeting.message! }}>
    </div>
  );
}
