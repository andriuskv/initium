import { Pipe } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

@Pipe({
    name: "safeStyle"
})
export class SafeStylePipe {
    constructor(private domSanitizer: DomSanitizer) {}

    transform(style) {
        return this.domSanitizer.bypassSecurityTrustStyle(style);
    }
}
