import "scss/index.scss";

import "reflect-metadata";
import "zone.js/dist/zone";

import "focus-visible";

import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AppModule } from "./app/app.module";

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}

if (process.env.NODE_ENV === "production") {
    enableProdMode();
}
platformBrowserDynamic().bootstrapModule(AppModule);
