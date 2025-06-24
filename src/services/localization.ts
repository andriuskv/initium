const readableLocales: { [key: string]: string } = {
  "ja": "Japanese",
  "ru": "Russian"
};

let currentLocale: any = null;


function setLocale(locale: any) {
  currentLocale = locale;
}

function getLocale() {
  return currentLocale;
}

function fetchLocale(locale: string) {
  return import(`lang/${locale}.json`, { assert: { type: "json" } });
}

function getReadableLocale(locale: string) {
  return readableLocales[locale];
}

export { setLocale, getLocale, fetchLocale, getReadableLocale };
