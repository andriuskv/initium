import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AppModule } from "./app/app.module";
import "scss/index.scss";

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js");
}
enableProdMode();
platformBrowserDynamic().bootstrapModule(AppModule);
