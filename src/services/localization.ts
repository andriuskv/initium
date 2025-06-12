let currentLocale: any = null;

function setLocale(locale: any) {
  currentLocale = locale;
}

function getLocale() {
  return currentLocale;

}

export { setLocale, getLocale };
